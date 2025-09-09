"use client";

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
    // This allows a user to be part of a workspace if it was their first workspace,
    // or if they have been explicitly added later (future functionality).
    // For now, it primarily checks their initial workspace.
    return profile?.workspaceId === workspaceId;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        let profile = await getUserProfile(user.uid);
        if (!profile) {
            const workspaceId = localStorage.getItem('workspaceId');
            if (workspaceId) {
                 profile = await createUserProfile(user, workspaceId);
            } else {
                // If there's no workspaceId, we can't create a complete profile.
                // This might happen if the user lands on an internal page without going through login.
                // For now, we sign them out to force them through the selection flow.
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
