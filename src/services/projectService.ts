import { db } from '@/lib/firebase';
import type { Project, Milestone, Task } from '@/types';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    Timestamp, 
    query, 
    orderBy,
    getDoc,
    runTransaction,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const getProjectsCollection = (workspaceId: string) => 
    collection(db, 'workspaces', workspaceId, 'projects');


// Helper to convert single level date properties to Firestore Timestamps
const convertDatesToTimestamps = (data: any): any => {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        if (data[key] instanceof Date) {
            newData[key] = Timestamp.fromDate(data[key]);
        } else {
            newData[key] = data[key];
        }
    }
    return newData;
};


// Project functions
export const getProjects = async (workspaceId: string): Promise<Project[]> => {
    const projectsCollection = getProjectsCollection(workspaceId);
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
};

export const addProject = async (workspaceId: string, project: Omit<Project, 'id' | 'createdAt' | 'milestones'>): Promise<Project> => {
    const projectsCollection = getProjectsCollection(workspaceId);
    const newProject = {
        ...project,
        milestones: [],
        createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(projectsCollection, newProject);
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data(), id: docRef.id } as Project;
};

export const updateProject = async (workspaceId: string, id: string, project: Partial<Project>): Promise<void> => {
    const docRef = doc(db, 'workspaces', workspaceId, 'projects', id);
    await updateDoc(docRef, project);
};

export const deleteProject = async (workspaceId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'workspaces', workspaceId, 'projects', id);
    await deleteDoc(docRef);
};


// Milestone functions
export const addMilestone = async (workspaceId: string, projectId: string, milestone: Omit<Milestone, 'id' | 'tasks'>): Promise<void> => {
    const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        const newMilestone: Milestone = {
            id: uuidv4(),
            name: milestone.name,
            tasks: [],
        };
        const newMilestones = [...projectData.milestones, newMilestone];
        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const deleteMilestone = async (workspaceId: string, projectId: string, milestoneId: string): Promise<void> => {
     const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        const newMilestones = projectData.milestones.filter(m => m.id !== milestoneId);
        transaction.update(projectRef, { milestones: newMilestones });
    });
}

// Task functions
export const addTask = async (workspaceId: string, projectId: string, milestoneId: string, task: Omit<Task, 'id' | 'completed'>): Promise<void> => {
    const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        
        const newTask: Task = {
            id: uuidv4(),
            name: task.name,
            completed: false,
            ...(task.description && { description: task.description }),
            ...(task.dueDate && { dueDate: Timestamp.fromDate(task.dueDate as Date) })
        }

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                return { ...m, tasks: [...(m.tasks || []), newTask] };
            }
            return m;
        });

        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const updateTask = async (workspaceId: string, projectId: string, milestoneId: string, taskId: string, taskUpdate: Partial<Task>): Promise<void> => {
    const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                const newTasks = m.tasks.map(t => {
                    if (t.id === taskId) {
                        return { ...t, ...convertDatesToTimestamps(taskUpdate) };
                    }
                    return t;
                });
                return { ...m, tasks: newTasks };
            }
            return m;
        });

        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const deleteTask = async (workspaceId: string, projectId: string, milestoneId: string, taskId: string): Promise<void> => {
     const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                const newTasks = m.tasks.filter(t => t.id !== taskId);
                return { ...m, tasks: newTasks };
            }
            return m;
        });

        transaction.update(projectRef, { milestones: newMilestones });
    });
};
