import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import type { PlacementRecord } from '../types';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';

const COLLECTION_NAME = 'placement_records';

export const PlacementRecordService = {
    // Add a single record
    addRecord: async (record: Omit<PlacementRecord, 'id' | 'createdAt'>) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...record,
                createdAt: Date.now()
            });
            // Invalidate placement records cache
            cacheService.invalidatePattern(CACHE_KEYS.PLACEMENT_RECORDS.PATTERN);
            return docRef.id;
        } catch (error) {
            console.error("Error adding placement record:", error);
            throw error;
        }
    },

    // Get all records
    getAllRecords: async (): Promise<PlacementRecord[]> => {
        try {
            return await cacheService.wrapWithCache(
                CACHE_KEYS.PLACEMENT_RECORDS.ALL,
                async () => {
                    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
                    const snapshot = await getDocs(q);
                    return snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as PlacementRecord));
                },
                CACHE_TTL.MEDIUM
            );
        } catch (error) {
            console.error("Error fetching placement records:", error);
            throw error;
        }
    },

    // Delete a record
    deleteRecord: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            // Invalidate placement records cache
            cacheService.invalidatePattern(CACHE_KEYS.PLACEMENT_RECORDS.PATTERN);
        } catch (error) {
            console.error("Error deleting placement record:", error);
            throw error;
        }
    },

    // Get records by Roll Number
    getRecordsByRollNo: async (rollNo: string): Promise<PlacementRecord[]> => {
        try {
            return await cacheService.wrapWithCache(
                CACHE_KEYS.PLACEMENT_RECORDS.BY_ROLL(rollNo),
                async () => {
                    const q = query(collection(db, COLLECTION_NAME), where('rollNo', '==', rollNo));
                    const snapshot = await getDocs(q);
                    return snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as PlacementRecord));
                },
                CACHE_TTL.MEDIUM
            );
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
        // Invalidate placement records cache
        cacheService.invalidatePattern(CACHE_KEYS.PLACEMENT_RECORDS.PATTERN);
    },

    // Update a record
    updateRecord: async (id: string, updates: Partial<PlacementRecord>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            // Don't update id or createdAt usually
            const { id: _, createdAt: __, ...cleanUpdates } = updates as any;
            await import('firebase/firestore').then(mod => mod.updateDoc(docRef, cleanUpdates));
            // Invalidate placement records cache
            cacheService.invalidatePattern(CACHE_KEYS.PLACEMENT_RECORDS.PATTERN);
        } catch (error) {
            console.error("Error updating placement record:", error);
            throw error;
        }
    }
};
