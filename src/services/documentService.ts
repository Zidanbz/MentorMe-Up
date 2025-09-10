import { db, storage } from '@/lib/firebase';
import type { Document } from '@/types';
import { collection, addDoc, getDocs, doc, deleteDoc, Timestamp, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (workspaceId: string): Promise<Document[]> => {
    const q = query(documentsCollection, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));

    // For backward compatibility: if the workspace is 'mentorme', also fetch documents without a workspaceId.
    if (workspaceId === 'mentorme') {
        const legacyQuery = query(documentsCollection, where('workspaceId', '==', null));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyDocuments = legacySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
        
        // Merge and remove duplicates, giving precedence to documents with workspaceId
        const allDocuments = [...documents, ...legacyDocuments];
        const uniqueDocuments = allDocuments.filter((doc, index, self) =>
            index === self.findIndex((d) => d.id === doc.id)
        );
        // Re-sort after merge
        uniqueDocuments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        return uniqueDocuments;
    }
    
    documents.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return documents;
};

export const addDocument = async (workspaceId: string, file: File, category: Document['category']): Promise<Document> => {
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

    const docData: Omit<Document, 'id'> = {
        name: file.name,
        type: getFileType(file.name),
        category,
        createdAt: Timestamp.now(),
        url,
        storagePath: storagePath,
        workspaceId: workspaceId, // Always assign the current workspaceId
    };

    const docRef = await addDoc(documentsCollection, docData);

    return { ...docData, id: docRef.id };
};

export const deleteDocument = async (workspaceId: string, document: Document): Promise<void> => {
    const docRef = doc(db, 'documents', document.id);
    await deleteDoc(docRef);

    const storageRef = ref(storage, document.storagePath);
    await deleteObject(storageRef);
};

export const deleteDocuments = async (workspaceId: string, documents: Document[]): Promise<void> => {
    if (documents.length === 0) return;

    const batch = writeBatch(db);
    documents.forEach(document => {
        if (document.workspaceId === workspaceId || (workspaceId === 'mentorme' && !document.workspaceId)) {
            const docRef = doc(documentsCollection, document.id);
            batch.delete(docRef);
        }
    });
    await batch.commit();

    const deletePromises = documents.map(document => {
         if (document.workspaceId === workspaceId || (workspaceId === 'mentorme' && !document.workspaceId)) {
            const storageRef = ref(storage, document.storagePath);
            return deleteObject(storageRef);
         }
         return Promise.resolve();
    });
    await Promise.all(deletePromises);
};
