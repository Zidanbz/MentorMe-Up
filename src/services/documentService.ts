import { db, storage } from '@/lib/firebase';
import type { Document } from '@/types';
import { collection, addDoc, getDocs, doc, deleteDoc, Timestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (): Promise<Document[]> => {
    const q = query(documentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
};

export const addDocument = async (file: File, category: Document['category']): Promise<Document> => {
    if (!file) throw new Error("File is required.");
    
    const storagePath = `documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const getFileType = (fileName: string): Document['type'] => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') return 'PDF';
        if (extension === 'docx' || extension === 'doc') return 'Word';
        if (extension === 'xlsx' || extension === 'xls') return 'Excel';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'Image';
        return 'Other';
    };

    const docData = {
        name: file.name,
        type: getFileType(file.name),
        category,
        createdAt: Timestamp.now(),
        url,
        storagePath: storagePath,
    };

    const docRef = await addDoc(documentsCollection, docData);

    return { ...docData, id: docRef.id };
};

export const deleteDocument = async (document: Document): Promise<void> => {
    const docRef = doc(db, 'documents', document.id);
    await deleteDoc(docRef);

    const storageRef = ref(storage, document.storagePath);
    await deleteObject(storageRef);
};

export const deleteDocuments = async (documents: Document[]): Promise<void> => {
    if (documents.length === 0) return;

    // Delete documents from Firestore in a batch
    const batch = writeBatch(db);
    documents.forEach(document => {
        const docRef = doc(db, 'documents', document.id);
        batch.delete(docRef);
    });
    await batch.commit();

    // Delete files from Storage
    const deletePromises = documents.map(document => {
        const storageRef = ref(storage, document.storagePath);
        return deleteObject(storageRef);
    });
    await Promise.all(deletePromises);
};
