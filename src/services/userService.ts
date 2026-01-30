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

const ROLE_COLLECTIONS: Record<UserRole, string> = {
    'ADMIN': 'admin',
    'PLACEMENT_HEAD': 'placement_heads',
    'TRAINING_HEAD': 'training_heads',
    'DEPT_COORDINATOR': 'dept_coordinators',
    'CLASS_COORDINATOR': 'class_coordinators',
    'STUDENT': 'students'
};

export const UserService = {
    // Helper to find which collection a user belongs to
    findUserDoc: async (uid: string) => {
        // Only check role-specific collections
        const promises = Object.values(ROLE_COLLECTIONS).map(async (colName) => {
            const ref = doc(db, colName, uid);
            const snap = await getDoc(ref);
            return { ref, snap };
        });

        const results = await Promise.all(promises);
        const found = results.find(r => r.snap.exists());

        if (found) {
            return { ref: found.ref, data: found.snap.data() as UserProfile };
        }
        return null;
    },

    // Create a new user in the specific collection for their role
    createUserProfile: async (userProfile: UserProfile) => {
        try {
            const collectionName = ROLE_COLLECTIONS[userProfile.role];
            if (!collectionName) throw new Error("Invalid role for collection map");
            await setDoc(doc(db, collectionName, userProfile.uid), userProfile);
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    // Get a user profile by UID (searching only new collections)
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            const result = await UserService.findUserDoc(uid);
            return result ? result.data : null;
        } catch (error) {
            console.error("Error getting user profile:", error);
            throw error;
        }
    },

    // Update specific fields of a user profile
    updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
        try {
            const result = await UserService.findUserDoc(uid);
            if (result) {
                await updateDoc(result.ref, data);
            } else {
                throw new Error("User not found for update (New Collection)");
            }
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Get all users with a specific role (Only new collection)
    getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
        try {
            const users: UserProfile[] = [];
            const newCollection = ROLE_COLLECTIONS[role];

            if (newCollection) {
                const newSnapshot = await getDocs(collection(db, newCollection));
                newSnapshot.forEach((doc) => users.push(doc.data() as UserProfile));
            }

            return users;
        } catch (error) {
            console.error("Error fetching users by role:", error);
            throw error;
        }
    },

    // Get all users (Only new collections)
    getAllUsers: async (): Promise<UserProfile[]> => {
        try {
            const users: UserProfile[] = [];

            // All new collections
            for (const colName of Object.values(ROLE_COLLECTIONS)) {
                const snap = await getDocs(collection(db, colName));
                snap.forEach((doc) => users.push(doc.data() as UserProfile));
            }

            return users;
        } catch (error) {
            console.error("Error fetching all users:", error);
            throw error;
        }
    }
};
