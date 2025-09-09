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

        // If user is logged in but there's no workspace selected (e.g., direct navigation to a protected route)
        // and they are not on a public page, log them out and send to root.
        if (!activeWorkspaceId && !pathname.startsWith('/login') && pathname !== '/') {
            await signOut(auth);
            router.push('/');
            // Early exit after sign out
        } else {
            try {
                let profile = await getUserProfile(firebaseUser.uid);

                if (!profile) {
                    // This is a first-time sign-in for this user. Create a profile in the selected workspace.
                    if (activeWorkspaceId) {
                         profile = await createUserProfile(firebaseUser, activeWorkspaceId);
                    } else {
                        // This is an edge case: user is authenticated but no workspace was set.
                        // Safest action is to log them out. This can happen if they clear localStorage
                        // and navigate directly to a protected page.
                        throw new Error("Workspace selection not found. Please log in again.");
                    }
                }

                // Now, with a profile guaranteed to exist, we validate their workspace access.
                if (profile.workspaceId !== activeWorkspaceId) {
                    toast({
                        variant: 'destructive',
                        title: 'Access Denied',
                        description: `Your account is not a member of the "${workspaceName}" workspace.`,
                    });
                    await signOut(auth);
                    router.push('/'); 
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
  }, [pathname, router]); // Dependency on pathname is important to re-run checks.

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
