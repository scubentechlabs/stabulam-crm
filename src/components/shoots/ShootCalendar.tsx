import { useState } from 'react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatTimeOnlyIST } from '@/lib/utils';
import type { ShootWithAssignments } from '@/hooks/useShoots';

interface ShootCalendarProps {
  shoots: ShootWithAssignments[];
  onDateClick?: (date: Date) => void;
  onShootClick?: (shoot: ShootWithAssignments) => void;
}

export function ShootCalendar({ shoots, onDateClick, onShootClick }: ShootCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getShootsForDay = (day: Date) => {
    return shoots.filter(shoot => isSameDay(parseISO(shoot.shoot_date), day));
  };

  const today = new Date();

  const getStatusStyles = (status: string | null) => {
    switch (status) {
      case 'given_by_editor':
        return 'bg-emerald-500 text-white';
      case 'completed':
        return 'bg-yellow-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      case 'pending':
      default:
        return 'bg-red-500 text-white';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'given_by_editor':
        return 'Given By Editor';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
        {days.map((day, idx) => {
          const dayShots = getShootsForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const hasMoreShoots = dayShots.length > 2;
          const remainingShoots = dayShots.slice(2);

          return (
            <div
              key={idx}
              onClick={() => onDateClick?.(day)}
              className={cn(
                'min-h-[80px] p-1 border rounded-md cursor-pointer transition-colors',
                isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                isToday && 'ring-2 ring-primary',
                'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                !isCurrentMonth && 'text-muted-foreground',
                isToday && 'text-primary'
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayShots.slice(0, 2).map(shoot => (
                  <div
                    key={shoot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShootClick?.(shoot);
                    }}
                    className={cn(
                      'text-xs truncate px-1 py-0.5 rounded cursor-pointer font-medium',
                      getStatusStyles(shoot.status)
                    )}
                  >
                    {shoot.event_name}
                  </div>
                ))}
                
                {hasMoreShoots && (
                  <Popover>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Badge 
                        variant="outline" 
                        className="text-xs h-5 cursor-pointer hover:bg-muted"
                      >
                        +{remainingShoots.length} more
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-72 p-0" 
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b">
                        <h4 className="font-semibold text-sm">
                          {format(day, 'EEEE, MMMM d, yyyy')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {dayShots.length} shoot{dayShots.length > 1 ? 's' : ''} scheduled
                        </p>
                      </div>
                      <ScrollArea className="max-h-[300px]">
                        <div className="p-2 space-y-2">
                          {dayShots.map(shoot => (
                            <div
                              key={shoot.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onShootClick?.(shoot);
                              }}
                              className="p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">
                                    {shoot.event_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {shoot.brand_name}
                                  </p>
                                </div>
                                <Badge 
                                  className={cn(
                                    'text-[10px] px-1.5 py-0 shrink-0',
                                    getStatusStyles(shoot.status)
                                  )}
                                >
                                  {getStatusLabel(shoot.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span>{formatTimeOnlyIST(shoot.shoot_time)}</span>
                                <span className="truncate">{shoot.location}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Given By Editor</span>
        </div>
      </div>
    </div>
  );
}
