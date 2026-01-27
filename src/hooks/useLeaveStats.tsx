import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, eachDayOfInterval, differenceInDays, parseISO } from 'date-fns';
import { useRealtimeDashboard } from './useRealtimeDashboard';

interface LeaveRecord {
  id: string;
  user_id: string;
  leave_type: 'half_day' | 'full_day' | 'multiple_days';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | null;
  has_advance_notice: boolean | null;
  penalty_amount: number | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

export interface EmployeeLeaveStats {
  userId: string;
  name: string;
  email: string;
  totalLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  halfDayLeaves: number;
  fullDayLeaves: number;
  multipleDayLeaves: number;
  totalDaysOff: number;
  withAdvanceNotice: number;
  withoutAdvanceNotice: number;
  totalPenalties: number;
}

export interface DailyLeaveTrend {
  date: string;
  dayLabel: string;
  approved: number;
  pending: number;
  rejected: number;
}

export interface LeaveTypeDistribution {
  type: string;
  count: number;
  fill: string;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  approved: number;
}

export interface LeaveStatsSummary {
  totalLeaveRequests: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  avgLeavesPerEmployee: number;
  advanceNoticeRate: number;
  totalPenalties: number;
}

export function useLeaveStats(selectedMonth: Date) {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch leaves that overlap with the selected month
      const [leavesRes, profilesRes] = await Promise.all([
        supabase
          .from('leaves')
          .select('*')
          .or(`start_date.lte.${format(monthEnd, 'yyyy-MM-dd')},end_date.gte.${format(monthStart, 'yyyy-MM-dd')}`)
          .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('start_date', format(monthEnd, 'yyyy-MM-dd')),
        supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .eq('is_active', true),
      ]);

      if (leavesRes.error) throw leavesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setLeaves(leavesRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching leave stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monthStart, monthEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime updates
  useRealtimeDashboard({
    tables: ['leaves', 'leave_balances'],
    onDataChange: fetchData,
    enabled: true,
  });

  const employeeStats = useMemo((): EmployeeLeaveStats[] => {
    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    const statsMap = new Map<string, EmployeeLeaveStats>();

    // Initialize stats for all employees
    profiles.forEach(profile => {
      statsMap.set(profile.user_id, {
        userId: profile.user_id,
        name: profile.full_name,
        email: profile.email,
        totalLeaves: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0,
        pendingLeaves: 0,
        halfDayLeaves: 0,
        fullDayLeaves: 0,
        multipleDayLeaves: 0,
        totalDaysOff: 0,
        withAdvanceNotice: 0,
        withoutAdvanceNotice: 0,
        totalPenalties: 0,
      });
    });

    leaves.forEach(leave => {
      const stats = statsMap.get(leave.user_id);
      if (!stats) return;

      stats.totalLeaves++;
      
      // Status counts
      if (leave.status === 'approved') stats.approvedLeaves++;
      else if (leave.status === 'rejected') stats.rejectedLeaves++;
      else if (leave.status === 'pending') stats.pendingLeaves++;

      // Leave type counts
      if (leave.leave_type === 'half_day') {
        stats.halfDayLeaves++;
        if (leave.status === 'approved') stats.totalDaysOff += 0.5;
      } else if (leave.leave_type === 'full_day') {
        stats.fullDayLeaves++;
        if (leave.status === 'approved') stats.totalDaysOff += 1;
      } else if (leave.leave_type === 'multiple_days') {
        stats.multipleDayLeaves++;
        if (leave.status === 'approved') {
          const days = differenceInDays(parseISO(leave.end_date), parseISO(leave.start_date)) + 1;
          stats.totalDaysOff += days;
        }
      }

      // Advance notice
      if (leave.has_advance_notice) stats.withAdvanceNotice++;
      else stats.withoutAdvanceNotice++;

      // Penalties
      stats.totalPenalties += leave.penalty_amount || 0;
    });

    return Array.from(statsMap.values()).filter(s => s.totalLeaves > 0);
  }, [leaves, profiles]);

  const dailyTrends = useMemo((): DailyLeaveTrend[] => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLeaves = leaves.filter(leave => {
        const start = leave.start_date;
        const end = leave.end_date;
        return dayStr >= start && dayStr <= end;
      });

      return {
        date: dayStr,
        dayLabel: format(day, 'd'),
        approved: dayLeaves.filter(l => l.status === 'approved').length,
        pending: dayLeaves.filter(l => l.status === 'pending').length,
        rejected: dayLeaves.filter(l => l.status === 'rejected').length,
      };
    });
  }, [leaves, monthStart, monthEnd]);

  const leaveTypeDistribution = useMemo((): LeaveTypeDistribution[] => {
    const halfDay = leaves.filter(l => l.leave_type === 'half_day').length;
    const fullDay = leaves.filter(l => l.leave_type === 'full_day').length;
    const multipleDays = leaves.filter(l => l.leave_type === 'multiple_days').length;

    return [
      { type: 'Half Day', count: halfDay, fill: 'hsl(var(--chart-1))' },
      { type: 'Full Day', count: fullDay, fill: 'hsl(var(--chart-2))' },
      { type: 'Multiple Days', count: multipleDays, fill: 'hsl(var(--chart-3))' },
    ].filter(d => d.count > 0);
  }, [leaves]);

  const statusDistribution = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'approved').length;
    const pending = leaves.filter(l => l.status === 'pending').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;

    return [
      { status: 'Approved', count: approved, fill: 'hsl(var(--chart-2))' },
      { status: 'Pending', count: pending, fill: 'hsl(var(--chart-4))' },
      { status: 'Rejected', count: rejected, fill: 'hsl(var(--chart-5))' },
    ].filter(d => d.count > 0);
  }, [leaves]);

  const summary = useMemo((): LeaveStatsSummary => {
    const totalLeaveRequests = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const uniqueEmployees = new Set(leaves.map(l => l.user_id)).size;
    const avgLeavesPerEmployee = uniqueEmployees > 0 ? Math.round((totalLeaveRequests / uniqueEmployees) * 10) / 10 : 0;
    const withNotice = leaves.filter(l => l.has_advance_notice).length;
    const advanceNoticeRate = totalLeaveRequests > 0 ? Math.round((withNotice / totalLeaveRequests) * 100) : 0;
    const totalPenalties = leaves.reduce((sum, l) => sum + (l.penalty_amount || 0), 0);

    return {
      totalLeaveRequests,
      approvedLeaves,
      rejectedLeaves,
      pendingLeaves,
      avgLeavesPerEmployee,
      advanceNoticeRate,
      totalPenalties,
    };
  }, [leaves]);

  return {
    employeeStats,
    dailyTrends,
    leaveTypeDistribution,
    statusDistribution,
    summary,
    isLoading,
    refreshStats: fetchData,
  };
}
