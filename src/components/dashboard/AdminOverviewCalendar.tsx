import { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, Camera, Clock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, isSundayHoliday, isDayHeaderHoliday } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { DayDetailDialog } from './DayDetailDialog';

interface DayData {
  attendance: {
    present: number;
    late: number;
    total: number;
  };
  leaves: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    leave_type: string;
    half_day_period?: string;
    reason?: string;
  }[];
  shoots: {
    id: string;
    event_name: string;
    brand_name: string;
    shoot_time: string;
    location: string;
    status: string;
    assignee_count: number;
  }[];
}

interface DetailedAttendance {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
  is_late: boolean;
  late_minutes: number;
}

interface DetailedShoot {
  id: string;
  event_name: string;
  brand_name: string;
  shoot_time: string;
  location: string;
  status: string;
  assignees: { user_id: string; full_name: string; avatar_url: string | null }[];
}

export function AdminOverviewCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  // Dialog state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailedAttendance, setDetailedAttendance] = useState<DetailedAttendance[]>([]);
  const [detailedShoots, setDetailedShoots] = useState<DetailedShoot[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [employeesRes, attendanceRes, leavesRes, shootsRes, assignmentsRes, profilesRes] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact' }).eq('is_active', true),
        supabase.from('attendance').select('date, user_id, is_late').gte('date', startStr).lte('date', endStr),
        supabase
          .from('leaves')
          .select('user_id, start_date, end_date, leave_type, half_day_period, status, reason')
          .eq('status', 'approved')
          .or(`start_date.lte.${endStr},end_date.gte.${startStr}`),
        supabase.from('shoots').select('id, event_name, brand_name, shoot_date, shoot_time, location, status').gte('shoot_date', startStr).lte('shoot_date', endStr),
        supabase.from('shoot_assignments').select('shoot_id, user_id'),
        supabase.from('profiles').select('user_id, full_name, avatar_url').eq('is_active', true),
      ]);

      setTotalEmployees(employeesRes.count || 0);

      const profileMap = (profilesRes.data || []).reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { full_name: string; avatar_url: string | null }>);

      const assignmentMap = (assignmentsRes.data || []).reduce((acc, a) => {
        acc[a.shoot_id] = (acc[a.shoot_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Build calendar data
      const data: Record<string, DayData> = {};

      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        data[dateStr] = {
          attendance: { present: 0, late: 0, total: 0 },
          leaves: [],
          shoots: [],
        };
      });

      // Process attendance
      (attendanceRes.data || []).forEach(att => {
        if (data[att.date]) {
          data[att.date].attendance.total++;
          data[att.date].attendance.present++;
          if (att.is_late) {
            data[att.date].attendance.late++;
          }
        }
      });

      // Process leaves
      (leavesRes.data || []).forEach(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          if (day >= start && day <= end && data[dateStr]) {
            const profile = profileMap[leave.user_id];
            if (profile && !data[dateStr].leaves.find(l => l.user_id === leave.user_id)) {
              data[dateStr].leaves.push({
                user_id: leave.user_id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                leave_type: leave.leave_type,
                half_day_period: leave.half_day_period || undefined,
                reason: leave.reason || undefined,
              });
            }
          }
        });
      });

      // Process shoots
      (shootsRes.data || []).forEach(shoot => {
        if (data[shoot.shoot_date]) {
          data[shoot.shoot_date].shoots.push({
            id: shoot.id,
            event_name: shoot.event_name,
            brand_name: shoot.brand_name,
            shoot_time: shoot.shoot_time,
            location: shoot.location,
            status: shoot.status || 'pending',
            assignee_count: assignmentMap[shoot.id] || 0,
          });
        }
      });

      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monthStart, monthEnd, days]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  // Fetch detailed data for a specific day when clicked
  const handleDayClick = async (day: Date) => {
    if (isSundayHoliday(day)) return;
    
    setSelectedDate(day);
    setDialogOpen(true);
    setIsLoadingDetails(true);

    try {
      const dateStr = format(day, 'yyyy-MM-dd');

      // Fetch detailed attendance with user info
      const [attendanceRes, profilesRes, shootsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('user_id, clock_in_time, clock_out_time, is_late, late_minutes')
          .eq('date', dateStr),
        supabase.from('profiles').select('user_id, full_name, avatar_url').eq('is_active', true),
        supabase
          .from('shoots')
          .select('id, event_name, brand_name, shoot_time, location, status')
          .eq('shoot_date', dateStr),
        supabase.from('shoot_assignments').select('shoot_id, user_id'),
      ]);

      const profileMap = (profilesRes.data || []).reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { full_name: string; avatar_url: string | null }>);

      // Build detailed attendance
      const attendance: DetailedAttendance[] = (attendanceRes.data || []).map(att => ({
        user_id: att.user_id,
        full_name: profileMap[att.user_id]?.full_name || 'Unknown',
        avatar_url: profileMap[att.user_id]?.avatar_url || null,
        clock_in_time: att.clock_in_time,
        clock_out_time: att.clock_out_time,
        is_late: att.is_late || false,
        late_minutes: att.late_minutes || 0,
      }));

      // Build assignment map for shoots
      const assignmentsByShoot = (assignmentsRes.data || []).reduce((acc, a) => {
        if (!acc[a.shoot_id]) acc[a.shoot_id] = [];
        const profile = profileMap[a.user_id];
        if (profile) {
          acc[a.shoot_id].push({
            user_id: a.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          });
        }
        return acc;
      }, {} as Record<string, { user_id: string; full_name: string; avatar_url: string | null }[]>);

      // Build detailed shoots
      const shoots: DetailedShoot[] = (shootsRes.data || []).map(shoot => ({
        id: shoot.id,
        event_name: shoot.event_name,
        brand_name: shoot.brand_name,
        shoot_time: shoot.shoot_time,
        location: shoot.location,
        status: shoot.status || 'pending',
        assignees: assignmentsByShoot[shoot.id] || [],
      }));

      setDetailedAttendance(attendance);
      setDetailedShoots(shoots);
    } catch (error) {
      console.error('Error fetching day details:', error);
    } finally {
      setIsLoadingDetails(false);
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
              <Skeleton key={i} className="h-20 w-full" />
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
              Overview Calendar
            </CardTitle>
            <CardDescription>
              Attendance, leaves, and shoots at a glance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">On Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-muted-foreground">Shoots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Late</span>
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
                'text-center text-sm font-medium py-2',
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
            <div key={`empty-${index}`} className="min-h-[90px] bg-muted/20 rounded-lg" />
          ))}

          {/* Days of the month */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = calendarData[dateStr] || { attendance: { present: 0, late: 0, total: 0 }, leaves: [], shoots: [] };
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isHoliday = isSundayHoliday(day);

            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'min-h-[90px] p-2 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 hover:border-primary/50',
                        !isCurrentMonth && 'opacity-50',
                        isTodayDate && 'ring-2 ring-primary bg-primary/5',
                        isHoliday && 'bg-muted/30 cursor-default hover:border-transparent'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1',
                        isTodayDate && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </div>

                      {!isHoliday && (
                        <div className="space-y-1">
                          {/* Attendance indicator */}
                          {dayData.attendance.present > 0 && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <Users className="h-3 w-3 text-success" />
                              <span className="text-success">{dayData.attendance.present}</span>
                              {dayData.attendance.late > 0 && (
                                <span className="text-warning">({dayData.attendance.late} late)</span>
                              )}
                            </div>
                          )}

                          {/* Leaves indicator */}
                          {dayData.leaves.length > 0 && (
                            <div className="flex items-center gap-1">
                              <UserX className="h-3 w-3 text-destructive" />
                              <div className="flex -space-x-1">
                                {dayData.leaves.slice(0, 2).map(leave => (
                                  <Avatar key={leave.user_id} className="h-4 w-4 border border-background">
                                    <AvatarImage src={leave.avatar_url || undefined} />
                                    <AvatarFallback className="text-[6px] bg-destructive/20 text-destructive">
                                      {leave.full_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {dayData.leaves.length > 2 && (
                                  <span className="text-[10px] text-destructive ml-1">+{dayData.leaves.length - 2}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Shoots indicator */}
                          {dayData.shoots.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <Camera className="h-3 w-3 text-info" />
                              <span className="text-info">{dayData.shoots.length}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isHoliday && (
                        <div className="text-[10px] text-muted-foreground mt-1">Sunday</div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[280px] p-3">
                    <div className="space-y-3">
                      <p className="font-semibold border-b pb-2">{format(day, 'EEEE, MMMM d, yyyy')}</p>
                      
                      {!isHoliday ? (
                        <>
                          {/* Attendance details */}
                          <div>
                            <p className="text-xs font-medium text-success flex items-center gap-1 mb-1">
                              <Clock className="h-3 w-3" />
                              Attendance
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {dayData.attendance.present > 0 ? (
                                <>
                                  <span>{dayData.attendance.present} present</span>
                                  {dayData.attendance.late > 0 && (
                                    <span className="text-warning"> • {dayData.attendance.late} late</span>
                                  )}
                                </>
                              ) : (
                                <span>No attendance recorded</span>
                              )}
                            </div>
                          </div>

                          {/* Leaves details */}
                          {dayData.leaves.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                                <UserX className="h-3 w-3" />
                                On Leave ({dayData.leaves.length})
                              </p>
                              <div className="space-y-1">
                                {dayData.leaves.map(leave => (
                                  <div key={leave.user_id} className="flex items-center gap-2 text-xs">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={leave.avatar_url || undefined} />
                                      <AvatarFallback className="text-[6px]">
                                        {leave.full_name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{leave.full_name}</span>
                                    {leave.leave_type === 'half_day' && (
                                      <Badge variant="outline" className="text-[8px] h-3 px-1">
                                        {leave.half_day_period === 'first_half' ? 'AM' : 'PM'}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Shoots details */}
                          {dayData.shoots.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                                <Camera className="h-3 w-3" />
                                Shoots ({dayData.shoots.length})
                              </p>
                              <div className="space-y-1">
                                {dayData.shoots.map(shoot => (
                                  <div key={shoot.id} className="text-xs bg-info/10 rounded p-1.5">
                                    <div className="font-medium">{shoot.event_name}</div>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                      <span>{shoot.brand_name}</span>
                                      <span>•</span>
                                      <span>{shoot.shoot_time.slice(0, 5)}</span>
                                      {shoot.assignee_count > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{shoot.assignee_count} assigned</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {dayData.attendance.present === 0 && dayData.leaves.length === 0 && dayData.shoots.length === 0 && (
                            <p className="text-xs text-muted-foreground">No data for this day</p>
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

      {/* Day Detail Dialog */}
      {selectedDate && (
        <DayDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          attendance={detailedAttendance}
          leaves={calendarData[format(selectedDate, 'yyyy-MM-dd')]?.leaves || []}
          shoots={detailedShoots}
          isLoading={isLoadingDetails}
        />
      )}
    </Card>
  );
}
