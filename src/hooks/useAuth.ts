'use client';

import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from './use-toast';
import { signOut } from 'firebase/auth';


type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const activeWorkspaceId = localStorage.getItem('workspaceId');
        const workspaceName = localStorage.getItem('workspaceName') || 'the selected';

        // If user is logged in but there's no workspace selected (e.g., direct navigation)
        // and they are not on the root page, log them out and send to root.
        if (!activeWorkspaceId && pathname !== '/') {
            await signOut(auth);
            router.push('/');
            // No need to continue processing, so we exit early.
            // The state will be updated in the 'else' block below.
        } else {
            try {
                let profile = await getUserProfile(firebaseUser.uid);

                if (!profile) {
                    // This is a new user who has authenticated but doesn't have a profile in Firestore.
                    // We must create one for them in the workspace they just selected.
                    if (activeWorkspaceId) {
                         profile = await createUserProfile(firebaseUser, activeWorkspaceId);
                    } else {
                        // This is an edge case: user is new but somehow lost their workspace selection.
                        // The safest thing is to log them out and have them start over.
                        throw new Error("Workspace selection was lost during sign-up. Please try again.");
                    }
                }

                // Now, with a profile guaranteed to exist, we validate their workspace access.
                if (profile.workspaceId !== activeWorkspaceId) {
                    toast({
                        variant: 'destructive',
                        title: 'Access Denied',
                        description: `Your account is not a member of the "${workspaceName}" workspace.`,
                    });
                    await signOut(auth); // Sign out the user
                    router.push(`/login?workspace=${profile.workspaceId}`); // Redirect to their actual workspace login
                } else {
                    // Success: User is authenticated and belongs to the correct workspace.
                    setUser(firebaseUser);
                    setUserProfile(profile);
                    if (pathname.startsWith('/login') || pathname === '/') {
                        router.push('/dashboard');
                    }
                }
            } catch (error) {
                console.error("Authentication process error:", error);
                const errorMessage = error instanceof Error ? error.message : 'An error occurred during login. Please try again.';
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: errorMessage,
                });
                await signOut(auth);
                // Reset state on error
                setUser(null);
                setUserProfile(null);
                router.push('/');
            }
        }
      } else {
        // No user is signed in.
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Add pathname to dependencies to re-run checks on navigation

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
