import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc
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

    // Delete a user profile (Only Delete Firestore Doc)
    deleteUserProfile: async (uid: string) => {
        try {
            const result = await UserService.findUserDoc(uid);
            if (result) {
                await deleteDoc(result.ref);
            } else {
                throw new Error("User not found for deletion");
            }
        } catch (error) {
            console.error("Error deleting user profile:", error);
            throw error;
        }
    },

    // Get all users with a specific role (Only new collection)
    getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
        try {
            const q = query(collection(db, role === 'STUDENT' ? 'students' :
                role === 'ADMIN' ? 'admins' :
                    role === 'PLACEMENT_HEAD' ? 'placement_heads' :
                        role === 'TRAINING_HEAD' ? 'training_heads' :
                            role === 'DEPT_COORDINATOR' ? 'dept_coordinators' :
                                'class_coordinators'));

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        } catch (error) {
            console.error(`Error fetching users for role ${role}:`, error);
            throw error;
        }
    },

    // Helper to fetch all "student-like" users (Students + Class Coordinators)
    getAllStudents: async (): Promise<UserProfile[]> => {
        try {
            const [students, coordinators] = await Promise.all([
                UserService.getUsersByRole('STUDENT'),
                UserService.getUsersByRole('CLASS_COORDINATOR')
            ]);
            return [...students, ...coordinators];
        } catch (error) {
            console.error("Error fetching all students:", error);
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
    },

    // Update student placement status by Roll Number
    updateUserStatusByRollNo: async (rollNo: string, status: 'PLACED' | 'UNPLACED' | 'OFFERED') => {
        try {
            const normalizedRoll = rollNo.toLowerCase().trim();
            // Check 'students', 'class_coordinators', and 'dept_coordinators'
            const collectionsToCheck = ['students', 'class_coordinators', 'dept_coordinators'];

            for (const colName of collectionsToCheck) {
                const q = query(collection(db, colName), where('rollNo', '==', normalizedRoll));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const docRef = snapshot.docs[0].ref;
                    await updateDoc(docRef, { placementStatus: status });
                    return true;
                }
            }
            return false; // User not found in any collection
        } catch (error) {
            console.error(`Error updating status for rollNo ${rollNo}:`, error);
            // Don't throw, just log, so bulk upload continues
            return false;
        }
    },

    // Change user role (Move doc between collections)
    changeUserRole: async (uid: string, newRole: UserRole) => {
        try {
            // 1. Find current user doc
            const currentDoc = await UserService.findUserDoc(uid);
            if (!currentDoc) throw new Error("User not found");

            const userData = currentDoc.data;
            const oldCollectionRef = currentDoc.ref;

            // 2. Prepare new data
            const newData: UserProfile = {
                ...userData,
                role: newRole
            };

            // 3. Create in new collection
            const newCollectionName = ROLE_COLLECTIONS[newRole];
            if (!newCollectionName) throw new Error("Invalid new role");

            await setDoc(doc(db, newCollectionName, uid), newData);

            // 4. Delete from old collection
            await deleteDoc(oldCollectionRef);

        } catch (error) {
            console.error("Error changing user role:", error);
            throw error;
        }
    }
};
