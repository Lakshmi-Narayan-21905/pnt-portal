import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
export const analytics = getAnalytics(app);

// Note: Firestore (db) is NO LONGER exported for client-side use.
// All data access must go through the functions API.

export default app;
