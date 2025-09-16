import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

const grievanceCollection = collection(db, 'grievances');

export const getGrievancesDebug = async (workspaceId: string) => {
  try {
    const q = query(
      grievanceCollection,
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    console.log('Running debug query for grievances with workspaceId:', workspaceId);
    const snapshot = await getDocs(q);
    console.log('Debug query returned docs count:', snapshot.docs.length);
    const grievances = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
      };
    });
    console.log('Debug grievances:', grievances);
    return grievances;
  } catch (error) {
    console.error('Error in getGrievancesDebug:', error);
    throw error;
  }
};
