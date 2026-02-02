import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import type { PlacementRecord } from '../types';

const COLLECTION_NAME = 'placement_records';

export const PlacementRecordService = {
    // Add a single record
    addRecord: async (record: Omit<PlacementRecord, 'id' | 'createdAt'>) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...record,
                createdAt: Date.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding placement record:", error);
            throw error;
        }
    },

    // Get all records
    getAllRecords: async (): Promise<PlacementRecord[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PlacementRecord));
        } catch (error) {
            console.error("Error fetching placement records:", error);
            throw error;
        }
    },

    // Delete a record
    deleteRecord: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting placement record:", error);
            throw error;
        }
    },

    // Get records by Roll Number
    getRecordsByRollNo: async (rollNo: string): Promise<PlacementRecord[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('rollNo', '==', rollNo));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PlacementRecord));
        } catch (error) {
            console.error("Error fetching records by rollNo:", error);
            return [];
        }
    },

    // Bulk create
    bulkCreateRecords: async (records: Omit<PlacementRecord, 'id' | 'createdAt'>[]) => {
        const batchPromises = records.map(record =>
            addDoc(collection(db, COLLECTION_NAME), {
                ...record,
                createdAt: Date.now()
            })
        );
        await Promise.all(batchPromises); // Simple parallel execution for now
    }
};
