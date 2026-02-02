import { apiRequest } from './api';
import type { Training } from '../types';

export const TrainingService = {
    // Add a new training program
    addTraining: async (trainingData: Omit<Training, 'id' | 'participants'>) => {
        try {
            return await apiRequest<string>('/trainings', 'POST', trainingData);
        } catch (error) {
            console.error("Error adding training:", error);
            throw error;
        }
    },

    // Get all trainings
    getAllTrainings: async (): Promise<Training[]> => {
        try {
            return await apiRequest<Training[]>('/trainings');
        } catch (error) {
            console.error("Error fetching trainings:", error);
            return [];
        }
    },

    // Update a training program
    updateTraining: async (id: string, trainingData: Partial<Training>) => {
        try {
            await apiRequest(`/trainings/${id}`, 'PUT', trainingData);
        } catch (error) {
            console.error("Error updating training:", error);
            throw error;
        }
    },

    // Delete a training
    deleteTraining: async (id: string) => {
        try {
            await apiRequest(`/trainings/${id}`, 'DELETE');
        } catch (error) {
            console.error("Error deleting training:", error);
            throw error;
        }
    },

    // Register for a training program
    registerForTraining: async (trainingId: string, studentId: string) => {
        try {
            await apiRequest(`/trainings/${trainingId}/register`, 'POST', { studentId });
        } catch (error) {
            console.error("Error registering for training:", error);
            throw error;
        }
    }
};
