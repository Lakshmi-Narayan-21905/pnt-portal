/**
 * CacheMonitor - Component to display cache statistics and provide manual controls
 * Can be added to admin dashboard or used as a dev tool
 */

import React, { useState } from 'react';
import { useCache } from '../hooks/useCache';

export const CacheMonitor: React.FC = () => {
    const { stats, clearCache, clearCachePattern, resetStats, CACHE_KEYS } = useCache();
    const [showMonitor, setShowMonitor] = useState(false);

    return (
        <>
            {/* Floating button to toggle monitor */}
            <button
                onClick={() => setShowMonitor(!showMonitor)}
                className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
                title="Cache Monitor"
            >
                📊 Cache
            </button>

            {/* Cache Monitor Panel */}
            {showMonitor && (
                <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-96 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Cache Monitor
                        </h3>
                        <button
                            onClick={() => setShowMonitor(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard label="Cache Hits" value={stats.hits} color="green" />
                            <StatCard label="Cache Misses" value={stats.misses} color="red" />
                        </div>
                        <StatCard label="Hit Rate" value={stats.hitRate} color="blue" />
                        <StatCard label="Cached Entries" value={stats.size} color="purple" />
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={clearCache}
                            className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Clear All Cache
                        </button>
                        
                        <button
                            onClick={resetStats}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Reset Statistics
                        </button>

                        {/* Pattern-based clear buttons */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Clear by Type:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <ActionButton
                                    label="Users"
                                    onClick={() => clearCachePattern(CACHE_KEYS.USERS.PATTERN)}
                                />
                                <ActionButton
                                    label="Companies"
                                    onClick={() => clearCachePattern(CACHE_KEYS.COMPANIES.PATTERN)}
                                />
                                <ActionButton
                                    label="Trainings"
                                    onClick={() => clearCachePattern(CACHE_KEYS.TRAININGS.PATTERN)}
                                />
                                <ActionButton
                                    label="Announcements"
                                    onClick={() => clearCachePattern(CACHE_KEYS.ANNOUNCEMENTS.PATTERN)}
                                />
                                <ActionButton
                                    label="Placements"
                                    onClick={() => clearCachePattern(CACHE_KEYS.PLACEMENT_RECORDS.PATTERN)}
                                    className="col-span-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cache Efficiency Indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <CacheEfficiency hitRate={stats.hitRate} />
                    </div>
                </div>
            )}
        </>
    );
};

// Helper Components

const StatCard: React.FC<{ label: string; value: string | number; color: string }> = ({ 
    label, 
    value, 
    color 
}) => {
    const colorClasses = {
        green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    };

    return (
        <div className={`p-3 rounded ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="text-xs font-medium opacity-75">{label}</div>
            <div className="text-xl font-bold mt-1">{value}</div>
        </div>
    );
};

const ActionButton: React.FC<{ 
    label: string; 
    onClick: () => void; 
    className?: string 
}> = ({ label, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors ${className}`}
    >
        {label}
    </button>
);

const CacheEfficiency: React.FC<{ hitRate: string }> = ({ hitRate }) => {
    const rate = parseFloat(hitRate);
    let status = 'Good';
    let statusColor = 'text-green-600 dark:text-green-400';
    
    if (rate < 50) {
        status = 'Poor';
        statusColor = 'text-red-600 dark:text-red-400';
    } else if (rate < 70) {
        status = 'Fair';
        statusColor = 'text-yellow-600 dark:text-yellow-400';
    } else if (rate >= 85) {
        status = 'Excellent';
        statusColor = 'text-green-600 dark:text-green-400';
    }

    return (
        <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Cache Efficiency
            </p>
            <p className={`text-lg font-bold ${statusColor}`}>
                {status}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rate >= 70 ? '🎉 Cache is working well!' : rate >= 50 ? '📈 Room for improvement' : '⚠️ Check cache configuration'}
            </p>
        </div>
    );
};

export default CacheMonitor;
