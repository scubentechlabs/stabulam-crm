import { useEffect, useMemo } from 'react';
import { format, isSameDay, isToday, isFuture, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttendanceHistory, type AttendanceDay } from '@/hooks/useAttendanceHistory';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayCellProps {
  date: Date;
  attendance: AttendanceDay | null;
  isCurrentMonth: boolean;
}

function DayCell({ date, attendance, isCurrentMonth }: DayCellProps) {
  const today = isToday(date);
  const future = isFuture(date);
  const weekend = isWeekend(date);

  const getStatusColor = () => {
    if (future || !isCurrentMonth) return 'bg-transparent';
    if (!attendance) {
      if (weekend) return 'bg-muted/30';
      return 'bg-red-500/10'; // Absent
    }
    if (attendance.isLate) return 'bg-yellow-500/20';
    if (attendance.clockOutTime) return 'bg-green-500/20';
    return 'bg-blue-500/20'; // Clocked in, still working
  };

  const getStatusIcon = () => {
    if (future || !isCurrentMonth || weekend) return null;
    if (!attendance) return <XCircle className="h-3 w-3 text-red-500" />;
    if (attendance.isLate) return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
    if (attendance.clockOutTime) return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    return <Clock className="h-3 w-3 text-blue-600" />;
  };

  const tooltipContent = () => {
    if (future) return 'Future date';
    if (weekend && !attendance) return 'Weekend';
    if (!attendance) return 'Absent';
    
    const inTime = attendance.clockInTime 
      ? format(new Date(attendance.clockInTime), 'h:mm a')
      : '-';
    const outTime = attendance.clockOutTime 
      ? format(new Date(attendance.clockOutTime), 'h:mm a')
      : 'Still working';
    
    let status = attendance.clockOutTime ? 'Completed' : 'In Progress';
    if (attendance.isLate) {
      status = `Late by ${attendance.lateMinutes} min`;
    }

    return (
      <div className="text-xs space-y-1">
        <p className="font-medium">{format(date, 'EEEE, MMM d')}</p>
        <p>In: {inTime}</p>
        <p>Out: {outTime}</p>
        <p className="text-muted-foreground">{status}</p>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative aspect-square p-1 flex flex-col items-center justify-center rounded-md transition-colors cursor-default',
              getStatusColor(),
              today && 'ring-2 ring-primary ring-offset-1',
              !isCurrentMonth && 'opacity-30'
            )}
          >
            <span className={cn(
              'text-sm font-medium',
              today && 'text-primary font-bold',
              weekend && !attendance && 'text-muted-foreground'
            )}>
              {format(date, 'd')}
            </span>
            <div className="absolute bottom-0.5">
              {getStatusIcon()}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="pointer-events-auto">
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AttendanceCalendar() {
  const {
    isLoading,
    currentMonth,
    fetchMonthAttendance,
    getAttendanceForDate,
    getMonthStats,
  } = useAttendanceHistory();

  useEffect(() => {
    fetchMonthAttendance(currentMonth);
  }, []);

  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    fetchMonthAttendance(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    fetchMonthAttendance(nextMonth);
  };

  const handleCurrentMonth = () => {
    fetchMonthAttendance(new Date());
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days at the start
    const startPadding = getDay(monthStart);
    const paddingDays: Date[] = [];
    for (let i = startPadding - 1; i >= 0; i--) {
      const paddingDate = new Date(monthStart);
      paddingDate.setDate(paddingDate.getDate() - (i + 1));
      paddingDays.push(paddingDate);
    }
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const stats = getMonthStats();
  const isCurrentMonthView = isSameDay(startOfMonth(currentMonth), startOfMonth(new Date()));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance History
            </CardTitle>
            <CardDescription>
              Your monthly attendance overview
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCurrentMonth}
              disabled={isCurrentMonthView}
              className="min-w-[140px]"
            >
              {format(currentMonth, 'MMMM yyyy')}
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{stats.totalDays}</p>
            <p className="text-xs text-muted-foreground">Days Present</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xl font-bold text-green-600">{stats.onTimeDays}</p>
            <p className="text-xs text-muted-foreground">On Time</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.lateDays}</p>
            <p className="text-xs text-muted-foreground">Late Days</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.avgLateMinutes}m</p>
            <p className="text-xs text-muted-foreground">Avg Late Time</p>
          </div>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div 
                  key={day} 
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                return (
                  <DayCell
                    key={date.toISOString()}
                    date={date}
                    attendance={getAttendanceForDate(date)}
                    isCurrentMonth={isCurrentMonth}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <span>On Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500/20" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500/20" />
            <span>Working</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/10" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-primary" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
