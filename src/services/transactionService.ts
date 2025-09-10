import { db } from '@/lib/firebase';
import type { Transaction } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, orderBy, where } from 'firebase/firestore';

const transactionsCollection = collection(db, 'transactions');

export const getTransactions = async (workspaceId: string): Promise<Transaction[]> => {
    const q = query(transactionsCollection, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
    
    // For backward compatibility: if the workspace is 'mentorme', also fetch transactions without a workspaceId.
    if (workspaceId === 'mentorme') {
        const legacyQuery = query(transactionsCollection, where('workspaceId', '==', null));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyTransactions = legacySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));

        // Merge and remove duplicates, giving precedence to transactions with workspaceId
        const allTransactions = [...transactions, ...legacyTransactions];
        const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
            index === self.findIndex((t) => t.id === transaction.id)
        );
         // Re-sort after merge
        uniqueTransactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        return uniqueTransactions;
    }

    transactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    return transactions;
};

export const addTransaction = async (workspaceId: string, transaction: Omit<Transaction, 'id' | 'date' | 'workspaceId'> & { date: Date }): Promise<Transaction> => {
    const newTransaction = {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        workspaceId: workspaceId,
    };
    const docRef = await addDoc(transactionsCollection, newTransaction);
    return { ...newTransaction, id: docRef.id };
};

export const updateTransaction = async (workspaceId: string, id: string, transaction: Omit<Transaction, 'id' | 'date' | 'workspaceId'> & { date: Date }): Promise<void> => {
    const docRef = doc(db, 'transactions', id);
    // You might want to add a check here to ensure the transaction belongs to the workspaceId before updating
    await updateDoc(docRef, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        workspaceId: workspaceId // ensure workspaceId is preserved or updated
    });
};

export const deleteTransaction = async (workspaceId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'transactions', id);
    // You might want to add a check here to ensure the transaction belongs to the workspaceId before deleting
    await deleteDoc(docRef);
};
