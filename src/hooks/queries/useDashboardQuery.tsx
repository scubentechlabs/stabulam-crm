import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { startOfMonth, endOfMonth, format, addDays, isWeekend } from 'date-fns';

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

interface DashboardData {
  stats: DashboardStats;
  todayStatus: TodayStatus;
}

export function useDashboardQuery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.dashboard.stats(user?.id || '');

  const dashboardQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<DashboardData> => {
      if (!user) {
        return {
          stats: { attendanceStreak: 0, tasksCompleted: 0, pendingLeaves: 0, todayShoots: 0 },
          todayStatus: {
            clockedIn: false,
            clockInTime: null,
            clockOutTime: null,
            todSubmitted: false,
            eodSubmitted: false,
            isLate: false,
            lateMinutes: 0,
          },
        };
      }

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

      const [
        attendanceResult,
        todayAttendanceResult,
        tasksResult,
        leavesResult,
        shootsResult,
      ] = await Promise.all([
        supabase
          .from('attendance')
          .select('date, clock_in_time')
          .eq('user_id', user.id)
          .gte('date', format(addDays(today, -60), 'yyyy-MM-dd'))
          .lte('date', todayStr)
          .order('date', { ascending: false }),
        supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle(),
        supabase
          .from('tasks')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        supabase
          .from('leaves')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('shoots')
          .select('id')
          .eq('shoot_date', todayStr),
      ]);

      // Calculate streak
      let streak = 0;
      const attendanceData = attendanceResult.data || [];
      const attendanceDates = new Set(
        attendanceData.filter(a => a.clock_in_time).map(a => a.date)
      );

      let checkDate = today;
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        
        if (isWeekend(checkDate)) {
          checkDate = addDays(checkDate, -1);
          continue;
        }

        if (dateStr === todayStr) {
          if (todayAttendanceResult.data?.clock_in_time) streak++;
          checkDate = addDays(checkDate, -1);
          continue;
        }

        if (attendanceDates.has(dateStr)) {
          streak++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }

        if (streak > 60) break;
      }

      const todayAttendance = todayAttendanceResult.data;

      return {
        stats: {
          attendanceStreak: streak,
          tasksCompleted: tasksResult.data?.length || 0,
          pendingLeaves: leavesResult.data?.length || 0,
          todayShoots: shootsResult.data?.length || 0,
        },
        todayStatus: {
          clockedIn: !!todayAttendance?.clock_in_time,
          clockInTime: todayAttendance?.clock_in_time || null,
          clockOutTime: todayAttendance?.clock_out_time || null,
          todSubmitted: todayAttendance?.tod_submitted || false,
          eodSubmitted: todayAttendance?.eod_submitted || false,
          isLate: todayAttendance?.is_late || false,
          lateMinutes: todayAttendance?.late_minutes || 0,
        },
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime-query')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  const data = dashboardQuery.data || {
    stats: { attendanceStreak: 0, tasksCompleted: 0, pendingLeaves: 0, todayShoots: 0 },
    todayStatus: {
      clockedIn: false,
      clockInTime: null,
      clockOutTime: null,
      todSubmitted: false,
      eodSubmitted: false,
      isLate: false,
      lateMinutes: 0,
    },
  };

  return {
    stats: data.stats,
    todayStatus: data.todayStatus,
    isLoading: dashboardQuery.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
