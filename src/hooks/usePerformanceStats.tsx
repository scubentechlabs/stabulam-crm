import { useState, useCallback } from 'react';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthlyStats {
  month: string;
  monthLabel: string;
  daysPresent: number;
  daysLate: number;
  onTimeRate: number;
  tasksCompleted: number;
  tasksPending: number;
  completionRate: number;
  leavesTaken: number;
  leavesApproved: number;
  leavesRejected: number;
}

export interface OverallStats {
  totalDaysPresent: number;
  totalDaysLate: number;
  avgOnTimeRate: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
  avgCompletionRate: number;
  totalLeavesTaken: number;
  currentStreak: number;
}

export function usePerformanceStats() {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPerformanceStats = useCallback(async (monthsBack: number = 6) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(new Date(), monthsBack - 1));
      
      const months = eachMonthOfInterval({ start: startDate, end: endDate });

      // Fetch all data in parallel
      const [attendanceRes, tasksRes, leavesRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd')),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('leaves')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_date', format(startDate, 'yyyy-MM-dd'))
          .lte('start_date', format(endDate, 'yyyy-MM-dd')),
      ]);

      const attendance = attendanceRes.data || [];
      const tasks = tasksRes.data || [];
      const leaves = leavesRes.data || [];

      // Calculate monthly stats
      const monthly: MonthlyStats[] = months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthLabel = format(month, 'MMM');
        
        // Attendance for this month
        const monthAttendance = attendance.filter(a => a.date.startsWith(monthStr));
        const daysPresent = monthAttendance.filter(a => a.clock_in_time).length;
        const daysLate = monthAttendance.filter(a => a.is_late).length;
        const onTimeRate = daysPresent > 0 ? Math.round(((daysPresent - daysLate) / daysPresent) * 100) : 100;

        // Tasks for this month
        const monthTasks = tasks.filter(t => t.created_at.startsWith(monthStr));
        const tasksCompleted = monthTasks.filter(t => t.status === 'completed').length;
        const tasksPending = monthTasks.filter(t => t.status === 'pending').length;
        const totalTasks = tasksCompleted + tasksPending;
        const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 100;

        // Leaves for this month
        const monthLeaves = leaves.filter(l => l.start_date.startsWith(monthStr));
        const leavesTaken = monthLeaves.length;
        const leavesApproved = monthLeaves.filter(l => l.status === 'approved').length;
        const leavesRejected = monthLeaves.filter(l => l.status === 'rejected').length;

        return {
          month: monthStr,
          monthLabel,
          daysPresent,
          daysLate,
          onTimeRate,
          tasksCompleted,
          tasksPending,
          completionRate,
          leavesTaken,
          leavesApproved,
          leavesRejected,
        };
      });

      setMonthlyStats(monthly);

      // Calculate overall stats
      const totalDaysPresent = monthly.reduce((sum, m) => sum + m.daysPresent, 0);
      const totalDaysLate = monthly.reduce((sum, m) => sum + m.daysLate, 0);
      const avgOnTimeRate = totalDaysPresent > 0 
        ? Math.round(((totalDaysPresent - totalDaysLate) / totalDaysPresent) * 100) 
        : 100;

      const totalTasksCompleted = monthly.reduce((sum, m) => sum + m.tasksCompleted, 0);
      const totalTasksPending = monthly.reduce((sum, m) => sum + m.tasksPending, 0);
      const totalTasks = totalTasksCompleted + totalTasksPending;
      const avgCompletionRate = totalTasks > 0 
        ? Math.round((totalTasksCompleted / totalTasks) * 100) 
        : 100;

      const totalLeavesTaken = monthly.reduce((sum, m) => sum + m.leavesTaken, 0);

      // Calculate current streak (consecutive days present)
      let currentStreak = 0;
      const sortedAttendance = [...attendance].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      for (const record of sortedAttendance) {
        if (record.clock_in_time) {
          currentStreak++;
        } else {
          break;
        }
      }

      setOverallStats({
        totalDaysPresent,
        totalDaysLate,
        avgOnTimeRate,
        totalTasksCompleted,
        totalTasksPending,
        avgCompletionRate,
        totalLeavesTaken,
        currentStreak,
      });

    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    monthlyStats,
    overallStats,
    isLoading,
    fetchPerformanceStats,
  };
}
