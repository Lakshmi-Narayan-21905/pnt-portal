import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserService } from '../services/userService';
import type { UserProfile } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch user profile from Firestore
    const fetchUserProfile = async (uid: string) => {
        setError(null);
        try {
            // Use UserService to find user across collections
            const profile = await UserService.getUserProfile(uid);

            if (profile) {
                setUserProfile(profile);
            } else {
                console.warn("User document not found for UID:", uid);
                setUserProfile(null);
                setError("User profile not found. Please contact the administrator.");
            }
        } catch (err: any) {
            console.error("Error fetching user profile:", err);
            setUserProfile(null);
            // Check for permission denied
            if (err.code === 'permission-denied') {
                setError("Access denied. Please check Firestore Rules.");
            } else {
                setError("Failed to load user profile.");
            }
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserProfile(user.uid);
            } else {
                setUserProfile(null);
                setError(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const refreshProfile = async () => {
        if (currentUser) {
            await fetchUserProfile(currentUser.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, userProfile, loading, error, logout, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
