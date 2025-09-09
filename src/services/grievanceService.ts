'use server';

import { db, storage } from '@/lib/firebase';
import type { Grievance, GrievanceClientData, UserProfile } from '@/types';
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

const grievanceCollection = collection(db, 'grievances');


type GetGrievancesParams = {
    userId: string;
    userEmail: string;
    userRole: UserProfile['role'];
}

export const getGrievances = async (workspaceId: string, user: GetGrievancesParams): Promise<Grievance[]> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User authentication details are incomplete.');
  }
  
  let q;
  if (user.userRole === 'CEO') {
    // CEO sees all grievances for their workspace, sorted by most recent
    q = query(grievanceCollection, where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'));
  } else {
    // Other users see only their own grievances for their workspace. 
    q = query(
      grievanceCollection,
      where('userId', '==', user.userId),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc')
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
    userEmail: user.email,
    subject: data.subject,
    description: data.description,
    createdAt: Timestamp.now(),
    status: 'Open' as const,
    seenByCEO: false,
    workspaceId: workspaceId, // Add workspaceId
    ...(fileUrl && { fileUrl }),
    ...(filePath && { filePath }),
  };

  await addDoc(grievanceCollection, newGrievance);
};


export const hasNewGrievances = async (workspaceId: string): Promise<boolean> => {
    const q = query(
        grievanceCollection, 
        where('seenByCEO', '==', false),
        where('workspaceId', '==', workspaceId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const markGrievancesAsSeen = async (workspaceId: string): Promise<void> => {
    const q = query(grievanceCollection, where('seenByCEO', '==', false), where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { seenByCEO: true });
    });

    await batch.commit();
};
