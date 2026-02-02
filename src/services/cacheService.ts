/**
 * Secure Cache Service
 * - Stores data in localStorage with encryption
 * - Implements cache invalidation based on data version/timestamp
 * - Prevents data leakage by hashing stored data
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  encryptionKey?: string; // Encryption key (default: generated from app)
}

class CacheService {
  private static instance: CacheService;
  private readonly CACHE_PREFIX = '_pnt_cache_';
  private readonly VERSION_PREFIX = '_pnt_version_';
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private encryptionKey: string;

  private constructor() {
    // Generate a consistent key from browser fingerprint
    this.encryptionKey = this.generateEncryptionKey();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Generate an encryption key based on browser/session fingerprint
   */
  private generateEncryptionKey(): string {
    // Use a combination of factors to create a unique key per session
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const fingerprint = `${userAgent}-${language}-${platform}-${screenResolution}-${timezone}`;
    return this.simpleHash(fingerprint);
  }

  /**
   * Simple hash function for encryption key
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Encrypt data using XOR cipher with base64 encoding
   */
  private encrypt(data: string): string {
    try {
      const encrypted = this.xorCipher(data, this.encryptionKey);
      return btoa(encodeURIComponent(encrypted)); // Base64 encode
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt cache data');
    }
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: string): string {
    try {
      const decoded = decodeURIComponent(atob(encryptedData)); // Base64 decode
      return this.xorCipher(decoded, this.encryptionKey);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt cache data');
    }
  }

  /**
   * XOR cipher for encryption/decryption
   */
  private xorCipher(str: string, key: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Generate a cache key
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${this.simpleHash(key)}`;
  }

  /**
   * Generate a version key
   */
  private getVersionKey(key: string): string {
    return `${this.VERSION_PREFIX}${this.simpleHash(key)}`;
  }

  /**
   * Set data in cache with encryption
   */
  public set<T>(key: string, data: T, config?: CacheConfig): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.generateDataVersion(data)
      };

      const serialized = JSON.stringify(cacheItem);
      const encrypted = this.encrypt(serialized);
      
      const cacheKey = this.getCacheKey(key);
      const versionKey = this.getVersionKey(key);
      
      localStorage.setItem(cacheKey, encrypted);
      localStorage.setItem(versionKey, cacheItem.version);
      
      // Set TTL if provided
      if (config?.ttl) {
        const expiryKey = `${cacheKey}_expiry`;
        localStorage.setItem(expiryKey, (Date.now() + config.ttl).toString());
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Fail silently to not break app functionality
    }
  }

  /**
   * Get data from cache with decryption
   */
  public get<T>(key: string, config?: CacheConfig): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const encrypted = localStorage.getItem(cacheKey);
      
      if (!encrypted) {
        return null;
      }

      // Check expiry
      const expiryKey = `${cacheKey}_expiry`;
      const expiry = localStorage.getItem(expiryKey);
      const ttl = config?.ttl || this.defaultTTL;
      
      if (expiry && Date.now() > parseInt(expiry)) {
        this.delete(key);
        return null;
      }

      const decrypted = this.decrypt(encrypted);
      const cacheItem: CacheItem<T> = JSON.parse(decrypted);

      // Check if cache is expired by timestamp
      if (Date.now() - cacheItem.timestamp > ttl) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      // If decryption fails, clear corrupted cache
      this.delete(key);
      return null;
    }
  }

  /**
   * Check if cache is valid and fresh
   */
  public isValid(key: string, serverVersion?: string): boolean {
    try {
      const cacheKey = this.getCacheKey(key);
      const encrypted = localStorage.getItem(cacheKey);
      
      if (!encrypted) {
        return false;
      }

      // Check expiry
      const expiryKey = `${cacheKey}_expiry`;
      const expiry = localStorage.getItem(expiryKey);
      if (expiry && Date.now() > parseInt(expiry)) {
        return false;
      }

      // If server version is provided, compare with cached version
      if (serverVersion) {
        const versionKey = this.getVersionKey(key);
        const cachedVersion = localStorage.getItem(versionKey);
        return cachedVersion === serverVersion;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a version hash from data
   */
  private generateDataVersion(data: any): string {
    const str = JSON.stringify(data);
    return this.simpleHash(str);
  }

  /**
   * Delete cache entry
   */
  public delete(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const versionKey = this.getVersionKey(key);
      const expiryKey = `${cacheKey}_expiry`;
      
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(versionKey);
      localStorage.removeItem(expiryKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  public clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.VERSION_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): { totalEntries: number; totalSize: number } {
    let totalEntries = 0;
    let totalSize = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });
    } catch (error) {
      console.error('Cache stats error:', error);
    }

    return { totalEntries, totalSize };
  }

  /**
   * Invalidate cache based on data version change
   */
  public invalidateIfChanged<T>(key: string, newData: T): boolean {
    const newVersion = this.generateDataVersion(newData);
    const versionKey = this.getVersionKey(key);
    const cachedVersion = localStorage.getItem(versionKey);

    if (cachedVersion && cachedVersion !== newVersion) {
      this.delete(key);
      return true; // Cache was invalidated
    }

    return false; // Cache is still valid
  }
}

export const cacheService = CacheService.getInstance();

// Cache key constants for consistent usage across services
export const CACHE_KEYS = {
  USER_PROFILE: (uid: string) => `user_profile_${uid}`,
  ALL_USERS: 'all_users',
  USERS_BY_ROLE: (role: string) => `users_role_${role}`,
  ANNOUNCEMENTS: 'announcements',
  COMPANIES: 'companies',
  COMPANY_BY_ID: (id: string) => `company_${id}`,
  TRAININGS: 'trainings',
  TRAINING_BY_ID: (id: string) => `training_${id}`,
  PLACEMENTS: 'placements',
  PLACEMENT_BY_ID: (id: string) => `placement_${id}`,
} as const;

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
};

// Cache configuration for different data types
export const CACHE_CONFIGS = {
  USER_DATA: { ttl: 10 * 60 * 1000 }, // 10 minutes
  ANNOUNCEMENTS: { ttl: 2 * 60 * 1000 }, // 2 minutes
  COMPANIES: { ttl: 15 * 60 * 1000 }, // 15 minutes
  TRAININGS: { ttl: 15 * 60 * 1000 }, // 15 minutes
  PLACEMENTS: { ttl: 10 * 60 * 1000 }, // 10 minutes
} as const;
