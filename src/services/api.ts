import { auth } from '../config/firebase';

// Use environment variable or fallback to direct Cloud Functions URL for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://us-central1-test-b6e4c.cloudfunctions.net/api";

export const apiRequest = async <T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> => {
    let token = null;
    const user = auth.currentUser;

    if (user) {
        token = await user.getIdToken();
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure endpoint starts with /
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        // Handle empty, text, or JSON responses
        const text = await response.text();
        if (!text) return {} as T;

        try {
            return JSON.parse(text);
        } catch {
            // If response is not valid JSON, return text (e.g. "Profile Updated")
            return text as unknown as T;
        }
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
};
