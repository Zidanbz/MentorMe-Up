'use server';

import { db, storage, auth } from '@/lib/firebase';
import type { Grievance } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const grievanceCollection = collection(db, 'grievances');

export const getGrievances = async (): Promise<Grievance[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  let q;
  if (user.email === 'ceo@mentorme.com') {
    // CEO sees all grievances
    q = query(grievanceCollection, orderBy('createdAt', 'desc'));
  } else {
    // Other users see only their own grievances
    q = query(
      grievanceCollection,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Grievance)
  );
};

export const addGrievance = async (
  data: { subject: string; description: string; file?: FileList }
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  let fileUrl: string | undefined = undefined;
  let filePath: string | undefined = undefined;

  // Check if a file is present and has content
  if (data.file && data.file.length > 0) {
    const file = data.file[0];
    const storagePath = `grievances/${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
    filePath = storagePath;
  }

  const newGrievance = {
    userId: user.uid,
    userEmail: user.email || 'Unknown',
    subject: data.subject,
    description: data.description,
    fileUrl,
    filePath,
    createdAt: Timestamp.now(),
    status: 'Open' as const,
  };

  await addDoc(grievanceCollection, newGrievance);
};
