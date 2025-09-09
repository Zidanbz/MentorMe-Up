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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        const activeWorkspaceId = localStorage.getItem('workspaceId');
        
        let profile = await getUserProfile(user.uid);

        if (!profile) {
          // This is a new user signing in for the first time.
          if (activeWorkspaceId) {
            try {
              profile = await createUserProfile(user, activeWorkspaceId);
            } catch (error) {
               console.error("Failed to create user profile:", error);
               await signOut(auth); // Sign out on profile creation failure
               return; // Stop execution
            }
          } else {
             // This can happen if a user lands on a protected page without going through login.
             // Force them back to the selection page.
             await signOut(auth);
             router.push('/');
             return; // Stop execution
          }
        }
        
        // At this point, the user has a profile. Now, validate their workspace.
        if (profile.workspaceId !== activeWorkspaceId) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: `You are not a member of the ${localStorage.getItem('workspaceName') || 'selected'} workspace.`,
          });
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
        } else {
          // Success! User is authenticated and in the correct workspace.
          setUser(user);
          setUserProfile(profile);
          router.push('/dashboard');
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
