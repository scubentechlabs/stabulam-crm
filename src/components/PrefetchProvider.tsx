import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { prefetchCriticalData } from '@/lib/prefetch';

/**
 * PrefetchProvider - Handles initial prefetching of critical data
 * Runs once when the user is authenticated to ensure instant navigation
 */
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once when user is authenticated and not loading
    if (!isLoading && user && !hasPrefetched.current) {
      hasPrefetched.current = true;
      
      // Prefetch critical data in the background
      prefetchCriticalData(user.id, isAdmin).catch((error) => {
        console.warn('Background prefetch failed:', error);
      });
    }

    // Reset when user logs out
    if (!user) {
      hasPrefetched.current = false;
    }
  }, [user, isAdmin, isLoading]);

  return <>{children}</>;
}
