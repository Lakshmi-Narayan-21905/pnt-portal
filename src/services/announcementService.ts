
import { apiRequest } from './api';
import type { Announcement } from '../types';
import { cacheService, CACHE_KEYS, CACHE_CONFIGS } from './cacheService';

export const AnnouncementService = {
    getAllAnnouncements: async (forceRefresh: boolean = false) => {
        try {
            const cacheKey = CACHE_KEYS.ANNOUNCEMENTS;

            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<Announcement[]>(cacheKey, CACHE_CONFIGS.ANNOUNCEMENTS);
                if (cached) {
                    return cached;
                }
            }

            const announcements = await apiRequest<Announcement[]>('/announcements');

            // Cache the result
            cacheService.set(cacheKey, announcements, CACHE_CONFIGS.ANNOUNCEMENTS);

            return announcements;

        } catch (error) {
            console.error("Error fetching announcements:", error);
            // Return empty if fail to prevent app crash
            return [];
        }
    },


    createAnnouncement: async (data: Omit<Announcement, 'id' | 'date'>) => {
        try {
            const result = await apiRequest<string>('/announcements', 'POST', data);
            // Invalidate cache after creation
            cacheService.delete(CACHE_KEYS.ANNOUNCEMENTS);
            return result;

        } catch (error) {
            console.error("Error creating announcement:", error);
            throw error;
        }
    },

    deleteAnnouncement: async (id: string) => {
        try {
            const result = await apiRequest(`/announcements/${id}`, 'DELETE');
            // Invalidate cache after deletion
            cacheService.delete(CACHE_KEYS.ANNOUNCEMENTS);
            return result;
        } catch (error) {
            console.error("Error deleting announcement:", error);
            throw error;
        }
    },

    // Get date of the latest announcement
    getLatestAnnouncementDate: async (): Promise<Date | null> => {
        try {
            const announcements = await AnnouncementService.getAllAnnouncements();
            if (announcements.length === 0) return null;

            // Assuming announcements are sorted desc by default, or we explicitly sort
            const sorted = [...announcements].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
            });

            return new Date(sorted[0].date);
        } catch (error) {
            console.error("Error getting latest announcement date:", error);
            return null;
        }
    },

    // Clear announcements cache
    clearCache: () => {
        cacheService.delete(CACHE_KEYS.ANNOUNCEMENTS);
    }
};
