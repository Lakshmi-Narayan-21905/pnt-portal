import { apiRequest } from './api';
import type { Company } from '../types';

export const CompanyService = {
    // Add a new company drive
    addCompany: async (companyData: Omit<Company, 'id' | 'applicants'>) => {
        try {
            return await apiRequest<string>('/companies', 'POST', companyData);
        } catch (error) {
            console.error("Error adding company:", error);
            throw error;
        }
    },

    // Get all companies
    getAllCompanies: async (): Promise<Company[]> => {
        try {
            return await apiRequest<Company[]>('/companies');
        } catch (error) {
            console.error("Error fetching companies:", error);
            throw error;
        }
    },

    // Get a single company by ID
    getCompanyById: async (id: string): Promise<Company | null> => {
        try {
            return await apiRequest<Company>(`/companies/${id}`);
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
        } catch (error) {
            console.error("Error updating company:", error);
            throw error;
        }
    },

    // Delete a company
    deleteCompany: async (id: string) => {
        try {
            await apiRequest(`/companies/${id}`, 'DELETE');
        } catch (error) {
            console.error("Error deleting company:", error);
            throw error;
        }
    },

    // Apply to a specific drive
    applyToDrive: async (companyId: string, studentId: string) => {
        try {
            await apiRequest(`/companies/${companyId}/apply`, 'POST', { studentId });
        } catch (error) {
            console.error("Error applying to drive:", error);
            throw error;
        }
    },

    // Opt out of a drive
    optOutDrive: async (companyId: string, studentId: string) => {
        try {
            await apiRequest(`/companies/${companyId}/optout`, 'POST', { studentId });
        } catch (error) {
            console.error("Error opting out of drive:", error);
            throw error;
        }
    }
};
