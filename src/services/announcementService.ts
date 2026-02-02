import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Announcement } from '../types';

const COLLECTION_NAME = 'announcements';

export const AnnouncementService = {
    // Create new announcement
    createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'date'>) => {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...announcement,
                date: Date.now() // Use client timestamp for simplicity in sorting, or serverTimestamp if needed
            });
        } catch (error) {
            console.error("Error creating announcement:", error);
            throw error;
        }
    },

    // Get announcements relevant to a student
    getAnnouncementsForStudent: async (studentDept?: string): Promise<Announcement[]> => {
        try {
            const announcements: Announcement[] = [];
            const collectionRef = collection(db, COLLECTION_NAME);

            // 1. Fetch 'all' target announcements (HEADS)
            const qAll = query(collectionRef, where('targetDept', '==', 'all'));
            const snapAll = await getDocs(qAll);
            snapAll.forEach(doc => announcements.push({ id: doc.id, ...doc.data() } as Announcement));

            // 2. Fetch specific dept announcements (DEPT COORDINATORS)
            if (studentDept) {
                const qDept = query(collectionRef, where('targetDept', '==', studentDept));
                const snapDept = await getDocs(qDept);
                snapDept.forEach(doc => announcements.push({ id: doc.id, ...doc.data() } as Announcement));
            }

            // Client-side sort by date (newest first)
            return announcements.sort((a, b) => b.date - a.date);
        } catch (error) {
            console.error("Error fetching student announcements:", error);
            throw error;
        }
    },

    // Get announcements created by a specific user (for Manage view)
    getAnnouncementsByAuthor: async (authorId: string): Promise<Announcement[]> => {
        try {
            // Firestore requires composite index for 'where' + 'orderBy'. 
            // We'll fetch by author and sort client-side to avoid index requirement initially.
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
        } catch (error) {
            console.error("Error deleting announcement:", error);
            throw error;
        }
    }
};

// Helper for getAnnouncementsByAuthor
const collectionRef = collection(db, COLLECTION_NAME);
