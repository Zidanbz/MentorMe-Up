import { Timestamp } from "firebase/firestore";

export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
  category: 'Legal' | 'Finance' | 'Operations' | 'Reports' | 'HR' | 'Product & Development' | 'Marketing & Sales' | 'Investor & Fundraising' | 'Research & Insights';
  createdAt: Timestamp;
  url: string;
  storagePath: string;
};

export type Transaction = {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: 'Salary' | 'Marketing' | 'Investment' | 'Operations' | 'Other';
  description: string;
  date: Timestamp;
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
  assignedTo?: string; // User ID
  subTasks?: Task[]; // Nested sub-tasks
  category?: 'Marketing' | 'Finance' | 'Tech' | 'Operations' | 'Other'; // Label warna
};

export type Milestone = {
  id: string;
  name: string;
  dueDate?: Timestamp | Date;
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  milestones: Milestone[];
  createdAt: Timestamp;
};
