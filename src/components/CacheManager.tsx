import React, { useState, useEffect } from 'react';
import { useCacheManagement, useCacheStatus } from '../utils/cacheHooks';

interface CacheManagerProps {
  showInDashboard?: boolean;
  className?: string;
}

/**
 * Cache Manager Component
 * Provides UI for cache management and statistics
 * Can be embedded in admin dashboards or settings pages
 */
export const CacheManager: React.FC<CacheManagerProps> = ({ 
  showInDashboard = false,
  className = '' 
}) => {
  const { clearAllCaches, clearServiceCache, getCacheStats } = useCacheManagement();
  const cacheStatus = useCacheStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, totalSize: 0 });

  useEffect(() => {
    if (showDetails) {
      setStats(getCacheStats());
    }
  }, [showDetails, getCacheStats]);

  const handleClearService = (service: 'users' | 'announcements' | 'companies' | 'trainings' | 'placements') => {
    if (confirm(`Clear ${service} cache?`)) {
      clearServiceCache(service);
      setStats(getCacheStats());
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all caches? This will reload the page.')) {
      clearAllCaches();
      window.location.reload();
    }
  };

  if (!showInDashboard) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Cache Manager
        </button>

        {showDetails && (
          <div className="absolute bottom-12 right-0 bg-white shadow-2xl rounded-lg p-4 w-80 border border-gray-200">
            <h3 className="font-bold text-lg mb-3 text-gray-800">Cache Manager</h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {cacheStatus.isActive ? '🟢 Active' : '🔴 Inactive'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Entries:</strong> {stats.totalEntries}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Size:</strong> {(stats.totalSize / 1024).toFixed(2)} KB
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-sm text-gray-700">Clear by Service:</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['users', 'announcements', 'companies', 'trainings', 'placements'] as const).map(service => (
                  <button
                    key={service}
                    onClick={() => handleClearService(service)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleClearAll}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Clear All Caches
            </button>
          </div>
        )}
      </div>
    );
  }

  // Dashboard view
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="font-bold text-xl mb-4 text-gray-800">Cache Management</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalEntries}</p>
          <p className="text-sm text-gray-600">Cached Items</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{(stats.totalSize / 1024).toFixed(2)}</p>
          <p className="text-sm text-gray-600">Size (KB)</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{cacheStatus.isActive ? '🟢' : '🔴'}</p>
          <p className="text-sm text-gray-600">Status</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <h4 className="font-semibold text-gray-700">Clear Cache by Service:</h4>
        <div className="grid grid-cols-2 gap-3">
          {(['users', 'announcements', 'companies', 'trainings', 'placements'] as const).map(service => (
            <button
              key={service}
              onClick={() => handleClearService(service)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              {service.charAt(0).toUpperCase() + service.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleClearAll}
        className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
      >
        Clear All Caches & Reload
      </button>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          ⚠️ Note: Cached data is encrypted and stored in browser local storage. 
          Clear cache if you experience stale data issues.
        </p>
      </div>
    </div>
  );
};

export default CacheManager;
