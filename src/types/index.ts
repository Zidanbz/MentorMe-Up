import { Timestamp } from "firebase/firestore";

export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
  category: 'Legal' | 'Finance' | 'Operations' | 'Reports' | 'HR' | 'Product & Development' | 'Marketing & Sales' | 'Investor & Fundraising' | 'Research & Insights' | 'Template';
  createdAt: Timestamp;
  url: string;
  storagePath: string;
  workspaceId: string | null; // Can be null for legacy data
};

export type Transaction = {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: 'Salary' | 'Marketing' | 'Investment' | 'Operations' | 'Other';
  description: string;
  date: Timestamp;
  workspaceId: string | null; // Can be null for legacy data
};

export type RecentActivity = {
  id:string;
  user: string;
  avatar: string;
  action: string;
  timestamp: string;
};

export type Task = {
  id: string;
  name: string;
  description?: string;
  dueDate?: Timestamp | Date;
  completed: boolean;
  completedAt?: Timestamp | Date | null;
  assignedTo?: string; // User ID
  subTasks?: Task[]; // Nested sub-tasks
  category?: 'Marketing' | 'Finance' | 'Tech' | 'Operations' | 'Other'; // Label warna
};

export type Milestone = {
  id: string;
  name: string;
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  milestones: Milestone[];
  createdAt: Timestamp;
  workspaceId: string | null; // Can be null for legacy data
};

export type Grievance = {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  fileUrl?: string;
  filePath?: string;
  createdAt: Date;
  status: 'Open' | 'In Progress' | 'Resolved';
  seenByCEO: boolean;
  workspaceId: string;
};

// Type for data sent from client to server for grievance submission
export type GrievanceClientData = {
    subject: string;
    description: string;
    file?: {
        buffer: string; // base64 encoded string
        name: string;
        type: string;
    };
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'CEO' | 'CFO' | 'COO' | 'CTO' | 'CMO' | 'CHRO' | 'CDO' | 'Member';
  phone?: string;
  workspaceId: string;
}
