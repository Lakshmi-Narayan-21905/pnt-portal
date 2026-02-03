import { apiRequest } from './api';
import type { UserProfile, UserRole } from '../types';
import { cacheService, CACHE_KEYS, CACHE_CONFIGS } from './cacheService';

export const UserService = {
    // Create a new user
    createUserProfile: async (userProfile: UserProfile) => {
        try {
            await apiRequest('/users/profile', 'POST', userProfile);
            // Clear cache after creation
            cacheService.delete(CACHE_KEYS.ALL_USERS);
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    // Get a user profile by UID
    getUserProfile: async (uid: string, forceRefresh: boolean = false): Promise<UserProfile | null> => {
        try {
            const cacheKey = CACHE_KEYS.USER_PROFILE(uid);

            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<UserProfile>(cacheKey, CACHE_CONFIGS.USER_DATA);
                if (cached) {
                    return cached;
                }
            }

            const profile = await apiRequest<UserProfile>(`/users/profile/${uid}`);

            // Cache the result
            if (profile) {
                cacheService.set(cacheKey, profile, CACHE_CONFIGS.USER_DATA);
            }

            return profile;
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
            // Invalidate cache after update
            cacheService.delete(CACHE_KEYS.USER_PROFILE(uid));
            cacheService.delete(CACHE_KEYS.ALL_USERS);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Delete a user profile
    deleteUserProfile: async (uid: string) => {
        try {
            await apiRequest(`/users/profile/${uid}`, 'DELETE');
            // Clear cache after deletion
            cacheService.delete(CACHE_KEYS.USER_PROFILE(uid));
            cacheService.delete(CACHE_KEYS.ALL_USERS);
        } catch (error) {
            console.error("Error deleting user profile:", error);
            throw error;
        }
    },

    // Get all students
    getAllStudents: async (forceRefresh: boolean = false): Promise<UserProfile[]> => {
        return UserService.getUsersByRole('STUDENT', forceRefresh);
    },

    // Get all users with a specific role
    getUsersByRole: async (role: UserRole, forceRefresh: boolean = false): Promise<UserProfile[]> => {
        try {
            const cacheKey = CACHE_KEYS.USERS_BY_ROLE(role);

            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<UserProfile[]>(cacheKey, CACHE_CONFIGS.USER_DATA);
                if (cached) {
                    return cached;
                }
            }

            const users = await apiRequest<UserProfile[]>(`/users/role/${role}`);

            // Cache the result
            cacheService.set(cacheKey, users, CACHE_CONFIGS.USER_DATA);

            return users;
        } catch (error) {
            console.error("Error fetching all students:", error);
            throw error;
        }
    },

    // Get all users
    getAllUsers: async (forceRefresh: boolean = false): Promise<UserProfile[]> => {
        try {
            const cacheKey = CACHE_KEYS.ALL_USERS;

            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<UserProfile[]>(cacheKey, CACHE_CONFIGS.USER_DATA);
                if (cached) {
                    return cached;
                }
            }

            const users = await apiRequest<UserProfile[]>('/users/all');

            // Cache the result
            cacheService.set(cacheKey, users, CACHE_CONFIGS.USER_DATA);

            return users;
        } catch (error) {
            console.error("Error fetching all users:", error);
            throw error;
        }
    },

    // Update student placement status by Roll Number
    updateUserStatusByRollNo: async (rollNo: string, status: 'PLACED' | 'UNPLACED' | 'OFFERED') => {
        try {
            await apiRequest('/users/status/roll', 'PUT', { rollNo, status });
            // Clear related caches
            cacheService.delete(CACHE_KEYS.ALL_USERS);
            return true;
        } catch (error) {
            console.error(`Error updating status for rollNo ${rollNo}:`, error);
            return false;
        }
    },

    // Clear all user caches (useful for manual refresh)
    clearCache: () => {
        cacheService.delete(CACHE_KEYS.ALL_USERS);
        // Clear role-based caches
        ['STUDENT', 'ADMIN', 'HEAD_OF_DEPARTMENT', 'PLACEMENT_COORDINATOR', 'TRAINING_COORDINATOR', 'DEPT_COORDINATOR', 'CLASS_COORDINATOR'].forEach(role => {
            cacheService.delete(CACHE_KEYS.USERS_BY_ROLE(role));
        });
    }
};
