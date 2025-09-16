
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
  startAfter,
  doc,
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
  console.log("Docs fetched:", snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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

export const getGrievancesPaginated = async (
  workspaceId: string,
  user: GetGrievancesParams,
  pageSize: number,
  startAfterDoc?: any
): Promise<{ grievances: Grievance[]; lastVisible: any | null }> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User authentication details are incomplete.');
  }

  let q;
  if (user.userRole === 'CEO') {
    if (startAfterDoc) {
      q = query(
        grievanceCollection,
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        grievanceCollection,
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }
  } else {
    if (startAfterDoc) {
      q = query(
        grievanceCollection,
        where('userId', '==', user.userId),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        grievanceCollection,
        where('userId', '==', user.userId),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }
  }

  const snapshot = await getDocs(q);
  const grievances = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt:  data.createdAt instanceof Timestamp
    ? data.createdAt.toDate()
    : data.createdAt instanceof Date
      ? data.createdAt
      : new Date(data.createdAt),
    } as Grievance;
  });

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { grievances, lastVisible };
};

export const addGrievance = async (
  workspaceId: string,
  data: GrievanceClientData,
  user: { userId: string, userEmail: string, userRole: string }
): Promise<void> => {
  if (!user || !user.userId || !user.userEmail) {
    throw new Error('User not authenticated');
  }

  if (user.userRole === 'CEO') {
    throw new Error('CEO cannot submit grievances');
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
    createdAt: Timestamp.now().toDate(),
    status: 'Open' as const,
    seenByCEO: false,
    workspaceId: workspaceId,
    type: data.type, // Set type from data
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

export const deleteGrievances = async (workspaceId: string, grievanceIds: string[]): Promise<void> => {
    if (grievanceIds.length === 0) return;

    const batch = writeBatch(db);
    grievanceIds.forEach(id => {
        const docRef = doc(grievanceCollection, id);
        batch.delete(docRef);
    });

    await batch.commit();
};
