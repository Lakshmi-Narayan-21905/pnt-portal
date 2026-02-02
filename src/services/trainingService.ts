
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Training } from '../types';
import { AnnouncementService } from './announcementService';

const COLLECTION_NAME = 'trainings';

export const TrainingService = {
    // Add a new training program
    addTraining: async (trainingData: Omit<Training, 'id' | 'participants'>) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...trainingData,
                participants: []
            });

            // Automated Announcement
            try {
                const targetDepts = (trainingData.eligibility?.branches && trainingData.eligibility.branches.length > 0)
                    ? trainingData.eligibility.branches
                    : ['all'];

                await AnnouncementService.createAnnouncement({
                    title: `New Training: ${trainingData.title} `,
                    content: `A new training program "${trainingData.title}" by ${trainingData.trainer} has been announced.\n\nDuration: ${new Date(trainingData.startDate).toLocaleDateString()} - ${new Date(trainingData.endDate).toLocaleDateString()} \n\nCheck 'My Trainings' to register!`,
                    authorId: 'SYSTEM',
                    authorRole: 'TRAINING_HEAD',
                    authorName: 'System (Auto)',
                    targetDepts
                });
            } catch (annError) {
                console.warn("Failed to create automated announcement:", annError);
            }

            return docRef.id;
        } catch (error) {
            console.error("Error adding training:", error);
            throw error;
        }
    },

    // Get all trainings
    getAllTrainings: async (): Promise<Training[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Training));
        } catch (error) {
            console.error("Error fetching trainings:", error);
            throw error;
        }
    },

    // Update a training program
    updateTraining: async (id: string, trainingData: Partial<Training>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, trainingData);
        } catch (error) {
            console.error("Error updating training:", error);
            throw error;
        }
    },

    // Delete a training
    deleteTraining: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting training:", error);
            throw error;
        }
    },

    // Register for a training program
    registerForTraining: async (trainingId: string, studentId: string) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, trainingId);
            await updateDoc(docRef, {
                participants: arrayUnion(studentId)
            });
        } catch (error) {
            console.error("Error registering for training:", error);
            throw error;
        }
    }
};
