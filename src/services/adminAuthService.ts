import { apiRequest } from './api';

export const AdminAuthService = {
    createUser: async (email: string, password: string, role?: string) => {
        try {
            const result = await apiRequest<{ uid: string, email: string }>('/auth/create-user', 'POST', {
                email, password, role
            });
            // Return a result that mimics basic User properties if needed, or just the result.
            // The original service returned `User` object. 
            // The caller likely needs `uid`.
            return result;
        } catch (error) {
            console.error("Error creating user proxy:", error);
            throw error;
        }
    }
};
