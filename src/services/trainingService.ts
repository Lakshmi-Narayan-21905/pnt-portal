import { apiRequest } from './api';
import type { Training } from '../types';
import { cacheService, CACHE_KEYS, CACHE_CONFIGS } from './cacheService';

export const TrainingService = {
    // Add a new training program
    addTraining: async (trainingData: Omit<Training, 'id' | 'participants'>) => {
        try {
            const result = await apiRequest<string>('/trainings', 'POST', trainingData);
            // Invalidate cache after addition
            cacheService.delete(CACHE_KEYS.TRAININGS);
            return result;
        } catch (error) {
            console.error("Error adding training:", error);
            throw error;
        }
    },

    // Get all trainings
    getAllTrainings: async (forceRefresh: boolean = false): Promise<Training[]> => {
        try {
            const cacheKey = CACHE_KEYS.TRAININGS;
            
            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<Training[]>(cacheKey, CACHE_CONFIGS.TRAININGS);
                if (cached) {
                    return cached;
                }
            }
            
            const trainings = await apiRequest<Training[]>('/trainings');
            
            // Cache the result
            cacheService.set(cacheKey, trainings, CACHE_CONFIGS.TRAININGS);
            
            return trainings;
        } catch (error) {
            console.error("Error fetching trainings:", error);
            return [];
        }
    },

    // Get a specific training by ID
    getTrainingById: async (id: string): Promise<Training> => {
        try {
            return await cacheService.wrapWithCache(
                CACHE_KEYS.TRAININGS.SINGLE(id),
                async () => {
                    const docRef = await import('firebase/firestore').then(mod => mod.getDoc(doc(db, COLLECTION_NAME, id)));
                    if (docRef.exists()) {
                        return { id: docRef.id, ...docRef.data() } as Training;
                    } else {
                        throw new Error("Training program not found");
                    }
                },
                CACHE_TTL.SHORT
            );
        } catch (error) {
            console.error("Error fetching training by ID:", error);
            throw error;
        }
    },

    // Update a training program
    updateTraining: async (id: string, trainingData: Partial<Training>) => {
        try {
            await apiRequest(`/trainings/${id}`, 'PUT', trainingData);
            // Invalidate cache after update
            cacheService.delete(CACHE_KEYS.TRAINING_BY_ID(id));
            cacheService.delete(CACHE_KEYS.TRAININGS);
        } catch (error) {
            console.error("Error updating training:", error);
            throw error;
        }
    },

    // Delete a training
    deleteTraining: async (id: string) => {
        try {
            await apiRequest(`/trainings/${id}`, 'DELETE');
            // Invalidate cache after deletion
            cacheService.delete(CACHE_KEYS.TRAINING_BY_ID(id));
            cacheService.delete(CACHE_KEYS.TRAININGS);
        } catch (error) {
            console.error("Error deleting training:", error);
            throw error;
        }
    },

    // Register for a training program
    registerForTraining: async (trainingId: string, studentId: string) => {
        try {
            await apiRequest(`/trainings/${trainingId}/register`, 'POST', { studentId });
            // Invalidate training cache as participants changed
            cacheService.delete(CACHE_KEYS.TRAINING_BY_ID(trainingId));
            cacheService.delete(CACHE_KEYS.TRAININGS);
        } catch (error) {
            console.error("Error registering for training:", error);
            throw error;
        }
    },

    // Clear all training caches
    clearCache: () => {
        cacheService.delete(CACHE_KEYS.TRAININGS);
    }
};
