import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Calendar as CalendarIcon, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Holiday } from '@/hooks/useHolidays';

interface HolidayCalendarViewProps {
  holidays: Holiday[];
  isLoading?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HolidayCalendarView({ holidays, isLoading }: HolidayCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getHolidayForDate = (date: Date): { type: 'sunday' | 'custom'; holiday?: Holiday } | null => {
    // Check Sunday first
    if (date.getDay() === 0) {
      return { type: 'sunday' };
    }

    // Check custom holidays
    const dateStr = format(date, 'yyyy-MM-dd');
    const monthDay = format(date, 'MM-dd');

    const customHoliday = holidays.find(holiday => {
      if (holiday.is_recurring) {
        return holiday.date.slice(5) === monthDay;
      }
      return holiday.date === dateStr;
    });

    if (customHoliday) {
      return { type: 'custom', holiday: customHoliday };
    }

    return null;
  };

  const monthHolidayStats = useMemo(() => {
    let sundays = 0;
    let customHolidays = 0;

    calendarDays.forEach(day => {
      if (!isSameMonth(day, currentMonth)) return;
      const holidayInfo = getHolidayForDate(day);
      if (holidayInfo?.type === 'sunday') sundays++;
      else if (holidayInfo?.type === 'custom') customHolidays++;
    });

    return { sundays, customHolidays, total: sundays + customHolidays };
  }, [calendarDays, currentMonth, holidays]);

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Holiday Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-orange-500/10 text-center">
            <p className="text-xl font-bold text-orange-600">{monthHolidayStats.sundays}</p>
            <p className="text-xs text-muted-foreground">Sundays</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-xl font-bold text-primary">{monthHolidayStats.customHolidays}</p>
            <p className="text-xs text-muted-foreground">Custom Holidays</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{monthHolidayStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Holidays</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/40" />
            <span className="text-muted-foreground">Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40" />
            <span className="text-muted-foreground">Custom Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-primary" />
            <span className="text-muted-foreground">Today</span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-center text-xs font-medium py-2',
                index === 0 && 'text-orange-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const holidayInfo = getHolidayForDate(day);

            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'relative min-h-[60px] p-1 rounded-md border transition-colors',
                        !isCurrentMonth && 'opacity-30',
                        today && 'ring-2 ring-primary ring-offset-1',
                        holidayInfo?.type === 'sunday' && 'bg-orange-500/10 border-orange-500/30',
                        holidayInfo?.type === 'custom' && 'bg-primary/10 border-primary/30',
                        !holidayInfo && 'bg-background'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          today && 'text-primary font-bold',
                          holidayInfo?.type === 'sunday' && 'text-orange-600'
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {holidayInfo && (
                        <div className="absolute bottom-1 left-1 right-1">
                          {holidayInfo.type === 'sunday' ? (
                            <div className="flex items-center gap-0.5">
                              <Sun className="h-3 w-3 text-orange-500" />
                              <span className="text-[9px] text-orange-600 truncate">Sunday</span>
                            </div>
                          ) : holidayInfo.holiday && (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-primary" />
                              <span className="text-[9px] text-primary truncate">
                                {holidayInfo.holiday.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs space-y-1">
                      <p className="font-medium">{format(day, 'EEEE, MMMM d, yyyy')}</p>
                      {holidayInfo?.type === 'sunday' && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/40">
                          Weekly Holiday (Sunday)
                        </Badge>
                      )}
                      {holidayInfo?.type === 'custom' && holidayInfo.holiday && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40">
                            {holidayInfo.holiday.name}
                          </Badge>
                          {holidayInfo.holiday.description && (
                            <p className="text-muted-foreground">{holidayInfo.holiday.description}</p>
                          )}
                          {holidayInfo.holiday.is_recurring && (
                            <p className="text-muted-foreground italic">Recurring annually</p>
                          )}
                        </div>
                      )}
                      {!holidayInfo && <p className="text-muted-foreground">Working day</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
