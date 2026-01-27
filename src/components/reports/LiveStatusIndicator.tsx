import { useRealtimeConnectionStatus, ConnectionStatus } from '@/hooks/useRealtimeDashboard';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusConfig: Record<ConnectionStatus, { label: string; color: string; bgColor: string; pulseColor: string }> = {
  connected: {
    label: 'Live',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    pulseColor: 'bg-emerald-500',
  },
  connecting: {
    label: 'Connecting',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    pulseColor: 'bg-amber-500',
  },
  disconnected: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    pulseColor: 'bg-muted-foreground',
  },
  error: {
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    pulseColor: 'bg-red-500',
  },
};

export function LiveStatusIndicator() {
  const status = useRealtimeConnectionStatus();
  const config = statusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              config.bgColor,
              config.color
            )}
          >
            {/* Animated pulse dot */}
            <span className="relative flex h-2 w-2">
              {status === 'connected' && (
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                    config.pulseColor
                  )}
                />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  config.pulseColor
                )}
              />
            </span>

            {/* Icon */}
            {status === 'connecting' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : status === 'connected' ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}

            {/* Label */}
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover border shadow-md">
          <p className="text-sm">
            {status === 'connected' && 'Real-time updates are active. Data syncs automatically.'}
            {status === 'connecting' && 'Establishing real-time connection...'}
            {status === 'disconnected' && 'Real-time updates are inactive.'}
            {status === 'error' && 'Connection error. Refresh to retry.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
