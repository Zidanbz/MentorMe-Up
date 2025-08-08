'use server';

import { db, storage } from '@/lib/firebase';
import type { Grievance, GrievanceClientData } from '@/types';
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

export const getGrievances = async (user: { userId: string, userEmail: string }): Promise<Grievance[]> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User authentication details are incomplete.');
  }

  let q;
  if (user.userEmail === 'ceo@mentorme.com') {
    // CEO sees all grievances
    q = query(grievanceCollection, orderBy('createdAt', 'desc'));
  } else {
    // Other users see only their own grievances
    q = query(
      grievanceCollection,
      where('userId', '==', user.userId),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as Grievance)
  );
};

export const addGrievance = async (
  data: GrievanceClientData,
  user: { userId: string, userEmail: string }
): Promise<void> => {
  if (!user || !user.userId) {
    throw new Error('User not authenticated');
  }

  let fileUrl: string | undefined = undefined;
  let filePath: string | undefined = undefined;

  if (data.file && data.file.buffer) {
    try {
      const fileBuffer = Buffer.from(data.file.buffer, 'base64');
      const storagePath = `grievances/${user.userId}/${Date.now()}_${data.file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, fileBuffer, { contentType: data.file.type });
      fileUrl = await getDownloadURL(storageRef);
      filePath = storagePath;
    } catch(e) {
        console.error("File upload failed", e);
        throw new Error("File could not be uploaded.");
    }
  }

  const newGrievance: Omit<Grievance, 'id'> = {
    userId: user.userId,
    userEmail: user.userEmail,
    subject: data.subject,
    description: data.description,
    createdAt: Timestamp.now(),
    status: 'Open' as const,
    ...(fileUrl && { fileUrl }),
    ...(filePath && { filePath }),
  };

  await addDoc(grievanceCollection, newGrievance);
};
