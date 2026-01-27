import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'attendance' | 'tasks' | 'leaves' | 'leave_balances';

interface UseRealtimeDashboardOptions {
  tables: TableName[];
  onDataChange: () => void;
  enabled?: boolean;
}

export function useRealtimeDashboard({
  tables,
  onDataChange,
  enabled = true,
}: UseRealtimeDashboardOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced callback to avoid too many refetches
  const debouncedCallback = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onDataChange();
    }, 500);
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    // Create a single channel for all table subscriptions
    const channel = supabase.channel('dashboard-realtime');

    // Subscribe to each table
    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          console.log(`Realtime update on ${table}:`, payload.eventType);
          debouncedCallback();
        }
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Dashboard realtime subscribed to:', tables.join(', '));
      }
    });

    channelRef.current = channel;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tables, debouncedCallback, enabled]);

  return {
    isSubscribed: channelRef.current !== null,
  };
}
