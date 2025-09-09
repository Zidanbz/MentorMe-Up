'use client';

import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
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
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const activeWorkspaceId = localStorage.getItem('workspaceId');
        const workspaceName = localStorage.getItem('workspaceName') || 'selected';

        // This can happen if a user lands on a protected page without going through the selection screen
        if (!activeWorkspaceId) {
            await signOut(auth);
            router.push('/');
            setLoading(false);
            return;
        }

        try {
            let profile = await getUserProfile(firebaseUser.uid);

            if (!profile) {
              // This is a new user signing in for the first time. Create a profile for them.
              console.log(`No profile found for UID ${firebaseUser.uid}. Creating new profile in workspace: ${activeWorkspaceId}`);
              profile = await createUserProfile(firebaseUser, activeWorkspaceId);
            }

            // At this point, the user MUST have a profile. Now, validate their workspace.
            if (profile.workspaceId !== activeWorkspaceId) {
              toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: `Your account is not a member of the "${workspaceName}" workspace.`,
              });
              await signOut(auth);
              // Clear state
              setUser(null);
              setUserProfile(null);
            } else {
              // Success! User is authenticated and belongs to the correct workspace.
              setUser(firebaseUser);
              setUserProfile(profile);
              router.push('/dashboard');
            }
        } catch (error) {
            console.error("Authentication or profile processing error:", error);
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'An error occurred during login. Please try again.',
            });
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
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
  }, []);

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
