/**
 * useCache - React hook for interacting with the cache service
 * Provides utilities to check cache status, clear cache, and view statistics
 */

import { useState, useEffect } from 'react';
import { cacheService, CACHE_KEYS } from '../services/cacheService';

export const useCache = () => {
    const [stats, setStats] = useState(cacheService.getStats());

    // Update stats periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(cacheService.getStats());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const clearCache = () => {
        cacheService.clear();
        setStats(cacheService.getStats());
    };

    const clearCachePattern = (pattern: string) => {
        cacheService.invalidatePattern(pattern);
        setStats(cacheService.getStats());
    };

    const resetStats = () => {
        cacheService.resetStats();
        setStats(cacheService.getStats());
    };

    return {
        stats,
        clearCache,
        clearCachePattern,
        resetStats,
        CACHE_KEYS // Export for convenience
    };
};
