import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: any; // Firebase Timestamp
  createdAt: any;
  updatedAt: any;
}

export const getProjectTasks = async (workspaceId: string): Promise<ProjectTask[]> => {
  const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectTask[];
};

export const addProjectTask = async (workspaceId: string, taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'projectTasks'), {
    ...taskData,
    workspaceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const updateProjectTask = async (workspaceId: string, taskId: string, taskData: Partial<Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const taskRef = doc(db, 'projectTasks', taskId);
  await updateDoc(taskRef, {
    ...taskData,
    updatedAt: new Date(),
  });
};

export const deleteProjectTask = async (workspaceId: string, taskId: string) => {
  const taskRef = doc(db, 'projectTasks', taskId);
  await deleteDoc(taskRef);
};
