import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile, UserRole } from '../types';

export const UserService = {
    // Create or overwrite a user profile in Firestore
    createUserProfile: async (userProfile: UserProfile) => {
        try {
            await setDoc(doc(db, 'users', userProfile.uid), userProfile);
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    // Get a user profile by UID
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting user profile:", error);
            throw error;
        }
    },

    // Update specific fields of a user profile
    updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
        try {
            const docRef = doc(db, 'users', uid);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Get all users with a specific role
    getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
        try {
            const q = query(collection(db, 'users'), where('role', '==', role));
            const querySnapshot = await getDocs(q);
            const users: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data() as UserProfile);
            });
            return users;
        } catch (error) {
            console.error("Error fetching users by role:", error);
            throw error;
        }
    },

    // Get all users
    getAllUsers: async (): Promise<UserProfile[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const users: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data() as UserProfile);
            });
            return users;
        } catch (error) {
            console.error("Error fetching all users:", error);
            throw error;
        }
    }
};
