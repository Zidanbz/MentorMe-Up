import { db } from '@/lib/firebase';
import type { Transaction } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';

const getTransactionsCollection = (workspaceId: string) => 
    collection(db, 'workspaces', workspaceId, 'transactions');

export const getTransactions = async (workspaceId: string): Promise<Transaction[]> => {
    const transactionsCollection = getTransactionsCollection(workspaceId);
    const q = query(transactionsCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};

export const addTransaction = async (workspaceId: string, transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }): Promise<Transaction> => {
    const transactionsCollection = getTransactionsCollection(workspaceId);
    const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date)
    });
    return { ...transaction, id: docRef.id, date: Timestamp.fromDate(transaction.date) };
};

export const updateTransaction = async (workspaceId: string, id: string, transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }): Promise<void> => {
    const docRef = doc(db, 'workspaces', workspaceId, 'transactions', id);
    await updateDoc(docRef, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date)
    });
};

export const deleteTransaction = async (workspaceId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'workspaces', workspaceId, 'transactions', id);
    await deleteDoc(docRef);
};
