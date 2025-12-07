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
    where
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const projectsCollection = collection(db, 'projects');


// Helper to convert single level date properties to Firestore Timestamps
const convertDatesToTimestamps = (data: any): any => {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        if (data[key] instanceof Date) {
            newData[key] = Timestamp.fromDate(data[key]);
        } else if (key === 'completedAt' && data[key] === null) {
            newData[key] = null;
        } else if (key === 'completedAt' && data[key]) {
            newData[key] = serverTimestamp();
        } else {
            newData[key] = data[key];
        }
    }
    return newData;
};


// Project functions
export const getProjects = async (workspaceId: string): Promise<Project[]> => {
    const q = query(projectsCollection, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

    // For backward compatibility: if the workspace is 'mentorme', also fetch projects without a workspaceId.
    if (workspaceId === 'mentorme') {
        const legacyQuery = query(projectsCollection, where('workspaceId', '==', null));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyProjects = legacySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

        // Merge and remove duplicates, giving precedence to projects with workspaceId
        const allProjects = [...projects, ...legacyProjects];
        const uniqueProjects = allProjects.filter((project, index, self) =>
            index === self.findIndex((p) => p.id === project.id)
        );
        // Re-sort after merge
        uniqueProjects.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        return uniqueProjects;
    }
    
    projects.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return projects;
};

export const addProject = async (workspaceId: string, project: Omit<Project, 'id' | 'createdAt' | 'milestones' | 'workspaceId'>): Promise<Project> => {
    const newProject = {
        ...project,
        milestones: [],
        createdAt: serverTimestamp(),
        workspaceId: workspaceId,
    }
    const docRef = await addDoc(projectsCollection, newProject);
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data(), id: docRef.id } as Project;
};

export const updateProject = async (workspaceId: string, id: string, project: Partial<Project>): Promise<void> => {
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, project);
};

export const deleteProject = async (workspaceId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'projects', id);
    await deleteDoc(docRef);
};


// Milestone functions
export const addMilestone = async (workspaceId: string, projectId: string, milestone: Omit<Milestone, 'id' | 'tasks'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        if (projectData.workspaceId !== workspaceId && (workspaceId === 'mentorme' && projectData.workspaceId)) {
            throw new Error("Project does not belong to this workspace!");
        }
        const newMilestone: Milestone = {
            id: uuidv4(),
            name: milestone.name,
            tasks: [],
        };
        const newMilestones = [...(projectData.milestones || []), newMilestone];
        transaction.update(projectRef, { milestones: newMilestones });
    });
};

export const deleteMilestone = async (workspaceId: string, projectId: string, milestoneId: string): Promise<void> => {
     const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
         if (projectData.workspaceId !== workspaceId && (workspaceId === 'mentorme' && projectData.workspaceId)) {
            throw new Error("Project does not belong to this workspace!");
        }
        const newMilestones = projectData.milestones.filter(m => m.id !== milestoneId);
        transaction.update(projectRef, { milestones: newMilestones });
    });
}

// Task functions
export const addTask = async (workspaceId: string, projectId: string, milestoneId: string, task: Omit<Task, 'id' | 'completed' | 'completedAt'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        if (projectData.workspaceId !== workspaceId && (workspaceId === 'mentorme' && projectData.workspaceId)) {
            throw new Error("Project does not belong to this workspace!");
        }
        
        const taskWithDates = convertDatesToTimestamps(task);

        const newTask: Task = {
            id: uuidv4(),
            name: task.name,
            completed: false,
            completedAt: undefined,
            ...(task.description && { description: task.description }),
            ...(taskWithDates.dueDate && { dueDate: taskWithDates.dueDate })
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

export const updateTask = async (workspaceId: string, projectId: string, milestoneId: string, taskId: string, taskUpdate: Partial<Omit<Task, 'id'>>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        if (projectData.workspaceId !== workspaceId && (workspaceId === 'mentorme' && projectData.workspaceId)) {
            throw new Error("Project does not belong to this workspace!");
        }
        
        let updateData = { ...taskUpdate };
        if(taskUpdate.completed) {
            updateData.completedAt = serverTimestamp() as Timestamp;
        } else if (taskUpdate.completed === false) {
            updateData.completedAt = undefined;
        }

        const newMilestones = projectData.milestones.map(m => {
            if (m.id === milestoneId) {
                const newTasks = m.tasks.map(t => {
                    if (t.id === taskId) {
                        return { ...t, ...updateData };
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
     const projectRef = doc(db, 'projects', projectId);
     await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) {
            throw new Error("Project does not exist!");
        }
        const projectData = projectDoc.data() as Project;
        if (projectData.workspaceId !== workspaceId && (workspaceId === 'mentorme' && projectData.workspaceId)) {
            throw new Error("Project does not belong to this workspace!");
        }

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
