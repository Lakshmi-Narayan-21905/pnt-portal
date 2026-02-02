import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Announcement } from '../types';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';

const COLLECTION_NAME = 'announcements';
const collectionRef = collection(db, COLLECTION_NAME);

export const AnnouncementService = {
    // Create new announcement
    createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'date'>) => {
        try {
            await addDoc(collectionRef, {
                ...announcement,
                date: Date.now()
            });
            // Invalidate announcements cache
            cacheService.invalidatePattern(CACHE_KEYS.ANNOUNCEMENTS.PATTERN);
        } catch (error) {
            console.error("Error creating announcement:", error);
            throw error;
        }
    },

    // Get latest announcement date (for unread Badge)
    getLatestAnnouncementDate: async (studentDept?: string): Promise<number> => {
        try {
            return await cacheService.wrapWithCache(
                CACHE_KEYS.ANNOUNCEMENTS.LATEST_DATE(studentDept),
                async () => {
                    let maxDate = 0;
                    const queries = [
                        query(collectionRef, where('targetDepts', 'array-contains', 'all')),
                        query(collectionRef, where('targetDept', '==', 'all'))
                    ];

                    if (studentDept) {
                        queries.push(query(collectionRef, where('targetDepts', 'array-contains', studentDept)));
                        queries.push(query(collectionRef, where('targetDept', '==', studentDept)));
                    }

                    for (const q of queries) {
                        try {
                            const snap = await getDocs(q);
                            snap.forEach(doc => {
                                const d = doc.data().date;
                                if (d && d > maxDate) maxDate = d;
                            });
                        } catch (ignore) { }
                    }

                    return maxDate;
                },
                CACHE_TTL.SHORT // Announcements change frequently
            );
        } catch (error) {
            console.error("Error fetching latest announcement date:", error);
            return 0;
        }
    },

    // Get announcements relevant to a student
    getAnnouncementsForStudent: async (studentDept?: string): Promise<Announcement[]> => {
        try {
            return await cacheService.wrapWithCache(
                CACHE_KEYS.ANNOUNCEMENTS.FOR_STUDENT(studentDept),
                async () => {
                    const announcements: Announcement[] = [];

                    // Query: targetDepts contains 'all' OR 'studentDept'
                    // Firestore 'array-contains' only allows one value per query if we want to be simple (no OR).
                    // Actually, we can just fetch where targetDepts contains 'all' AND where targetDepts contains 'studentDept' separately and merge.

                    // 1. Fetch 'all' target announcements (New Schema)
                    const qAll = query(collectionRef, where('targetDepts', 'array-contains', 'all'));
                    const snapAll = await getDocs(qAll);
                    snapAll.forEach(doc => announcements.push({ id: doc.id, ...doc.data() } as Announcement));

                    // 1.1 Fetch 'all' target announcements (Legacy Schema)
                    try {
                        const qAllOld = query(collectionRef, where('targetDept', '==', 'all'));
                        const snapAllOld = await getDocs(qAllOld);
                        snapAllOld.forEach(doc => {
                            const id = doc.id;
                            if (!announcements.find(a => a.id === id)) {
                                announcements.push({ id: doc.id, ...doc.data() } as Announcement);
                            }
                        });
                    } catch (ignore) {
                        // Field might not exist on all docs, or index issue. 
                        // But simple equality check often works without composite index if other filters absent.
                    }

                    // 2. Fetch specific dept announcements
                    if (studentDept) {
                        // New Schema
                        const qDept = query(collectionRef, where('targetDepts', 'array-contains', studentDept));
                        const snapDept = await getDocs(qDept);
                        snapDept.forEach(doc => {
                            const id = doc.id;
                            if (!announcements.find(a => a.id === id)) {
                                announcements.push({ id: doc.id, ...doc.data() } as Announcement);
                            }
                        });

                        // Legacy Schema
                        try {
                            const qDeptOld = query(collectionRef, where('targetDept', '==', studentDept));
                            const snapDeptOld = await getDocs(qDeptOld);
                            snapDeptOld.forEach(doc => {
                                const id = doc.id;
                                if (!announcements.find(a => a.id === id)) {
                                    announcements.push({ id: doc.id, ...doc.data() } as Announcement);
                                }
                            });
                        } catch (ignore) { }
                    }

                    // Client-side sort by date (newest first)
                    return announcements.sort((a, b) => b.date - a.date);
                },
                CACHE_TTL.SHORT
            );
        } catch (error) {
            console.error("Error fetching student announcements:", error);
            throw error;
        }
    },

    // Get announcements created by a specific user (for Manage view)
    getAnnouncementsByAuthor: async (authorId: string): Promise<Announcement[]> => {
        try {
            const q = query(collectionRef, where('authorId', '==', authorId));
            const querySnapshot = await getDocs(q);

            const announcements = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Announcement));

            return announcements.sort((a, b) => b.date - a.date);
        } catch (error) {
            console.error("Error fetching author announcements:", error);
            throw error;
        }
    },

    deleteAnnouncement: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            // Invalidate announcements cache
            cacheService.invalidatePattern(CACHE_KEYS.ANNOUNCEMENTS.PATTERN);
        } catch (error) {
            console.error("Error deleting announcement:", error);
            throw error;
        }
    },

    // Update announcement
    updateAnnouncement: async (id: string, data: Partial<Announcement>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...data,
                // Optionally update date, or create a new 'updatedAt' field. 
                // Creating 'updatedAt' is safer to preserve original order if sorted by creation date.
                // For now, let's just update the content.
            });
            // Invalidate announcements cache
            cacheService.invalidatePattern(CACHE_KEYS.ANNOUNCEMENTS.PATTERN);
        } catch (error) {
            console.error("Error updating announcement:", error);
            throw error;
        }
    }
};
