'use client';

import { useState, useEffect, createContext, useContext, ReactNode, createElement, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';


type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  checkUserWorkspace: (uid: string, workspaceId: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  checkUserWorkspace: async () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserWorkspace = useCallback(async (uid: string, workspaceId: string): Promise<boolean> => {
    const profile = await getUserProfile(uid);
    // If the user has a profile, check if its workspaceId matches the one they're trying to log into.
    // If they don't have a profile yet, this check should effectively be bypassed until the profile is created.
    if (profile) {
      return profile.workspaceId === workspaceId;
    }
    // This case would be for a brand new user who is signing up for the first time.
    // The profile creation logic in onAuthStateChanged will handle associating them with the correct workspace.
    return true; 
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        let profile = await getUserProfile(user.uid);
        if (!profile) {
            // This is a crucial step. If the profile doesn't exist, we create it.
            // This happens for first-time users of either workspace.
            const workspaceId = localStorage.getItem('workspaceId');
            if (workspaceId) {
                 profile = await createUserProfile(user, workspaceId);
            } else {
                // If there's no workspaceId, we can't create a complete profile.
                // This might happen if the user lands on an internal page without going through the selection/login flow.
                // To be safe, we sign them out to force them through the correct flow.
                await auth.signOut();
                setUser(null);
                setUserProfile(null);
                setLoading(false);
                return;
            }
        }
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return createElement(AuthContext.Provider, { value: { user, userProfile, loading, checkUserWorkspace } }, children);
};

export const useAuth = () => {
  return useContext(AuthContext);
};
