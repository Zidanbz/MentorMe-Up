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
  writeBatch,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const getGrievanceCollection = (workspaceId: string) =>
    collection(db, 'workspaces', workspaceId, 'grievances');

export const getGrievances = async (workspaceId: string, user: { userId: string, userEmail: string }): Promise<Grievance[]> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User authentication details are incomplete.');
  }
  
  const grievanceCollection = getGrievanceCollection(workspaceId);

  let q;
  if (user.userEmail === 'ceo@mentorme.com') {
    // CEO sees all grievances, sorted by most recent
    q = query(grievanceCollection, orderBy('createdAt', 'desc'));
  } else {
    // Other users see only their own grievances. 
    // We remove the orderBy clause to avoid needing a composite index.
    // Sorting will be handled on the client.
    q = query(
      grievanceCollection,
      where('userId', '==', user.userId)
    );
  }

  const snapshot = await getDocs(q);
  // Convert Timestamp to Date for serialization
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Grievance;
  });
};

export const addGrievance = async (
  workspaceId: string,
  data: GrievanceClientData,
  user: { userId: string, userEmail: string }
): Promise<void> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User not authenticated');
  }

  let fileUrl: string | undefined = undefined;
  let filePath: string | undefined = undefined;

  if (data.file && data.file.buffer) {
    try {
      const fileBuffer = Buffer.from(data.file.buffer, 'base64');
      const storagePath = `${workspaceId}/grievances/${user.userId}/${Date.now()}_${data.file.name}`;
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
    seenByCEO: false,
    ...(fileUrl && { fileUrl }),
    ...(filePath && { filePath }),
  };

  const grievanceCollection = getGrievanceCollection(workspaceId);
  await addDoc(grievanceCollection, newGrievance);
};


export const hasNewGrievances = async (workspaceId: string): Promise<boolean> => {
    const grievanceCollection = getGrievanceCollection(workspaceId);
    const q = query(
        grievanceCollection, 
        where('seenByCEO', '==', false),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const markGrievancesAsSeen = async (workspaceId: string): Promise<void> => {
    const grievanceCollection = getGrievanceCollection(workspaceId);
    const q = query(grievanceCollection, where('seenByCEO', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { seenByCEO: true });
    });

    await batch.commit();
};
