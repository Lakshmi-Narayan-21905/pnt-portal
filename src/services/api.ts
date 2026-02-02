import { auth } from '../config/firebase';

// Production Cloud Functions URL
// For local development, switch to: http://127.0.0.1:5001/test-b6e4c/us-central1/api
const API_BASE_URL = "https://us-central1-test-b6e4c.cloudfunctions.net/api";

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

        // Handle empty responses (e.g. 204 No Content)
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
};
