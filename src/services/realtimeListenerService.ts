/**
 * RealtimeListenerService - Listens to Firestore changes and invalidates cache
 * This ensures cache stays synchronized with the database
 */

import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { cacheService, CACHE_KEYS } from './cacheService';

type ListenerCallback = () => void;

class RealtimeListenerService {
    private listeners: Map<string, Unsubscribe> = new Map();
    private changeCallbacks: Map<string, Set<ListenerCallback>> = new Map();

    /**
     * Start listening to a collection and invalidate cache on changes
     */
    listenToCollection(
        collectionName: string,
        cachePattern: string,
        onChangeCallback?: ListenerCallback
    ): void {
        // Prevent duplicate listeners
        if (this.listeners.has(collectionName)) {
            return;
        }

        const collectionRef = collection(db, collectionName);

        const unsubscribe = onSnapshot(
            collectionRef,
            (snapshot) => {
                // Skip initial snapshot to avoid unnecessary cache clear
                if (!snapshot.metadata.hasPendingWrites) {
                    console.log(`[RealtimeListener] Changes detected in ${collectionName}`);

                    // Invalidate cache for this collection
                    cacheService.invalidatePattern(cachePattern);

                    // Call registered callbacks
                    const callbacks = this.changeCallbacks.get(collectionName);
                    if (callbacks) {
                        callbacks.forEach(callback => {
                            try {
                                callback();
                            } catch (error) {
                                console.error(`Error in change callback for ${collectionName}:`, error);
                            }
                        });
                    }

                    // Call the provided callback
                    if (onChangeCallback) {
                        onChangeCallback();
                    }
                }
            },
            (error) => {
                console.error(`Error listening to ${collectionName}:`, error);
            }
        );

        this.listeners.set(collectionName, unsubscribe);
    }

    /**
     * Stop listening to a specific collection
     */
    stopListening(collectionName: string): void {
        const unsubscribe = this.listeners.get(collectionName);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(collectionName);
            this.changeCallbacks.delete(collectionName);
        }
    }

    /**
     * Stop all listeners
     */
    stopAllListeners(): void {
        this.listeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.listeners.clear();
        this.changeCallbacks.clear();
    }

    /**
     * Register a callback to be called when a collection changes
     */
    onCollectionChange(collectionName: string, callback: ListenerCallback): () => void {
        if (!this.changeCallbacks.has(collectionName)) {
            this.changeCallbacks.set(collectionName, new Set());
        }

        this.changeCallbacks.get(collectionName)!.add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.changeCallbacks.get(collectionName);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Initialize all listeners for the application
     */
    initializeAllListeners(): void {
        console.log('[RealtimeListener] Initializing all collection listeners');

        // Listen to companies collection
        this.listenToCollection('companies', CACHE_KEYS.PATTERN_COMPANIES);

        // Listen to trainings collection
        this.listenToCollection('trainings', CACHE_KEYS.PATTERN_TRAININGS);

        // Listen to announcements collection
        this.listenToCollection('announcements', CACHE_KEYS.PATTERN_ANNOUNCEMENTS);

        // Listen to placement records collection
        this.listenToCollection('placement_records', CACHE_KEYS.PLACEMENT_RECORDS.PATTERN);

        // Listen to user collections
        const userCollections = [
            'admin',
            'placement_heads',
            'training_heads',
            'dept_coordinators',
            'class_coordinators',
            'students'
        ];

        userCollections.forEach(collectionName => {
            this.listenToCollection(collectionName, CACHE_KEYS.USERS.PATTERN);
        });

        console.log('[RealtimeListener] All listeners initialized');
    }

    /**
     * Check if listening to a collection
     */
    isListening(collectionName: string): boolean {
        return this.listeners.has(collectionName);
    }

    /**
     * Get count of active listeners
     */
    getListenerCount(): number {
        return this.listeners.size;
    }
}

// Export singleton instance
export const realtimeListenerService = new RealtimeListenerService();

// Auto-initialize listeners when the module is imported
// This can be disabled by commenting out the line below
// realtimeListenerService.initializeAllListeners();
