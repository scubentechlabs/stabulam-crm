import { useState } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkCalendarTask } from '@/hooks/useWorkCalendarTasks';

interface WorkCalendarViewProps {
  tasks: WorkCalendarTask[];
  tasksByDate: Record<string, WorkCalendarTask[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const taskTypeColors: Record<string, string> = {
  tod: 'bg-blue-500',
  eod: 'bg-green-500',
  utod: 'bg-purple-500',
  urgent_tod: 'bg-red-500',
};

const taskTypeLabels: Record<string, string> = {
  tod: 'TOD',
  eod: 'EOD',
  utod: 'UTOD',
  urgent_tod: 'Urgent',
};

export function WorkCalendarView({
  tasksByDate,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: WorkCalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onMonthChange(today);
    onSelectDate(today);
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  const getTaskTypeCounts = (date: Date) => {
    const dateTasks = getTasksForDate(date);
    const counts: Record<string, number> = {};
    
    dateTasks.forEach(task => {
      counts[task.task_type] = (counts[task.task_type] || 0) + 1;
    });
    
    return counts;
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        {Object.entries(taskTypeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full', taskTypeColors[type])} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const taskCounts = getTaskTypeCounts(day);
          const hasAnyTasks = Object.keys(taskCounts).length > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative min-h-[80px] p-1 rounded-md border transition-colors text-left',
                'hover:bg-accent/50',
                !isCurrentMonth && 'opacity-40',
                isToday && 'border-primary',
                isSelected && 'bg-accent ring-2 ring-primary'
              )}
            >
              <span className={cn(
                'text-sm font-medium',
                isToday && 'text-primary'
              )}>
                {format(day, 'd')}
              </span>

              {/* Task Indicators */}
              {hasAnyTasks && (
                <div className="mt-1 space-y-0.5">
                  {Object.entries(taskCounts).map(([type, count]) => (
                    <div
                      key={type}
                      className={cn(
                        'text-[10px] px-1 py-0.5 rounded text-white truncate',
                        taskTypeColors[type]
                      )}
                    >
                      {taskTypeLabels[type]}: {count}
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
