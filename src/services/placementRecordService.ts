import { apiRequest } from './api';
import type { PlacementRecord } from '../types';

export const PlacementRecordService = {
    addRecord: async (record: Omit<PlacementRecord, 'id' | 'createdAt'>) => {
        return apiRequest<string>('/placements', 'POST', record);
    },

    getAllRecords: async () => {
        return apiRequest<PlacementRecord[]>('/placements');
    },

    updateRecord: async (id: string, updates: Partial<PlacementRecord>) => {
        // Remove id/createdAt if present just in case
        const { id: _, createdAt: __, ...cleanUpdates } = updates as any;
        return apiRequest(`/placements/${id}`, 'PUT', cleanUpdates);
    },

    deleteRecord: async (id: string) => {
        return apiRequest(`/placements/${id}`, 'DELETE');
    },

    getRecordsByRollNo: async (rollNo: string) => {
        // Fetch all and filter client side for now as backend doesn't support query param yet
        try {
            const all = await apiRequest<PlacementRecord[]>('/placements');
            return all.filter(r => r.rollNo === rollNo);
        } catch (error) {
            console.error("Error fetching records by rollNo:", error);
            return [];
        }
    },

    bulkCreateRecords: async (records: Omit<PlacementRecord, 'id' | 'createdAt'>[]) => {
        // Execute in parallel
        await Promise.all(records.map(record => apiRequest('/placements', 'POST', record)));
    }
};
