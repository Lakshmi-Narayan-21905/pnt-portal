import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserService } from '../services/userService';
import type { UserProfile } from '../types';
import { realtimeListenerService } from '../services/realtimeListenerService';

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
                // Single Session Enforcement
                const currentSessionId = sessionStorage.getItem('sessionId');

                // If the profile has a session ID, and we have a session ID locally, they MUST match.
                // If we don't have a local session ID, we assume it's a fresh session (or cleared cache)
                // and we let the login flow (if happening) take precedence. 
                // But if we are just sitting on a page and refresh, we should have the ID.

                if (profile.sessionId && currentSessionId && profile.sessionId !== currentSessionId) {
                    console.warn("Session mismatch detected. Logging out.");
                    await firebaseSignOut(auth);
                    setCurrentUser(null);
                    setUserProfile(null);
                    sessionStorage.removeItem('sessionId');
                    setError("You have been logged out because you signed in from another location.");
                    return;
                }

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
        // Initialize real-time listeners for cache invalidation
        realtimeListenerService.initializeAllListeners();

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

        return () => {
            unsubscribe();
            // Clean up listeners when app unmounts
            realtimeListenerService.stopAllListeners();
        };
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
