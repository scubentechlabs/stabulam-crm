import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth } from 'date-fns';
import { useRealtimeDashboard } from './useRealtimeDashboard';

export interface DateRange {
  from: Date;
  to: Date;
}

interface EmployeeTaskStats {
  userId: string;
  fullName: string;
  department: string | null;
  totalTodTasks: number;
  completedTodTasks: number;
  pendingTodTasks: number;
  todSubmissionRate: number;
  eodSubmittedDays: number;
  todSubmittedDays: number;
  workingDays: number;
  eodSubmissionRate: number;
}

interface DailyTaskStats {
  date: string;
  todSubmitted: number;
  eodSubmitted: number;
  pendingTasks: number;
  completedTasks: number;
}

interface TaskStats {
  employees: EmployeeTaskStats[];
  dailyStats: DailyTaskStats[];
  summary: {
    totalEmployees: number;
    avgTodSubmissionRate: number;
    avgEodSubmissionRate: number;
    avgTaskCompletionRate: number;
    totalPendingTasks: number;
  };
}

export function useTaskStats() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch all active employees
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, department')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch tasks for the date range
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .gte('created_at', `${startStr}T00:00:00`)
        .lte('created_at', `${endStr}T23:59:59`);

      if (tasksError) throw tasksError;

      // Fetch attendance records for TOD/EOD submission tracking
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr);

      if (attendanceError) throw attendanceError;

      // Calculate working days
      const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const workingDays = allDays.filter(day => !isWeekend(day));

      // Calculate employee stats
      const employeeStats: EmployeeTaskStats[] = (profiles || []).map(profile => {
        const userTasks = (tasks || []).filter(t => t.user_id === profile.user_id);
        const userAttendance = (attendance || []).filter(a => a.user_id === profile.user_id);

        const todTasks = userTasks.filter(t => t.task_type === 'tod' || t.task_type === 'utod' || t.task_type === 'urgent_tod');
        const completedTodTasks = todTasks.filter(t => t.status === 'completed').length;
        const pendingTodTasks = todTasks.filter(t => t.status === 'pending').length;

        const todSubmittedDays = userAttendance.filter(a => a.tod_submitted).length;
        const eodSubmittedDays = userAttendance.filter(a => a.eod_submitted).length;
        const presentDays = userAttendance.filter(a => a.clock_in_time).length;

        const todSubmissionRate = presentDays > 0 ? Math.round((todSubmittedDays / presentDays) * 100) : 0;
        const eodSubmissionRate = presentDays > 0 ? Math.round((eodSubmittedDays / presentDays) * 100) : 0;

        return {
          userId: profile.user_id,
          fullName: profile.full_name,
          department: profile.department,
          totalTodTasks: todTasks.length,
          completedTodTasks,
          pendingTodTasks,
          todSubmissionRate,
          eodSubmittedDays,
          todSubmittedDays,
          workingDays: presentDays,
          eodSubmissionRate,
        };
      });

      // Calculate daily stats
      const dailyStats: DailyTaskStats[] = workingDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAttendance = (attendance || []).filter(a => a.date === dateStr);
        const dayTasks = (tasks || []).filter(t => 
          t.created_at && t.created_at.startsWith(dateStr)
        );

        return {
          date: format(day, 'MMM dd'),
          todSubmitted: dayAttendance.filter(a => a.tod_submitted).length,
          eodSubmitted: dayAttendance.filter(a => a.eod_submitted).length,
          pendingTasks: dayTasks.filter(t => t.status === 'pending').length,
          completedTasks: dayTasks.filter(t => t.status === 'completed').length,
        };
      });

      // Calculate summary
      const totalEmployees = profiles?.length || 0;
      const avgTodSubmissionRate = employeeStats.length > 0
        ? Math.round(employeeStats.reduce((sum, e) => sum + e.todSubmissionRate, 0) / employeeStats.length)
        : 0;
      const avgEodSubmissionRate = employeeStats.length > 0
        ? Math.round(employeeStats.reduce((sum, e) => sum + e.eodSubmissionRate, 0) / employeeStats.length)
        : 0;
      
      const totalCompleted = employeeStats.reduce((sum, e) => sum + e.completedTodTasks, 0);
      const totalTasks = employeeStats.reduce((sum, e) => sum + e.totalTodTasks, 0);
      const avgTaskCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
      const totalPendingTasks = employeeStats.reduce((sum, e) => sum + e.pendingTodTasks, 0);

      setStats({
        employees: employeeStats,
        dailyStats,
        summary: {
          totalEmployees,
          avgTodSubmissionRate,
          avgEodSubmissionRate,
          avgTaskCompletionRate,
          totalPendingTasks,
        },
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Subscribe to realtime updates
  useRealtimeDashboard({
    tables: ['tasks', 'attendance'],
    onDataChange: fetchStats,
    enabled: true,
  });

  return {
    stats,
    isLoading,
    dateRange,
    setDateRange,
    refetch: fetchStats,
  };
}
