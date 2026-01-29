import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
    apiKey: "AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8",
    authDomain: "test-b6e4c.firebaseapp.com",
    projectId: "test-b6e4c",
    storageBucket: "test-b6e4c.firebasestorage.app",
    messagingSenderId: "118748980768",
    appId: "1:118748980768:web:69a57dbe92a3f85cc2be45",
    measurementId: "G-BPC1XD2G1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Secondary App for Admin User Creation (optional, allows creating users without logging out admin)
// Note: In a real production environment, this should be done via Cloud Functions to keep Admin SDK secure.
// For this client-side demo, we use the standard auth flow, but be aware of the limitation:
// `createUserWithEmailAndPassword` signs in the user immediately.
// We will handle this in the service layer by managing session persistence or warning the user.
export default app;
