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
    runTransaction
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const projectsCollection = collection(db, 'projects');

// Helper to convert Firestore Timestamps in nested objects
const convertTimestamps = (data: any): any => {
    if (data?.toDate) {
        return data; // It's already a Timestamp, return as is.
    }
    if (data instanceof Date) {
        return Timestamp.fromDate(data);
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (typeof data === 'object' && data !== null) {
        const res: { [key: string]: any } = {};
        for (const key in data) {
            res[key] = convertTimestamps(data[key]);
        }
        return res;
    }
    return data;
};

// Project functions
export const getProjects = async (): Promise<Project[]> => {
    const q = query(projectsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
};

export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
    const docRef = await addDoc(projectsCollection, project);
    return { ...project, id: docRef.id };
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<void> => {
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, project);
};

export const deleteProject = async (id: string): Promise<void> => {
    const docRef = doc(db, 'projects', id);
    await deleteDoc(docRef);
};


// Milestone functions
export const addMilestone = async (projectId: string, milestone: Omit<Milestone, 'id' | 'dueDate'> & { dueDate?: Date }): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw "Project does not exist!";
        }
        const projectData = projectDoc.data() as Project;
        const newMilestone: Milestone = {
            ...milestone,
            id: uuidv4(),
            dueDate: milestone.dueDate ? Timestamp.fromDate(milestone.dueDate) : undefined,
            tasks: [],
        };
        const newMilestones = [...projectData.milestones, newMilestone];
        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const deleteMilestone = async (projectId: string, milestoneId: string): Promise<void> => {
     const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw "Project does not exist!";
        }
        const projectData = projectDoc.data() as Project;
        const newMilestones = projectData.milestones.filter(m => m.id !== milestoneId);
        transaction.update(projectRef, { milestones: newMilestones });
    });
}


// Task functions
export const addTask = async (projectId: string, milestoneId: string, task: Omit<Task, 'id' | 'dueDate'> & { dueDate?: Date }): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw "Project does not exist!";
        }
        const projectData = projectDoc.data() as Project;
        
        const newTask: Task = {
            ...task,
            id: uuidv4(),
            completed: false,
            dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
        }

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                return { ...m, tasks: [...m.tasks, newTask] };
            }
            return m;
        });

        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const updateTask = async (projectId: string, milestoneId: string, taskId: string, taskUpdate: Partial<Task>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw "Project does not exist!";
        }
        const projectData = projectDoc.data() as Project;

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                const newTasks = m.tasks.map(t => {
                    if (t.id === taskId) {
                        return convertTimestamps({ ...t, ...taskUpdate });
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

export const deleteTask = async (projectId: string, milestoneId: string, taskId: string): Promise<void> => {
     const projectRef = doc(db, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw "Project does not exist!";
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
