import { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Camera, Clock, UserX, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, isSundayHoliday, isDayHeaderHoliday } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DayData {
  attendance: {
    clockedIn: boolean;
    clockInTime: string | null;
    clockOutTime: string | null;
    isLate: boolean;
    lateMinutes: number;
  } | null;
  leave: {
    leave_type: string;
    half_day_period?: string;
    status: string;
  } | null;
  shoots: {
    id: string;
    event_name: string;
    brand_name: string;
    shoot_time: string;
    location: string;
    status: string;
  }[];
}

export function EmployeeOverviewCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchCalendarData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      // Fetch user's attendance, leaves, and assigned shoots in parallel
      const [attendanceRes, leavesRes, assignmentsRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('date, clock_in_time, clock_out_time, is_late, late_minutes')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr),
        supabase
          .from('leaves')
          .select('start_date, end_date, leave_type, half_day_period, status')
          .eq('user_id', user.id)
          .or(`start_date.lte.${endStr},end_date.gte.${startStr}`),
        supabase
          .from('shoot_assignments')
          .select('shoot_id, shoots(id, event_name, brand_name, shoot_date, shoot_time, location, status)')
          .eq('user_id', user.id),
      ]);

      // Build calendar data
      const data: Record<string, DayData> = {};

      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        data[dateStr] = {
          attendance: null,
          leave: null,
          shoots: [],
        };
      });

      // Process attendance
      (attendanceRes.data || []).forEach(att => {
        if (data[att.date]) {
          data[att.date].attendance = {
            clockedIn: !!att.clock_in_time,
            clockInTime: att.clock_in_time,
            clockOutTime: att.clock_out_time,
            isLate: att.is_late || false,
            lateMinutes: att.late_minutes || 0,
          };
        }
      });

      // Process leaves
      (leavesRes.data || []).forEach(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          if (day >= start && day <= end && data[dateStr] && !data[dateStr].leave) {
            data[dateStr].leave = {
              leave_type: leave.leave_type,
              half_day_period: leave.half_day_period || undefined,
              status: leave.status || 'pending',
            };
          }
        });
      });

      // Process shoots
      (assignmentsRes.data || []).forEach(assignment => {
        const shoot = assignment.shoots as any;
        if (shoot && data[shoot.shoot_date]) {
          data[shoot.shoot_date].shoots.push({
            id: shoot.id,
            event_name: shoot.event_name,
            brand_name: shoot.brand_name,
            shoot_time: shoot.shoot_time,
            location: shoot.location,
            status: shoot.status || 'pending',
          });
        }
      });

      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, monthStart, monthEnd, days]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, user]);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const date = new Date(timeStr);
      return format(date, 'hh:mm a');
    } catch {
      return timeStr;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              My Overview
            </CardTitle>
            <CardDescription>
              Your attendance, leaves, and shoots at a glance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium text-sm">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-info" />
            <span className="text-muted-foreground">Shoot</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-xs font-medium py-1',
                isDayHeaderHoliday(day) ? 'text-muted-foreground' : ''
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[70px] bg-muted/20 rounded-md" />
          ))}

          {/* Days of the month */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = calendarData[dateStr] || { attendance: null, leave: null, shoots: [] };
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isHoliday = isSundayHoliday(day);

            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'min-h-[70px] p-1.5 rounded-md border transition-colors',
                        !isCurrentMonth && 'opacity-50',
                        isTodayDate && 'ring-2 ring-primary bg-primary/5',
                        isHoliday && 'bg-muted/30'
                      )}
                    >
                      <div className={cn(
                        'text-xs font-medium mb-1',
                        isTodayDate && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </div>

                      {!isHoliday && (
                        <div className="space-y-0.5">
                          {/* Attendance indicator */}
                          {dayData.attendance && (
                            <div className="flex items-center gap-0.5">
                              <CheckCircle2 className={cn(
                                'h-3 w-3',
                                dayData.attendance.isLate ? 'text-warning' : 'text-success'
                              )} />
                              {dayData.attendance.isLate && (
                                <span className="text-[9px] text-warning">Late</span>
                              )}
                            </div>
                          )}

                          {/* Leave indicator */}
                          {dayData.leave && (
                            <div className="flex items-center gap-0.5">
                              <UserX className="h-3 w-3 text-destructive" />
                              <Badge 
                                variant={dayData.leave.status === 'approved' ? 'default' : 'secondary'}
                                className="text-[8px] px-1 py-0 h-3"
                              >
                                {dayData.leave.leave_type === 'half_day' ? '½' : 'Leave'}
                              </Badge>
                            </div>
                          )}

                          {/* Shoots indicator */}
                          {dayData.shoots.length > 0 && (
                            <div className="flex items-center gap-0.5 text-[9px]">
                              <Camera className="h-3 w-3 text-info" />
                              <span className="text-info">{dayData.shoots.length}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isHoliday && (
                        <div className="text-[8px] text-muted-foreground">Holiday</div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] p-2">
                    <div className="space-y-2">
                      <p className="font-semibold text-xs border-b pb-1">{format(day, 'EEEE, MMM d')}</p>
                      
                      {!isHoliday ? (
                        <>
                          {/* Attendance details */}
                          {dayData.attendance ? (
                            <div className="text-xs">
                              <p className={cn(
                                'flex items-center gap-1 font-medium',
                                dayData.attendance.isLate ? 'text-warning' : 'text-success'
                              )}>
                                <Clock className="h-3 w-3" />
                                {dayData.attendance.isLate ? 'Late' : 'Present'}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                In: {formatTime(dayData.attendance.clockInTime) || '-'}
                                {dayData.attendance.clockOutTime && ` • Out: ${formatTime(dayData.attendance.clockOutTime)}`}
                              </p>
                              {dayData.attendance.isLate && dayData.attendance.lateMinutes > 0 && (
                                <p className="text-warning text-[10px]">
                                  {dayData.attendance.lateMinutes} min late
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No attendance</p>
                          )}

                          {/* Leave details */}
                          {dayData.leave && (
                            <div className="text-xs">
                              <p className="flex items-center gap-1 text-destructive font-medium">
                                <UserX className="h-3 w-3" />
                                {dayData.leave.leave_type === 'half_day' 
                                  ? `Half Day (${dayData.leave.half_day_period})` 
                                  : 'Full Day Leave'}
                              </p>
                              <Badge variant={dayData.leave.status === 'approved' ? 'default' : 'secondary'} className="text-[9px] mt-0.5">
                                {dayData.leave.status}
                              </Badge>
                            </div>
                          )}

                          {/* Shoots details */}
                          {dayData.shoots.length > 0 && (
                            <div className="text-xs">
                              <p className="flex items-center gap-1 text-info font-medium mb-1">
                                <Camera className="h-3 w-3" />
                                {dayData.shoots.length} Shoot{dayData.shoots.length > 1 ? 's' : ''}
                              </p>
                              {dayData.shoots.slice(0, 2).map(shoot => (
                                <div key={shoot.id} className="text-[10px] text-muted-foreground">
                                  • {shoot.brand_name} @ {shoot.shoot_time.slice(0, 5)}
                                </div>
                              ))}
                              {dayData.shoots.length > 2 && (
                                <p className="text-[10px] text-info">+{dayData.shoots.length - 2} more</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sunday - Holiday</p>
                      )}
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
