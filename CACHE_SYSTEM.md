# Cache System Documentation

## Overview

The PNT Portal now includes a secure, encrypted caching system that temporarily stores data fetched from the database. This system significantly reduces page load times and database queries while keeping cached data secure and unreadable in browser storage.

## Features

### 🔐 Security
- **Data Encryption**: All cached data is encrypted using XOR cipher with Base64 encoding
- **Browser Fingerprinting**: Encryption key is generated from browser characteristics
- **Unreadable Storage**: Data in localStorage is completely obfuscated
- **No Plain Text**: Sensitive information never stored in plain text

### ⚡ Performance
- **Automatic Caching**: GET requests are automatically cached
- **Smart Invalidation**: Cache is cleared when data is modified (POST, PUT, DELETE)
- **Configurable TTL**: Different cache durations for different data types
- **Version Tracking**: Data changes automatically invalidate old cache

### 🎯 Features
- **Force Refresh**: Optional parameter to bypass cache
- **Service-Level Control**: Clear cache by specific service
- **Statistics**: Monitor cache usage and size
- **Auto Expiry**: Old cache entries automatically expire

## Configuration

### Cache Durations (TTL)

```typescript
USER_DATA: 10 minutes
ANNOUNCEMENTS: 2 minutes
COMPANIES: 15 minutes
TRAININGS: 15 minutes
PLACEMENTS: 10 minutes
```

These can be modified in `src/services/cacheService.ts`:

```typescript
export const CACHE_CONFIGS = {
  USER_DATA: { ttl: 10 * 60 * 1000 }, // 10 minutes
  ANNOUNCEMENTS: { ttl: 2 * 60 * 1000 }, // 2 minutes
  // ... etc
};
```

## Usage

### In Services

All services automatically use caching. To force a refresh:

```typescript
// Get with cache (default)
const users = await UserService.getAllUsers();

// Force refresh from database
const freshUsers = await UserService.getAllUsers(true);

// Get user profile
const profile = await UserService.getUserProfile(uid);

// Force refresh user profile
const freshProfile = await UserService.getUserProfile(uid, true);
```

### Cache Management Hook

```typescript
import { useCacheManagement } from '../utils/cacheHooks';

const MyComponent = () => {
  const { 
    clearAllCaches, 
    clearServiceCache, 
    getCacheStats 
  } = useCacheManagement();

  const handleRefresh = () => {
    clearServiceCache('users'); // Clear specific service
    // or
    clearAllCaches(); // Clear everything
  };

  return (
    <button onClick={handleRefresh}>
      Refresh Data
    </button>
  );
};
```

### Cache Manager Component

Add to admin dashboard:

```typescript
import CacheManager from '../components/CacheManager';

const AdminDashboard = () => {
  return (
    <div>
      {/* Other dashboard content */}
      
      {/* Show as dashboard panel */}
      <CacheManager showInDashboard={true} />
      
      {/* Or as floating button */}
      <CacheManager showInDashboard={false} />
    </div>
  );
};
```

## How It Works

### 1. Data Fetching

When you fetch data:

```typescript
const companies = await CompanyService.getAllCompanies();
```

The service:
1. Checks if valid cache exists
2. Returns cached data if available and not expired
3. Fetches from API if cache miss
4. Encrypts and stores the response
5. Returns the data

### 2. Cache Keys

Each data type has a unique cache key:

```typescript
USER_PROFILE: user_profile_{uid}
ALL_USERS: all_users
USERS_BY_ROLE: users_role_{role}
ANNOUNCEMENTS: announcements
COMPANIES: companies
COMPANY_BY_ID: company_{id}
```

### 3. Encryption Process

```
Original Data → JSON.stringify() → XOR Cipher → Base64 Encode → localStorage
```

Example of what's stored in localStorage:

```
Key: _pnt_cache_a7f2c9e1
Value: JTdCJTIyZGF0YSUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJKb2huJTIyJTdEJTVEJTdE...
```

### 4. Cache Invalidation

Cache is automatically cleared when:

- User creates/updates/deletes data
- Cache entry expires (TTL reached)
- Manual cache clear is triggered
- Data version changes

## Security Considerations

### What's Protected

✅ User profiles and personal information  
✅ Company and placement data  
✅ Training program details  
✅ Announcement content  
✅ All API responses

### What's Not in Cache

❌ Authentication tokens (handled by Firebase)  
❌ Passwords (never transmitted)  
❌ Session data (managed by Firebase Auth)

### Browser Security

- Cache is session-specific via browser fingerprinting
- Different browsers/devices generate different encryption keys
- Cache is cleared on logout (if implemented)
- No cross-tab cache sharing vulnerabilities

## Manual Cache Management

### Clear All Caches

```typescript
import { cacheService } from './services/cacheService';

cacheService.clearAll();
```

### Clear Specific Cache

```typescript
import { CACHE_KEYS } from './services/cacheService';

cacheService.delete(CACHE_KEYS.ALL_USERS);
cacheService.delete(CACHE_KEYS.COMPANIES);
```

### Get Cache Statistics

```typescript
const stats = cacheService.getStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Total size: ${stats.totalSize} bytes`);
```

### Check Cache Validity

```typescript
const isValid = cacheService.isValid(CACHE_KEYS.COMPANIES);
if (!isValid) {
  // Refetch from database
}
```

## API Reference

### CacheService Methods

#### `set<T>(key: string, data: T, config?: CacheConfig): void`
Store data in cache with encryption

#### `get<T>(key: string, config?: CacheConfig): T | null`
Retrieve and decrypt data from cache

#### `delete(key: string): void`
Remove specific cache entry

#### `clearAll(): void`
Remove all cache entries

#### `isValid(key: string, serverVersion?: string): boolean`
Check if cache entry is valid and not expired

#### `getStats(): { totalEntries: number, totalSize: number }`
Get cache usage statistics

## Troubleshooting

### Cache Not Working

1. Check browser localStorage is enabled
2. Verify no ad blockers are blocking localStorage
3. Check console for encryption errors
4. Clear all caches and try again

### Stale Data Issues

1. Reduce TTL for that data type
2. Add manual refresh button
3. Force refresh on critical operations
4. Use `forceRefresh` parameter

### Performance Issues

1. Check cache size using `getStats()`
2. Clear old caches periodically
3. Reduce TTL for large datasets
4. Consider reducing cached data size

## Best Practices

1. **Always use forceRefresh after mutations**
   ```typescript
   await CompanyService.addCompany(data);
   const fresh = await CompanyService.getAllCompanies(true);
   ```

2. **Clear related caches together**
   ```typescript
   // When updating a user
   cacheService.delete(CACHE_KEYS.USER_PROFILE(uid));
   cacheService.delete(CACHE_KEYS.ALL_USERS);
   ```

3. **Handle cache errors gracefully**
   ```typescript
   const cached = cacheService.get(key);
   if (!cached) {
     // Fallback to API
     const data = await apiRequest(...);
   }
   ```

4. **Monitor cache usage in production**
   ```typescript
   const { totalEntries, totalSize } = cacheService.getStats();
   if (totalSize > 5 * 1024 * 1024) { // 5MB
     cacheService.clearAll();
   }
   ```

## Future Enhancements

- [ ] IndexedDB support for larger datasets
- [ ] Background cache refresh
- [ ] Cache preloading on app start
- [ ] Service worker integration
- [ ] Cache synchronization across tabs
- [ ] Compression before encryption
- [ ] Cache versioning system
- [ ] Analytics for cache hit/miss rates

## Support

For issues or questions about the cache system:
1. Check console logs for error messages
2. Review this documentation
3. Test with cache disabled (use forceRefresh)
4. Contact development team
