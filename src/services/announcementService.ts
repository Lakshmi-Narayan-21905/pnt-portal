import { apiRequest } from './api';
import type { Announcement } from '../types';

export const AnnouncementService = {
    getAllAnnouncements: async () => {
        try {
            return await apiRequest<Announcement[]>('/announcements');
        } catch (error) {
            console.error("Error fetching announcements:", error);
            // Return empty if fail to prevent app crash
            return [];
        }
    },

    createAnnouncement: async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
        try {
            return await apiRequest<string>('/announcements', 'POST', data);
        } catch (error) {
            console.error("Error creating announcement:", error);
            throw error;
        }
    },

    deleteAnnouncement: async (id: string) => {
        try {
            return await apiRequest(`/announcements/${id}`, 'DELETE');
        } catch (error) {
            console.error("Error deleting announcement:", error);
            throw error;
        }
    }
};
