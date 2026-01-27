import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { useRealtimeDashboard } from './useRealtimeDashboard';

interface AdminDashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingApprovals: number;
  upcomingShoots: number;
  lateArrivals: number;
  onLeave: number;
}

interface PendingApproval {
  id: string;
  type: 'leave' | 'extra_work' | 'regularization';
  userName: string;
  requestDate: string;
  details: string;
}

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    pendingApprovals: 0,
    upcomingShoots: 0,
    lateArrivals: 0,
    onLeave: 0,
  });
  const [pendingApprovalsList, setPendingApprovalsList] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const nextWeek = format(addDays(today, 7), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        employeesResult,
        attendanceResult,
        pendingLeavesResult,
        pendingExtraWorkResult,
        pendingRegularizationsResult,
        upcomingShootsResult,
        approvedLeavesTodayResult,
      ] = await Promise.all([
        // Total active employees
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('is_active', true),

        // Today's attendance
        supabase
          .from('attendance')
          .select('id, is_late, user_id')
          .eq('date', todayStr),

        // Pending leaves with user info
        supabase
          .from('leaves')
          .select('id, user_id, start_date, end_date, leave_type, reason')
          .eq('status', 'pending'),

        // Pending extra work
        supabase
          .from('extra_work')
          .select('id, user_id, work_date, task_description, hours')
          .eq('status', 'pending'),

        // Pending regularizations
        supabase
          .from('attendance_regularizations')
          .select('id, user_id, request_date, reason')
          .eq('status', 'pending'),

        // Upcoming shoots (next 7 days)
        supabase
          .from('shoots')
          .select('id')
          .gte('shoot_date', todayStr)
          .lte('shoot_date', nextWeek),

        // Approved leaves that cover today
        supabase
          .from('leaves')
          .select('id')
          .eq('status', 'approved')
          .lte('start_date', todayStr)
          .gte('end_date', todayStr),
      ]);

      // Calculate stats
      const totalEmployees = employeesResult.count || 0;
      const attendanceData = attendanceResult.data || [];
      const presentToday = attendanceData.length;
      const lateArrivals = attendanceData.filter(a => a.is_late).length;
      const onLeave = approvedLeavesTodayResult.data?.length || 0;

      // Count pending approvals
      const pendingLeaves = pendingLeavesResult.data || [];
      const pendingExtraWork = pendingExtraWorkResult.data || [];
      const pendingRegularizations = pendingRegularizationsResult.data || [];
      const totalPending = pendingLeaves.length + pendingExtraWork.length + pendingRegularizations.length;

      // Get user profiles for pending approvals
      const userIds = [
        ...pendingLeaves.map(l => l.user_id),
        ...pendingExtraWork.map(e => e.user_id),
        ...pendingRegularizations.map(r => r.user_id),
      ];

      let userProfiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        if (profiles) {
          userProfiles = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Build pending approvals list
      const approvalsList: PendingApproval[] = [
        ...pendingLeaves.map(l => ({
          id: l.id,
          type: 'leave' as const,
          userName: userProfiles[l.user_id] || 'Unknown',
          requestDate: l.start_date,
          details: `${l.leave_type.replace('_', ' ')} - ${l.reason || 'No reason provided'}`,
        })),
        ...pendingExtraWork.map(e => ({
          id: e.id,
          type: 'extra_work' as const,
          userName: userProfiles[e.user_id] || 'Unknown',
          requestDate: e.work_date,
          details: `${e.hours}h - ${e.task_description}`,
        })),
        ...pendingRegularizations.map(r => ({
          id: r.id,
          type: 'regularization' as const,
          userName: userProfiles[r.user_id] || 'Unknown',
          requestDate: r.request_date,
          details: r.reason,
        })),
      ].slice(0, 5); // Limit to 5 items for dashboard

      setStats({
        totalEmployees,
        presentToday,
        pendingApprovals: totalPending,
        upcomingShoots: upcomingShootsResult.data?.length || 0,
        lateArrivals,
        onLeave,
      });

      setPendingApprovalsList(approvalsList);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Subscribe to realtime updates for admin-relevant tables
  useRealtimeDashboard({
    tables: ['attendance', 'leaves', 'tasks'],
    onDataChange: fetchStats,
    enabled: true,
  });

  return {
    stats,
    pendingApprovalsList,
    isLoading,
    refetch: fetchStats,
  };
}
