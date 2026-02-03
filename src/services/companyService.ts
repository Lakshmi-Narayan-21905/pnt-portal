import { apiRequest } from './api';
import type { Company } from '../types';

import { cacheService, CACHE_KEYS, CACHE_CONFIGS } from './cacheService';


export const CompanyService = {
    // Add a new company drive
    addCompany: async (companyData: Omit<Company, 'id' | 'applicants'>) => {
        try {

            const result = await apiRequest<string>('/companies', 'POST', companyData);
            // Invalidate cache after addition
            cacheService.delete(CACHE_KEYS.COMPANIES);
            return result;

        } catch (error) {
            console.error("Error adding company:", error);
            throw error;
        }
    },

    // Get all companies
    getAllCompanies: async (forceRefresh: boolean = false): Promise<Company[]> => {
        try {
            const cacheKey = CACHE_KEYS.COMPANIES;
            
            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<Company[]>(cacheKey, CACHE_CONFIGS.COMPANIES);
                if (cached) {
                    return cached;
                }
            }
            
            const companies = await apiRequest<Company[]>('/companies');
            
            // Cache the result
            cacheService.set(cacheKey, companies, CACHE_CONFIGS.COMPANIES);
            
            return companies;
        } catch (error) {
            console.error("Error fetching companies:", error);
            throw error;
        }
    },

    // Get a single company by ID
    getCompanyById: async (id: string, forceRefresh: boolean = false): Promise<Company | null> => {
        try {
            const cacheKey = CACHE_KEYS.COMPANY_BY_ID(id);
            
            // Check cache first
            if (!forceRefresh) {
                const cached = cacheService.get<Company>(cacheKey, CACHE_CONFIGS.COMPANIES);
                if (cached) {
                    return cached;
                }
            }
            
            const company = await apiRequest<Company>(`/companies/${id}`);
            
            // Cache the result
            if (company) {
                cacheService.set(cacheKey, company, CACHE_CONFIGS.COMPANIES);
            }
            
            return company;
        } catch (error) {
            // 404 throws error in apiRequest, catch it here?
            // If we want null, we should check status.
            console.error("Error fetching company:", error);
            return null;
        }
    },

    // Update company details
    updateCompany: async (id: string, updates: Partial<Company>) => {
        try {
            await apiRequest(`/companies/${id}`, 'PUT', updates);
            // Invalidate cache after update
            cacheService.delete(CACHE_KEYS.COMPANY_BY_ID(id));
            cacheService.delete(CACHE_KEYS.COMPANIES);
        } catch (error) {
            console.error("Error updating company:", error);
            throw error;
        }
    },

    // Delete a company
    deleteCompany: async (id: string) => {
        try {
            await apiRequest(`/companies/${id}`, 'DELETE');
            // Invalidate cache after deletion
            cacheService.delete(CACHE_KEYS.COMPANY_BY_ID(id));
            cacheService.delete(CACHE_KEYS.COMPANIES);
        } catch (error) {
            console.error("Error deleting company:", error);
            throw error;
        }
    },

    // Apply to a specific drive
    applyToDrive: async (companyId: string, studentId: string) => {
        try {
            await apiRequest(`/companies/${companyId}/apply`, 'POST', { studentId });
            // Invalidate company cache as applicants changed
            cacheService.delete(CACHE_KEYS.COMPANY_BY_ID(companyId));
            cacheService.delete(CACHE_KEYS.COMPANIES);
        } catch (error) {
            console.error("Error applying to drive:", error);
            throw error;
        }
    },

    // Opt out of a drive
    optOutDrive: async (companyId: string, studentId: string) => {
        try {
            await apiRequest(`/companies/${companyId}/optout`, 'POST', { studentId });
            // Invalidate company cache as applicants changed
            cacheService.delete(CACHE_KEYS.COMPANY_BY_ID(companyId));
            cacheService.delete(CACHE_KEYS.COMPANIES);
        } catch (error) {
            console.error("Error opting out of drive:", error);
            throw error;
        }
    },

    // Clear all company caches
    clearCache: () => {
        cacheService.delete(CACHE_KEYS.COMPANIES);
    }
};
