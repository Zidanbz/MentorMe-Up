export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
  category: 'Legal' | 'Finance' | 'Operations' | 'Reports';
  createdAt: Date;
  url: string;
};

export type Transaction = {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: 'Salary' | 'Marketing' | 'Investment' | 'Operations' | 'Other';
  description: string;
  date: Date;
};

export type RecentActivity = {
  id:string;
  user: string;
  avatar: string;
  action: string;
  timestamp: string;
};

    