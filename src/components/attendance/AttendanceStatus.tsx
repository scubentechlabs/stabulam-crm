import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceStatusProps {
  clockInTime?: string | null;
  clockOutTime?: string | null;
  isLate?: boolean | null;
  lateMinutes?: number | null;
  todSubmitted?: boolean | null;
  eodSubmitted?: boolean | null;
}

export function AttendanceStatus({
  clockInTime,
  clockOutTime,
  isLate,
  lateMinutes,
  todSubmitted,
  eodSubmitted,
}: AttendanceStatusProps) {
  const getStatus = () => {
    if (!clockInTime) {
      return { label: 'Not Clocked In', color: 'bg-muted', icon: XCircle };
    }
    if (clockOutTime) {
      return { label: 'Day Complete', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 };
    }
    return { label: 'Working', color: 'bg-primary/10 text-primary', icon: Clock };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', status.color)}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{status.label}</p>
              {clockInTime && (
                <p className="text-sm text-muted-foreground">
                  Clocked in at {format(new Date(clockInTime), 'hh:mm a')}
                  {clockOutTime && ` • Out at ${format(new Date(clockOutTime), 'hh:mm a')}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLate && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Late {lateMinutes}m
              </Badge>
            )}
            
            {clockInTime && (
              <>
                <Badge variant={todSubmitted ? 'default' : 'outline'}>
                  TOD {todSubmitted ? '✓' : '○'}
                </Badge>
                <Badge variant={eodSubmitted ? 'default' : 'outline'}>
                  EOD {eodSubmitted ? '✓' : '○'}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
