import { useState } from 'react';
import { LogOut, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAttendance } from '@/hooks/useAttendance';
import { formatTimeIST } from '@/lib/utils';

interface ClockOutCardProps {
  eodCompleted: boolean;
  onRequestEod: () => void;
  onClockOutComplete: () => void;
}

export function ClockOutCard({ eodCompleted, onRequestEod, onClockOutComplete }: ClockOutCardProps) {
  const { todayAttendance, clockOut, isClockingOut } = useAttendance();

  const handleClockOut = async () => {
    const result = await clockOut();
    if (result) {
      onClockOutComplete();
    }
  };

  const clockInTime = todayAttendance?.clock_in_time 
    ? formatTimeIST(todayAttendance.clock_in_time)
    : '--:--';

  const workDuration = todayAttendance?.clock_in_time
    ? (() => {
        const start = new Date(todayAttendance.clock_in_time);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      })()
    : '--';

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <LogOut className="h-6 w-6 text-primary" />
          Clock Out
        </CardTitle>
        <CardDescription>
          End your work day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Work summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Clocked In</p>
            <p className="text-lg font-semibold">{clockInTime}</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-lg font-semibold">{workDuration}</p>
          </div>
        </div>

        {/* Late indicator */}
        {todayAttendance?.is_late && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You were {todayAttendance.late_minutes} minutes late today.
            </AlertDescription>
          </Alert>
        )}

        {/* EOD requirement */}
        {!eodCompleted && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete your End of Day (EOD) report before clocking out.
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        {!eodCompleted ? (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={onRequestEod}
          >
            Complete EOD Report
          </Button>
        ) : (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleClockOut}
            disabled={isClockingOut}
          >
            {isClockingOut ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Clocking Out...
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2" />
                Clock Out Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
