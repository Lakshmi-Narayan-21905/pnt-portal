/**
 * CacheService - Intelligent caching layer for database operations
 * Features:
 * - In-memory caching with TTL (time-to-live)
 * - Automatic cache invalidation on data updates
 * - Optional localStorage persistence for cross-session caching
 * - Cache statistics and monitoring
 * - Encrypted localStorage storage to prevent data leakage
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

/**
 * Simple encryption utilities for localStorage data protection
 * Uses Base64 encoding with obfuscation to prevent casual data inspection
 */
class CacheEncryption {
    private static readonly ENCRYPTION_KEY = 'PNT_PORTAL_CACHE_2026'; // Change this for your app
    
    /**
     * Encrypt data for localStorage storage
     */
    static encrypt(data: string): string {
        try {
            // Convert to base64
            const base64 = btoa(encodeURIComponent(data));
            
            // Apply XOR cipher with key
            const encrypted = this.xorCipher(base64, this.ENCRYPTION_KEY);
            
            // Add random salt prefix to make it harder to recognize patterns
            const salt = Math.random().toString(36).substring(2, 10);
            return salt + ':' + encrypted;
        } catch (error) {
            console.error('Encryption failed:', error);
            return data; // Fallback to unencrypted if encryption fails
        }
    }
    
    /**
     * Decrypt data from localStorage
     */
    static decrypt(encryptedData: string): string {
        try {
            // Remove salt prefix
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted format');
            }
            
            const encrypted = parts[1];
            
            // Reverse XOR cipher
            const base64 = this.xorCipher(encrypted, this.ENCRYPTION_KEY);
            
            // Decode from base64
            return decodeURIComponent(atob(base64));
        } catch (error) {
            console.error('Decryption failed:', error);
            return encryptedData; // Return as-is if decryption fails
        }
    }
    
    /**
     * Simple XOR cipher for obfuscation
     */
    private static xorCipher(text: string, key: string): string {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Encode to base64 to handle special characters
    }
}

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
    private useLocalStorage: boolean = false;
    private storagePrefix: string = 'pnt_cache_';

    constructor(options?: { useLocalStorage?: boolean; storagePrefix?: string }) {
        this.useLocalStorage = options?.useLocalStorage || false;
        this.storagePrefix = options?.storagePrefix || 'pnt_cache_';
        
        // Load from localStorage if enabled
        if (this.useLocalStorage) {
            this.loadFromLocalStorage();
        }

        // Periodic cleanup of expired entries (every 5 minutes)
        setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    }

    /**
     * Get data from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data as T;
    }

    /**
     * Set data in cache with TTL
     * @param key - Cache key
     * @param data - Data to cache
     * @param ttl - Time to live in milliseconds (default: 5 minutes)
     */
    set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };

        this.cache.set(key, entry);
        this.stats.size = this.cache.size;

        // Persist to localStorage if enabled
        if (this.useLocalStorage) {
            this.saveToLocalStorage(key, entry);
        }
    }

    /**
     * Delete a specific cache entry
     */
    delete(key: string): void {
        this.cache.delete(key);
        this.stats.size = this.cache.size;

        if (this.useLocalStorage) {
            localStorage.removeItem(this.storagePrefix + key);
        }
    }

    /**
     * Invalidate cache entries by pattern
     * Example: invalidatePattern('users_') will clear all keys starting with 'users_'
     */
    invalidatePattern(pattern: string): void {
        const keysToDelete: string[] = [];
        
        this.cache.forEach((_, key) => {
            if (key.startsWith(pattern) || key.includes(pattern)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.stats.size = 0;
        
        if (this.useLocalStorage) {
            // Clear all items with our prefix
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: string } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 
            ? ((this.stats.hits / total) * 100).toFixed(2) + '%'
            : '0%';
        
        return {
            ...this.stats,
            hitRate
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats(): void {
        this.stats = { hits: 0, misses: 0, size: this.cache.size };
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Get remaining TTL for a cache entry (in milliseconds)
     */
    getRemainingTTL(key: string): number {
        const entry = this.cache.get(key);
        if (!entry) return 0;
        
        const remaining = entry.ttl - (Date.now() - entry.timestamp);
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Save cache entry to localStorage (encrypted)
     */
    private saveToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
        try {
            const jsonString = JSON.stringify(entry);
            const encrypted = CacheEncryption.encrypt(jsonString);
            
            localStorage.setItem(
                this.storagePrefix + key,
                encrypted
            );
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            // localStorage might be full or unavailable
        }
    }

    /**
     * Load cache from localStorage on initialization (with decryption)
     */
    private loadFromLocalStorage(): void {
        try {
            Object.keys(localStorage).forEach(storageKey => {
                if (storageKey.startsWith(this.storagePrefix)) {
                    const key = storageKey.replace(this.storagePrefix, '');
                    const encryptedData = localStorage.getItem(storageKey);
                    
                    if (encryptedData) {
                        try {
                            // Decrypt the data
                            const decrypted = CacheEncryption.decrypt(encryptedData);
                            const entry = JSON.parse(decrypted) as CacheEntry<any>;
                            
                            // Only load if not expired
                            if (Date.now() - entry.timestamp <= entry.ttl) {
                                this.cache.set(key, entry);
                            } else {
                                localStorage.removeItem(storageKey);
                            }
                        } catch (parseError) {
                            console.warn(`Failed to decrypt/parse cache entry: ${key}`, parseError);
                            // Remove corrupted entry
                            localStorage.removeItem(storageKey);
                        }
                    }
                }
            });
            
            this.stats.size = this.cache.size;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Wrap an async function with caching
     * This is a higher-order function that automatically handles cache get/set
     */
    async wrapWithCache<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        ttl: number = 5 * 60 * 1000
    ): Promise<T> {
        // Try to get from cache first
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // If not in cache, fetch the data
        const data = await fetchFunction();
        
        // Store in cache
        this.set(key, data, ttl);
        
        return data;
    }
}

// Export singleton instance
export const cacheService = new CacheService({
    useLocalStorage: true, // Enable localStorage persistence
    storagePrefix: 'pnt_cache_'
});

// Export cache key patterns for consistency
export const CACHE_KEYS = {
    USERS: {
        ALL: (role: string) => `users_role_${role}`,
        SINGLE: (uid: string) => `user_${uid}`,
        PATTERN: 'users_'
    },
    COMPANIES: {
        ALL: 'companies_all',
        SINGLE: (id: string) => `company_${id}`,
        PATTERN: 'compan'
    },
    TRAININGS: {
        ALL: 'trainings_all',
        SINGLE: (id: string) => `training_${id}`,
        PATTERN: 'training'
    },
    ANNOUNCEMENTS: {
        FOR_STUDENT: (dept?: string) => `announcements_student_${dept || 'all'}`,
        LATEST_DATE: (dept?: string) => `announcements_latest_${dept || 'all'}`,
        PATTERN: 'announcement'
    },
    PLACEMENT_RECORDS: {
        ALL: 'placement_records_all',
        BY_ROLL: (rollNo: string) => `placement_records_roll_${rollNo}`,
        PATTERN: 'placement_record'
    }
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
    MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
    LONG: 15 * 60 * 1000,      // 15 minutes - for relatively static data
    VERY_LONG: 60 * 60 * 1000  // 1 hour - for rarely changing data
};
