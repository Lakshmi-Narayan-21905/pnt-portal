import { useCallback } from 'react';
import { cacheService } from '../services/cacheService';
import { UserService } from '../services/userService';
import { AnnouncementService } from '../services/announcementService';
import { CompanyService } from '../services/companyService';
import { TrainingService } from '../services/trainingService';
import { PlacementRecordService } from '../services/placementRecordService';

/**
 * Custom hook for cache management
 * Provides utilities to clear cache and force refresh data
 */
export const useCacheManagement = () => {
  /**
   * Clear all caches across the application
   */
  const clearAllCaches = useCallback(() => {
    cacheService.clearAll();
    console.log('All caches cleared');
  }, []);

  /**
   * Clear cache for a specific service
   */
  const clearServiceCache = useCallback((service: 'users' | 'announcements' | 'companies' | 'trainings' | 'placements') => {
    switch (service) {
      case 'users':
        UserService.clearCache();
        break;
      case 'announcements':
        AnnouncementService.clearCache();
        break;
      case 'companies':
        CompanyService.clearCache();
        break;
      case 'trainings':
        TrainingService.clearCache();
        break;
      case 'placements':
        PlacementRecordService.clearCache();
        break;
    }
    console.log(`Cache cleared for ${service}`);
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return cacheService.getStats();
  }, []);

  /**
   * Manual refresh - clear cache and reload data
   */
  const forceRefresh = useCallback(() => {
    clearAllCaches();
    // Optionally trigger a page reload or refetch
    window.location.reload();
  }, [clearAllCaches]);

  return {
    clearAllCaches,
    clearServiceCache,
    getCacheStats,
    forceRefresh
  };
};

/**
 * Custom hook to check if cache is being used
 */
export const useCacheStatus = () => {
  const stats = cacheService.getStats();
  
  return {
    isActive: stats.totalEntries > 0,
    totalEntries: stats.totalEntries,
    totalSize: stats.totalSize,
    sizeInKB: (stats.totalSize / 1024).toFixed(2)
  };
};
