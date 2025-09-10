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
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          if (!profile) {
            // SCENARIO 1: NEW USER / FIRST TIME LOGIN IN THIS ENV
            // A workspaceId must be in local storage to create a new profile.
            const activeWorkspaceId = localStorage.getItem('workspaceId');
            if (activeWorkspaceId) {
              profile = await createUserProfile(firebaseUser, activeWorkspaceId);
            } else {
              // This can happen if a user is authenticated but lands on a page without a workspace selected.
              // Forcing a logout is the safest path.
              throw new Error("No workspace selected for new user profile. Please log in again.");
            }
          }
          
          // By this point, the user has a profile.
          // Set user and profile state.
          setUser(firebaseUser);
          setUserProfile(profile);

          // Now, set the local storage to match the user's actual workspace from their profile.
          // This ensures consistency even if they used a different login page.
          localStorage.setItem('workspaceId', profile.workspaceId);
          if (profile.workspaceId === 'mentorme') {
            localStorage.setItem('workspaceName', 'MentorMe Up');
            localStorage.setItem('workspaceIcon', 'Layers3');
          } else if (profile.workspaceId === 'homeworkers') {
            localStorage.setItem('workspaceName', 'Home Workers Up');
            localStorage.setItem('workspaceIcon', 'HomeIcon');
          } else if (profile.workspaceId === 'neo') {
            localStorage.setItem('workspaceName', 'Neo Up');
            localStorage.setItem('workspaceIcon', 'Layers');
          }


          // Redirect to dashboard if they are on a public page
          if (pathname.startsWith('/login') || pathname === '/') {
              router.push('/dashboard');
          }

        } catch (error) {
           console.error("Authentication process error:", error);
           const errorMessage = error instanceof Error ? error.message : 'An unknown authentication error occurred.';
           toast({
               variant: 'destructive',
               title: 'Authentication Error',
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
  }, []); 

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
