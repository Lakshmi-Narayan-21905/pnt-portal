/**
 * Secure Cache Service
 * - Stores data in localStorage with encryption
 * - Implements cache invalidation based on data version/timestamp
 * - Uses plaintext keys (with prefix) to allow pattern matching, but encrypts values
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
    this.encryptionKey = this.generateEncryptionKey();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private generateEncryptionKey(): string {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fingerprint = `${userAgent}-${language}-${platform}-${screenResolution}-${timezone}`;
    return this.simpleHash(fingerprint);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private encrypt(data: string): string {
    try {
      const encrypted = this.xorCipher(data, this.encryptionKey);
      return btoa(encodeURIComponent(encrypted));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt cache data');
    }
  }

  private decrypt(encryptedData: string): string {
    try {
      const decoded = decodeURIComponent(atob(encryptedData));
      return this.xorCipher(decoded, this.encryptionKey);
    } catch (error) {
      throw new Error('Failed to decrypt cache data');
    }
  }

  private xorCipher(str: string, key: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getVersionKey(key: string): string {
    return `${this.VERSION_PREFIX}${key}`;
  }

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

      if (config?.ttl) {
        const expiryKey = `${cacheKey}_expiry`;
        localStorage.setItem(expiryKey, (Date.now() + config.ttl).toString());
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  public get<T>(key: string, config?: CacheConfig): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const encrypted = localStorage.getItem(cacheKey);

      if (!encrypted) {
        return null;
      }

      const expiryKey = `${cacheKey}_expiry`;
      const expiry = localStorage.getItem(expiryKey);
      const ttl = config?.ttl || this.defaultTTL;

      if (expiry && Date.now() > parseInt(expiry)) {
        this.delete(key);
        return null;
      }

      const decrypted = this.decrypt(encrypted);
      const cacheItem: CacheItem<T> = JSON.parse(decrypted);

      if (Date.now() - cacheItem.timestamp > ttl) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      this.delete(key);
      return null;
    }
  }

  public async wrapWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config?: CacheConfig | number
  ): Promise<T> {
    const cacheConfig = typeof config === 'number' ? { ttl: config } : config;

    const cached = this.get<T>(key, cacheConfig);
    if (cached) {
      return cached;
    }

    const data = await fetchFn();

    this.set(key, data, cacheConfig);

    return data;
  }

  public isValid(key: string, serverVersion?: string): boolean {
    try {
      const cacheKey = this.getCacheKey(key);
      const encrypted = localStorage.getItem(cacheKey);

      if (!encrypted) return false;

      const expiryKey = `${cacheKey}_expiry`;
      const expiry = localStorage.getItem(expiryKey);
      if (expiry && Date.now() > parseInt(expiry)) {
        return false;
      }

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

  private generateDataVersion(data: any): string {
    const str = JSON.stringify(data);
    return this.simpleHash(str);
  }

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

  public invalidatePattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(storageKey => {
        if (storageKey.startsWith(this.CACHE_PREFIX)) {
          const logicalKey = storageKey.substring(this.CACHE_PREFIX.length);
          if (logicalKey.includes(pattern)) {
            this.delete(logicalKey);
            console.log(`[Cache] Invalidated ${logicalKey} matching pattern ${pattern}`);
          }
        }
      });
    } catch (error) {
      console.error('[Cache] Error invalidating pattern:', error);
    }
  }

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
}

export const cacheService = CacheService.getInstance();

export const CACHE_KEYS = {
  USERS: {
    PATTERN: 'users_',
    ALL: (role: string) => `users_role_${role}`,
  },

  USER_PROFILE: (uid: string) => `users_profile_${uid}`,
  ALL_USERS: 'users_all',
  USERS_BY_ROLE: (role: string) => `users_role_${role}`,

  // Announcements
  ANNOUNCEMENTS: 'announcements',
  PATTERN_ANNOUNCEMENTS: 'announcements',

  // Companies
  COMPANIES: 'companies',
  COMPANY_BY_ID: (id: string) => `companies_id_${id}`,
  PATTERN_COMPANIES: 'companies',

  // Trainings
  TRAININGS: 'trainings',
  TRAINING_BY_ID: (id: string) => `trainings_id_${id}`,
  PATTERN_TRAININGS: 'trainings',

  // Placements
  PLACEMENTS: 'placements',
  PLACEMENT_BY_ID: (id: string) => `placements_id_${id}`,

  // Special keys for listener
  PLACEMENT_RECORDS: { PATTERN: 'placements' }
} as const;

export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 15 * 60 * 1000
};

export const CACHE_CONFIGS = {
  USER_DATA: { ttl: 10 * 60 * 1000 },
  ANNOUNCEMENTS: { ttl: 2 * 60 * 1000 },
  COMPANIES: { ttl: 15 * 60 * 1000 },
  TRAININGS: { ttl: 15 * 60 * 1000 },
  PLACEMENTS: { ttl: 10 * 60 * 1000 },
} as const;
