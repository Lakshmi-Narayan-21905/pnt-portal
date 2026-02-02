import { apiRequest } from './api';
import type { UserProfile, UserRole } from '../types';

export const UserService = {
    // Create a new user
    createUserProfile: async (userProfile: UserProfile) => {
        try {
            await apiRequest('/users/profile', 'POST', userProfile);
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    // Get a user profile by UID
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            return await apiRequest<UserProfile>(`/users/profile/${uid}`);
        } catch (error) {
            console.error("Error getting user profile:", error);
            // If 404, return null
            return null;
        }
    },

    // Update specific fields of a user profile
    updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
        try {
            await apiRequest(`/users/profile/${uid}`, 'PUT', data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Delete a user profile
    deleteUserProfile: async (uid: string) => {
        try {
            await apiRequest(`/users/profile/${uid}`, 'DELETE');
        } catch (error) {
            console.error("Error deleting user profile:", error);
            throw error;
        }
    },

    // Get all users with a specific role
    getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
        try {
            return await apiRequest<UserProfile[]>(`/users/role/${role}`);
        } catch (error) {
            console.error("Error fetching users by role:", error);
            throw error;
        }
    },

    // Get all users
    getAllUsers: async (): Promise<UserProfile[]> => {
        try {
            return await apiRequest<UserProfile[]>('/users/all');
        } catch (error) {
            console.error("Error fetching all users:", error);
            throw error;
        }
    },

    // Update student placement status by Roll Number
    updateUserStatusByRollNo: async (rollNo: string, status: 'PLACED' | 'UNPLACED' | 'OFFERED') => {
        try {
            await apiRequest('/users/status/roll', 'PUT', { rollNo, status });
            return true;
        } catch (error) {
            console.error(`Error updating status for rollNo ${rollNo}:`, error);
            return false;
        }
    }
};
