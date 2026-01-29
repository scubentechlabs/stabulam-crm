import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeDashboard } from './useRealtimeDashboard';
import { startOfMonth, endOfMonth, format, eachDayOfInterval, isWeekend, parseISO, addDays } from 'date-fns';

interface DashboardStats {
  attendanceStreak: number;
  tasksCompleted: number;
  pendingLeaves: number;
  todayShoots: number;
}

interface TodayStatus {
  clockedIn: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  todSubmitted: boolean;
  eodSubmitted: boolean;
  isLate: boolean;
  lateMinutes: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    attendanceStreak: 0,
    tasksCompleted: 0,
    pendingLeaves: 0,
    todayShoots: 0,
  });
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    todSubmitted: false,
    eodSubmitted: false,
    isLate: false,
    lateMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

      // Fetch all data in parallel for efficiency
      const [
        attendanceResult,
        todayAttendanceResult,
        tasksResult,
        leavesResult,
        shootsResult,
      ] = await Promise.all([
        // Attendance for streak calculation (last 60 days)
        supabase
          .from('attendance')
          .select('date, clock_in_time')
          .eq('user_id', user.id)
          .gte('date', format(addDays(today, -60), 'yyyy-MM-dd'))
          .lte('date', todayStr)
          .order('date', { ascending: false }),

        // Today's attendance
        supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle(),

        // Tasks completed this month
        supabase
          .from('tasks')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),

        // Pending leaves
        supabase
          .from('leaves')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending'),

        // Today's shoots - user assigned
        supabase
          .from('shoot_assignments')
          .select('shoot_id, shoots!inner(shoot_date)')
          .eq('user_id', user.id)
          .eq('shoots.shoot_date', todayStr),
      ]);

      // Calculate attendance streak
      let streak = 0;
      const attendanceData = attendanceResult.data || [];
      const attendanceDates = new Set(
        attendanceData
          .filter(a => a.clock_in_time)
          .map(a => a.date)
      );

      // Count consecutive working days with attendance
      let checkDate = today;
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        
        // Skip weekends
        if (isWeekend(checkDate)) {
          checkDate = addDays(checkDate, -1);
          continue;
        }

        // Check if today and not yet clocked in
        if (dateStr === todayStr) {
          const todayAttendance = todayAttendanceResult.data;
          if (todayAttendance?.clock_in_time) {
            streak++;
          }
          checkDate = addDays(checkDate, -1);
          continue;
        }

        // Check if attendance exists for this date
        if (attendanceDates.has(dateStr)) {
          streak++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }

        // Limit check to prevent infinite loop
        if (streak > 60) break;
      }

      // Set stats
      setStats({
        attendanceStreak: streak,
        tasksCompleted: tasksResult.data?.length || 0,
        pendingLeaves: leavesResult.data?.length || 0,
        todayShoots: shootsResult.data?.length || 0,
      });

      // Set today's status
      const todayAttendance = todayAttendanceResult.data;
      setTodayStatus({
        clockedIn: !!todayAttendance?.clock_in_time,
        clockInTime: todayAttendance?.clock_in_time || null,
        clockOutTime: todayAttendance?.clock_out_time || null,
        todSubmitted: todayAttendance?.tod_submitted || false,
        eodSubmitted: todayAttendance?.eod_submitted || false,
        isLate: todayAttendance?.is_late || false,
        lateMinutes: todayAttendance?.late_minutes || 0,
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Subscribe to realtime updates
  useRealtimeDashboard({
    tables: ['attendance', 'tasks', 'leaves'],
    onDataChange: fetchDashboardData,
    enabled: !!user,
  });

  return {
    stats,
    todayStatus,
    isLoading,
    refetch: fetchDashboardData,
  };
}
