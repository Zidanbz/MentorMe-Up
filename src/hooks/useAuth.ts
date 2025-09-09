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
        const workspaceName = localStorage.getItem('workspaceName') || 'the selected workspace';

        // This is the key logic block.
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          if (!profile) {
            // SCENARIO 1: NEW USER - Profile does not exist.
            // A workspace MUST be selected to create a profile.
            if (activeWorkspaceId) {
              profile = await createUserProfile(firebaseUser, activeWorkspaceId);
              setUser(firebaseUser);
              setUserProfile(profile);
              router.push('/dashboard');
            } else {
              // This can happen if a user is authenticated but lands on a page without a workspace selected.
              // Log them out to force a workspace selection.
              throw new Error("No workspace selected. Please log in again.");
            }
          } else {
            // SCENARIO 2: EXISTING USER - Profile exists.
            // We must now validate if they are accessing the correct workspace.
            if (profile.workspaceId === activeWorkspaceId) {
              // User is in the correct workspace.
              setUser(firebaseUser);
              setUserProfile(profile);
               if (pathname.startsWith('/login') || pathname === '/') {
                  router.push('/dashboard');
               }
            } else {
              // User is trying to access a workspace they don't belong to.
               throw new Error(`Your account does not belong to the "${workspaceName}".`);
            }
          }
        } catch (error) {
           console.error("Authentication process error:", error);
           const errorMessage = error instanceof Error ? error.message : 'An unknown authentication error occurred.';
           toast({
               variant: 'destructive',
               title: 'Access Denied',
               description: errorMessage,
           });
           await signOut(auth);
           setUser(null);
           setUserProfile(null);
           if (pathname !== '/') {
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
  }, []); // Run only once on mount to set up the listener.

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
