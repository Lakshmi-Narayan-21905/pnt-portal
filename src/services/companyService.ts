import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Company } from '../types';

const COLLECTION_NAME = 'companies';

export const CompanyService = {
    // Add a new company drive
    addCompany: async (companyData: Omit<Company, 'id' | 'applicants'>) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...companyData,
                applicants: []
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding company:", error);
            throw error;
        }
    },

    // Get all companies
    getAllCompanies: async (): Promise<Company[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Company));
        } catch (error) {
            console.error("Error fetching companies:", error);
            throw error;
        }
    },

    // Get a single company by ID
    getCompanyById: async (id: string): Promise<Company | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Company;
            }
            return null;
        } catch (error) {
            console.error("Error fetching company:", error);
            throw error;
        }
    },

    // Update company details
    updateCompany: async (id: string, updates: Partial<Company>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating company:", error);
            throw error;
        }
    },

    // Delete a company
    deleteCompany: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting company:", error);
            throw error;
        }
    },

    // Apply to a specific drive
    applyToDrive: async (companyId: string, studentId: string) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, companyId);
            await updateDoc(docRef, {
                applicants: arrayUnion(studentId)
            });
        } catch (error) {
            console.error("Error applying to drive:", error);
            throw error;
        }
    },

    // Opt out of a drive
    optOutDrive: async (companyId: string, studentId: string) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, companyId);
            await updateDoc(docRef, {
                optedOut: arrayUnion(studentId)
            });
        } catch (error) {
            console.error("Error opting out of drive:", error);
            throw error;
        }
    }
};
