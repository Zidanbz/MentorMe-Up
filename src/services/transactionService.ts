import { db } from '@/lib/firebase';
import type { Transaction } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';

const transactionsCollection = collection(db, 'transactions');

export const getTransactions = async (): Promise<Transaction[]> => {
    const q = query(transactionsCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }): Promise<Transaction> => {
    const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date)
    });
    return { ...transaction, id: docRef.id, date: Timestamp.fromDate(transaction.date) };
};

export const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }): Promise<void> => {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date)
    });
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const docRef = doc(db, 'transactions', id);
    await deleteDoc(docRef);
};
