import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Training } from '../types';

const COLLECTION_NAME = 'trainings';

export const TrainingService = {
    // Add a new training program
    addTraining: async (trainingData: Omit<Training, 'id' | 'participants'>) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...trainingData,
                participants: []
            });
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
