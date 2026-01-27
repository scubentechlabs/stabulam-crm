import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'attendance' | 'tasks' | 'leaves' | 'leave_balances';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRealtimeDashboardOptions {
  tables: TableName[];
  onDataChange: () => void;
  enabled?: boolean;
}

// Global state for connection status (shared across all hook instances)
let globalConnectionStatus: ConnectionStatus = 'disconnected';
let globalListeners: Set<(status: ConnectionStatus) => void> = new Set();

function notifyListeners(status: ConnectionStatus) {
  globalConnectionStatus = status;
  globalListeners.forEach(listener => listener(status));
}

export function useRealtimeConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(globalConnectionStatus);

  useEffect(() => {
    const listener = (newStatus: ConnectionStatus) => setStatus(newStatus);
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  return status;
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
    if (!enabled || tables.length === 0) {
      return;
    }

    notifyListeners('connecting');

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
        notifyListeners('connected');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Dashboard realtime channel error');
        notifyListeners('error');
      } else if (status === 'CLOSED') {
        notifyListeners('disconnected');
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
        notifyListeners('disconnected');
      }
    };
  }, [tables, debouncedCallback, enabled]);

  return {
    isSubscribed: channelRef.current !== null,
  };
}
