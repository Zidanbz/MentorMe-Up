import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const roleMappings: { [key: string]: UserProfile['role'] } = {
  'ceo@mentorme.com': 'CEO',
  'cfo@mentorme.com': 'CFO',
  'coo@mentorme.com': 'COO',
  'cto@mentorme.com': 'CTO',
  'cmo@mentorme.com': 'CMO',
  'chro@mentorme.com': 'CHRO',
  'cdo@mentorme.com': 'CDO',
  'member@mentorme.com': 'Member',
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};


export const createUserProfile = async (user: { uid: string; email: string | null, displayName: string | null, photoURL: string | null }): Promise<UserProfile> => {
    const { uid, email, displayName, photoURL } = user;
    
    if (!email) throw new Error("Email is required to create a profile.");

    const userRef = doc(db, 'users', uid);
    
    const role = roleMappings[email] || 'Member';

    const newUserProfile: UserProfile = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        photoURL: photoURL || '',
    };

    await setDoc(userRef, newUserProfile);
    return newUserProfile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};


export const getUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};
