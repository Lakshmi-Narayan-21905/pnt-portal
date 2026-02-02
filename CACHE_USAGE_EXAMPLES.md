# Cache System Usage Examples

## Example 1: Using Cached Data in Components

Components automatically benefit from caching since all services use it. Here's what happens behind the scenes:

```tsx
// In your component
import { CompanyService } from '../services/companyService';

function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      // First call: Fetches from Firestore (slower)
      // Second call: Returns from cache (instant!)
      const data = await CompanyService.getAllCompanies();
      setCompanies(data);
      setLoading(false);
    };

    loadCompanies();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : companies.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}
```

## Example 2: Manual Cache Control

If you need to manually refresh data or clear cache:

```tsx
import { useCache } from '../hooks/useCache';
import { CompanyService } from '../services/companyService';

function CompanyListWithRefresh() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { clearCachePattern, CACHE_KEYS } = useCache();

  const loadCompanies = async () => {
    const data = await CompanyService.getAllCompanies();
    setCompanies(data);
  };

  const forceRefresh = async () => {
    // Clear cache first
    clearCachePattern(CACHE_KEYS.COMPANIES.PATTERN);
    // Then reload - will fetch fresh data from Firestore
    await loadCompanies();
  };

  return (
    <div>
      <button onClick={forceRefresh}>🔄 Force Refresh</button>
      {/* ... render companies ... */}
    </div>
  );
}
```

## Example 3: Cache Statistics in Admin Panel

```tsx
import { useCache } from '../hooks/useCache';

function AdminDashboard() {
  const { stats, clearCache } = useCache();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">System Performance</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Cache Hits</p>
          <p className="text-2xl font-bold text-green-600">{stats.hits}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Hit Rate</p>
          <p className="text-2xl font-bold text-blue-600">{stats.hitRate}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Cached Items</p>
          <p className="text-2xl font-bold text-purple-600">{stats.size}</p>
        </div>
      </div>

      <button 
        onClick={clearCache}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Clear All Cache
      </button>
    </div>
  );
}
```

## Example 4: Custom Cache Implementation

If you need custom caching logic for a new service:

```tsx
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../services/cacheService';

// Using wrapWithCache (recommended)
const getCustomData = async (id: string) => {
  return await cacheService.wrapWithCache(
    `custom_data_${id}`,
    async () => {
      // Your data fetching logic
      const response = await fetch(`/api/data/${id}`);
      return response.json();
    },
    CACHE_TTL.MEDIUM
  );
};

// OR manual cache management
const getCustomDataManual = async (id: string) => {
  const cacheKey = `custom_data_${id}`;
  
  // Try to get from cache
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from source
  const response = await fetch(`/api/data/${id}`);
  const data = await response.json();
  
  // Store in cache
  cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
  
  return data;
};

// Update function with cache invalidation
const updateCustomData = async (id: string, updates: any) => {
  await updateDoc(doc(db, 'custom', id), updates);
  
  // Invalidate cache
  cacheService.delete(`custom_data_${id}`);
  // Or invalidate all custom data
  cacheService.invalidatePattern('custom_data_');
};
```

## Example 5: React Hook for Cached Data

Create a reusable hook for any cached data:

```tsx
import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';

function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await cacheService.wrapWithCache(key, fetchFn, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    cacheService.delete(key);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [key]);

  return { data, loading, error, refresh };
}

// Usage:
function MyComponent() {
  const { data, loading, refresh } = useCachedData(
    'my-data-key',
    () => CompanyService.getAllCompanies(),
    CACHE_TTL.MEDIUM
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {/* Render data */}
    </div>
  );
}
```

## Example 6: Monitoring Cache in Development

Add this to your development tools:

```tsx
// Add to your dev tools or admin panel
import { cacheService } from '../services/cacheService';
import { realtimeListenerService } from '../services/realtimeListenerService';

function DevTools() {
  const logCacheStats = () => {
    console.table(cacheService.getStats());
    console.log('Active Listeners:', realtimeListenerService.getListenerCount());
  };

  const inspectCache = () => {
    // Log all cache keys (for debugging)
    const stats = cacheService.getStats();
    console.log('Cache contains', stats.size, 'entries');
    
    // Check specific keys
    console.log('Has companies cache?', cacheService.has('companies_all'));
    console.log('Companies TTL remaining:', 
      cacheService.getRemainingTTL('companies_all') / 1000, 'seconds'
    );
  };

  return (
    <div className="fixed bottom-0 left-0 bg-gray-900 text-white p-2 space-x-2">
      <button onClick={logCacheStats}>📊 Cache Stats</button>
      <button onClick={inspectCache}>🔍 Inspect Cache</button>
      <button onClick={() => cacheService.clear()}>🗑️ Clear Cache</button>
    </div>
  );
}
```

## Example 7: Listen to Database Changes

If you want to perform custom actions when data changes:

```tsx
import { realtimeListenerService } from '../services/realtimeListenerService';

function MyComponent() {
  useEffect(() => {
    // Register a callback when companies collection changes
    const unsubscribe = realtimeListenerService.onCollectionChange(
      'companies',
      () => {
        console.log('Companies collection changed!');
        // Perform custom action, e.g., show notification
        alert('New company drive posted!');
      }
    );

    return () => unsubscribe();
  }, []);

  return <div>Watching for changes...</div>;
}
```

## Testing Cache Behavior

To verify the cache is working:

1. **Open browser DevTools Console**
2. **Navigate to a page that loads data**
3. **Check console for cache logs:**
   ```
   [RealtimeListener] Initializing all collection listeners
   [RealtimeListener] All listeners initialized
   ```
4. **Navigate away and back to the same page**
5. **Second load should be instant (cached)**
6. **Update data in Firestore**
7. **Check console:**
   ```
   [RealtimeListener] Changes detected in companies
   ```
8. **Reload page - should fetch fresh data**

## Performance Comparison

**Without Cache:**
- First load: 800ms
- Second load: 800ms
- Third load: 800ms
- Total: 2400ms

**With Cache (5min TTL):**
- First load: 800ms (cache miss)
- Second load: 5ms (cache hit!)
- Third load: 5ms (cache hit!)
- Total: 810ms (3x faster!)

## Common Patterns

### Pattern 1: List + Detail Pages
```tsx
// List page - caches all items
const companies = await CompanyService.getAllCompanies();

// Detail page - caches individual item
const company = await CompanyService.getCompanyById(id);
```

### Pattern 2: Optimistic Updates
```tsx
// Update UI immediately
setCompanies(prev => prev.map(c => 
  c.id === id ? { ...c, ...updates } : c
));

// Update database (cache auto-invalidates)
await CompanyService.updateCompany(id, updates);

// Refresh from cache (now contains fresh data)
const updated = await CompanyService.getCompanyById(id);
```

### Pattern 3: Prefetching
```tsx
// Prefetch on hover for instant navigation
<Link 
  to={`/company/${company.id}`}
  onMouseEnter={() => CompanyService.getCompanyById(company.id)}
>
  {company.name}
</Link>
```

## Best Practices

1. ✅ **Let services handle caching** - Already implemented!
2. ✅ **Use appropriate TTL** - Short for dynamic, long for static
3. ✅ **Monitor hit rate** - Aim for 70%+
4. ✅ **Clear cache on updates** - Already handled automatically!
5. ✅ **Test cache invalidation** - Verify data stays fresh
6. ⚠️ **Don't cache auth tokens** - Security sensitive
7. ⚠️ **Don't cache large files** - Use CDN instead

## Troubleshooting

**Q: Why is my data stale?**
A: Check if real-time listeners are initialized. Restart the app.

**Q: Cache not working?**
A: Check browser console for errors. Verify localStorage is enabled.

**Q: High memory usage?**
A: Reduce TTL values or disable localStorage persistence.

**Q: Low hit rate?**
A: Increase TTL or check if data changes too frequently.

## Summary

The caching system works automatically in the background. You don't need to change your component code - just continue using the services as before, and enjoy the performance boost! 🚀
