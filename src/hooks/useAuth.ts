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
            let activeWorkspaceId = localStorage.getItem('workspaceId');
            
            if (!activeWorkspaceId) {
                const emailDomain = firebaseUser.email?.split('@')[1];
                if (emailDomain === 'mentorme.com') activeWorkspaceId = 'mentorme';
                else if (emailDomain === 'howe.com') activeWorkspaceId = 'homeworkers';
                else if (emailDomain === 'neo.com') activeWorkspaceId = 'neo';
            }

            if (activeWorkspaceId) {
              profile = await createUserProfile(firebaseUser, activeWorkspaceId);
            } else {
              throw new Error("No workspace selected for new user profile. Please log in again.");
            }
          }
          
          setUser(firebaseUser);
          setUserProfile(profile);

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
        } finally {
            setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
