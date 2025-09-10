import { db, storage } from '@/lib/firebase';
import type { Document } from '@/types';
import { collection, addDoc, getDocs, doc, deleteDoc, Timestamp, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const documentsCollection = collection(db, 'documents');

export const getDocuments = async (workspaceId: string): Promise<Document[]> => {
    // We query the top-level collection and filter by workspaceId
    const q = query(documentsCollection, where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));

    // For backward compatibility: if the workspace is 'mentorme', also fetch documents without a workspaceId.
    if (workspaceId === 'mentorme') {
        const legacyQuery = query(documentsCollection, where('workspaceId', '==', null), orderBy('createdAt', 'desc'));
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

    return documents;
};

export const addDocument = async (workspaceId: string, file: File, category: Document['category']): Promise<Document> => {
    if (!file) throw new Error("File is required.");
    
    // The storage path should still be workspace-specific to avoid name collisions
    const storagePath = `${workspaceId}/documents/${Date.now()}_${file.name}`;
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
        workspaceId: workspaceId, // Add workspaceId to the document data
    };

    const docRef = await addDoc(documentsCollection, docData);

    return { ...docData, id: docRef.id };
};

export const deleteDocument = async (workspaceId: string, document: Document): Promise<void> => {
    // workspaceId is not strictly needed to find the document if we have the id, but it's good for verification
    const docRef = doc(db, 'documents', document.id);
    await deleteDoc(docRef);

    const storageRef = ref(storage, document.storagePath);
    await deleteObject(storageRef);
};

export const deleteDocuments = async (workspaceId: string, documents: Document[]): Promise<void> => {
    if (documents.length === 0) return;

    // Delete documents from Firestore in a batch
    const batch = writeBatch(db);
    documents.forEach(document => {
        // We ensure we're only deleting documents that match the workspaceId, or are legacy docs in the 'mentorme' workspace
        if (document.workspaceId === workspaceId || (workspaceId === 'mentorme' && !document.workspaceId)) {
            const docRef = doc(documentsCollection, document.id);
            batch.delete(docRef);
        }
    });
    await batch.commit();

    // Delete files from Storage
    const deletePromises = documents.map(document => {
         if (document.workspaceId === workspaceId || (workspaceId === 'mentorme' && !document.workspaceId)) {
            const storageRef = ref(storage, document.storagePath);
            return deleteObject(storageRef);
         }
         return Promise.resolve();
    });
    await Promise.all(deletePromises);
};
