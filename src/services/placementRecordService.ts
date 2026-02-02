import { apiRequest } from './api';
import type { PlacementRecord } from '../types';
import { cacheService, CACHE_KEYS, CACHE_CONFIGS } from './cacheService';

export const PlacementRecordService = {
    addRecord: async (record: Omit<PlacementRecord, 'id' | 'createdAt'>) => {
        const result = await apiRequest<string>('/placements', 'POST', record);
        // Invalidate cache after addition
        cacheService.delete(CACHE_KEYS.PLACEMENTS);
        return result;
    },

    getAllRecords: async (forceRefresh: boolean = false) => {
        const cacheKey = CACHE_KEYS.PLACEMENTS;
        
        // Check cache first
        if (!forceRefresh) {
            const cached = cacheService.get<PlacementRecord[]>(cacheKey, CACHE_CONFIGS.PLACEMENTS);
            if (cached) {
                return cached;
            }
        }
        
        const records = await apiRequest<PlacementRecord[]>('/placements');
        
        // Cache the result
        cacheService.set(cacheKey, records, CACHE_CONFIGS.PLACEMENTS);
        
        return records;
    },

    updateRecord: async (id: string, updates: Partial<PlacementRecord>) => {
        // Remove id/createdAt if present just in case
        const { id: _, createdAt: __, ...cleanUpdates } = updates as any;
        const result = await apiRequest(`/placements/${id}`, 'PUT', cleanUpdates);
        // Invalidate cache after update
        cacheService.delete(CACHE_KEYS.PLACEMENT_BY_ID(id));
        cacheService.delete(CACHE_KEYS.PLACEMENTS);
        return result;
    },

    deleteRecord: async (id: string) => {
        const result = await apiRequest(`/placements/${id}`, 'DELETE');
        // Invalidate cache after deletion
        cacheService.delete(CACHE_KEYS.PLACEMENT_BY_ID(id));
        cacheService.delete(CACHE_KEYS.PLACEMENTS);
        return result;
    },

    getRecordsByRollNo: async (rollNo: string, forceRefresh: boolean = false) => {
        // Fetch all and filter client side for now as backend doesn't support query param yet
        try {
            const all = await PlacementRecordService.getAllRecords(forceRefresh);
            return all.filter(r => r.rollNo === rollNo);
        } catch (error) {
            console.error("Error fetching records by rollNo:", error);
            return [];
        }
    },

    bulkCreateRecords: async (records: Omit<PlacementRecord, 'id' | 'createdAt'>[]) => {
        // Execute in parallel
        await Promise.all(records.map(record => apiRequest('/placements', 'POST', record)));
        // Invalidate cache after bulk creation
        cacheService.delete(CACHE_KEYS.PLACEMENTS);
    },

    // Clear all placement caches
    clearCache: () => {
        cacheService.delete(CACHE_KEYS.PLACEMENTS);
    }
};
