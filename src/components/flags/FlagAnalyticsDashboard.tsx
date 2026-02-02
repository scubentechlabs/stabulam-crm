import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek, isToday, isSameMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFlags, type FlagFilters } from '@/hooks/useFlags';
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlagAnalyticsDashboardProps {
  onDateSelect?: (date: Date) => void;
  onEmployeeSelect?: (employeeId: string) => void;
}

type ViewMode = 'month' | 'week';

export function FlagAnalyticsDashboard({
  onDateSelect,
  onEmployeeSelect,
}: FlagAnalyticsDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    } else {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
  }, [currentDate, viewMode]);

  const { useFlagStats } = useFlags();
  const { data: stats, isLoading } = useFlagStats(dateRange.start, dateRange.end);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    }
  }, [currentDate, viewMode, dateRange]);

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const getFlagCountForDate = (date: Date): number => {
    if (!stats?.byDate) return 0;
    const dateKey = format(date, 'yyyy-MM-dd');
    return stats.byDate[dateKey] || 0;
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Flag className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.openCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.acknowledgedCount || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.topFlagged?.length || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Employees Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Flag Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="h-7 px-3"
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="h-7 px-3"
                  >
                    Month
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigatePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {viewMode === 'month'
                      ? format(currentDate, 'MMMM yyyy')
                      : `${format(dateRange.start, 'dd MMM')} - ${format(
                          dateRange.end,
                          'dd MMM'
                        )}`}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const flagCount = getFlagCountForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect?.(day)}
                    className={cn(
                      'aspect-square p-1 rounded-lg border transition-all hover:bg-muted/50',
                      isToday(day) && 'border-primary',
                      !isCurrentMonth && viewMode === 'month' && 'opacity-40',
                      flagCount > 0 && 'bg-destructive/5 border-destructive/20'
                    )}
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <span
                        className={cn(
                          'text-sm',
                          isToday(day) && 'font-bold text-primary'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {flagCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px] mt-0.5"
                        >
                          {flagCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
                <span>Days with flags</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-primary" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Flagged Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Most Flagged Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.topFlagged && stats.topFlagged.length > 0 ? (
              <div className="space-y-3">
                {stats.topFlagged.map((item, index) => (
                  <button
                    key={item.employee_id}
                    onClick={() => onEmployeeSelect?.(item.employee_id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                        index === 0 && 'bg-destructive/20 text-destructive',
                        index === 1 && 'bg-amber-500/20 text-amber-600',
                        index === 2 && 'bg-orange-500/20 text-orange-600',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {item.count} {item.count === 1 ? 'flag' : 'flags'}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No flags in this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
