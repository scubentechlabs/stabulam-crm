import { QueryClient } from '@tanstack/react-query';

// Cache configuration for instant loading
const STALE_TIME = 1000 * 60 * 5; // 5 minutes - data is fresh for 5 minutes
const GC_TIME = 1000 * 60 * 60; // 1 hour - keep in cache for 1 hour

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale-while-revalidate: show cached data immediately
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      // Retry failed requests
      retry: 1,
      retryDelay: 1000,
      // Refetch on window focus (but not aggressively)
      refetchOnWindowFocus: false,
      // Keep previous data while fetching new data
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// LocalStorage persistence helpers
const CACHE_KEY = 'lovable-query-cache';
const CACHE_VERSION = 1;

interface PersistedCache {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

// Save specific query data to localStorage
export function persistQueryCache() {
  try {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const cacheData: Record<string, unknown> = {};
    
    // Only persist specific queries that benefit from caching
    const persistableKeys = [
      'users',
      'teamMembers',
      'holidays',
      'rules',
      'profiles',
      'shoots',
      'attendance-history',
      'leaves',
      'extra-work',
      'notifications',
      'leave-balances',
    ];
    
    queries.forEach((query) => {
      const key = query.queryKey[0];
      if (typeof key === 'string' && persistableKeys.includes(key) && query.state.data) {
        // Store with full query key for accurate restoration
        const keyStr = JSON.stringify(query.queryKey);
        cacheData[keyStr] = query.state.data;
      }
    });
    
    const cache: PersistedCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: cacheData,
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to persist query cache:', error);
  }
}

// Restore query cache from localStorage
export function restoreQueryCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    
    const cache: PersistedCache = JSON.parse(cached);
    
    // Check version and age (max 24 hours)
    const maxAge = 1000 * 60 * 60 * 24; // 24 hours
    if (cache.version !== CACHE_VERSION || Date.now() - cache.timestamp > maxAge) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    
    // Restore each cached query
    Object.entries(cache.data).forEach(([keyStr, data]) => {
      try {
        const queryKey = JSON.parse(keyStr);
        queryClient.setQueryData(queryKey, data);
      } catch {
        // Skip invalid entries
      }
    });
  } catch (error) {
    console.warn('Failed to restore query cache:', error);
    localStorage.removeItem(CACHE_KEY);
  }
}

// Debounced persist function
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

export function schedulePersist() {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(() => {
    persistQueryCache();
  }, 2000); // Debounce for 2 seconds
}

// Set up automatic persistence on cache updates
export function setupCachePersistence() {
  // Restore on init
  restoreQueryCache();
  
  // Subscribe to cache changes
  const queryCache = queryClient.getQueryCache();
  queryCache.subscribe(() => {
    schedulePersist();
  });
  
  // Persist before page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', persistQueryCache);
  }
}

// Clear all cached data (useful for logout)
export function clearQueryCache() {
  queryClient.clear();
  localStorage.removeItem(CACHE_KEY);
}
