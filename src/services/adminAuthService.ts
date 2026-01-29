import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "../config/firebase";

// This service allows creating users without logging out the currently designated admin.
// It initializes a secondary Firebase app instance to handle the auth creation.

export const AdminAuthService = {
    createUser: async (email: string, password: string) => {
        let secondaryApp;
        try {
            // Check if a secondary app already exists (to avoid duplicate initialization)
            // We use a unique name for the secondary app
            const appName = "secondaryAppForUserCreation";
            const existingApps = getApps();
            secondaryApp = existingApps.find(app => app.name === appName);

            if (!secondaryApp) {
                secondaryApp = initializeApp(firebaseConfig, appName);
            }

            const secondaryAuth = getAuth(secondaryApp);

            // Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

            // Immediately sign out to clear the session from the secondary app instance
            // (though it doesn't affect the main app, it's good practice)
            await signOut(secondaryAuth);

            return userCredential.user;
        } catch (error: any) {
            console.error("Error creating user in secondary app:", error);
            // Clean up if possible or just throw
            throw error;
        }
        // We do NOT delete the app here to avoid overhead of re-initialization if doing bulk uploads,
        // but in a long lived session we might want to clean it up.
        // For bulk uploads, re-using is better.
    }
};
