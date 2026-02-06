import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';

// Prefetch functions for navigation - called on hover/focus
// These ensure data is ready before the user navigates

export async function prefetchDashboardData(userId: string) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  // Prefetch in parallel
  await Promise.all([
    // Today's attendance
    queryClient.prefetchQuery({
      queryKey: queryKeys.attendance.today(userId),
      queryFn: async () => {
        const { data } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .maybeSingle();
        return data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),
    // Dashboard stats - simplified version
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(userId),
      queryFn: async () => {
        const [tasksRes, leavesRes, shootsRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', monthStart)
            .lte('created_at', monthEnd),
          supabase
            .from('leaves')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'pending'),
          supabase
            .from('shoots')
            .select('id')
            .eq('shoot_date', todayStr),
        ]);
        return {
          tasksCompleted: tasksRes.data?.length || 0,
          pendingLeaves: leavesRes.data?.length || 0,
          todayShoots: shootsRes.data?.length || 0,
        };
      },
      staleTime: 1000 * 60 * 2,
    }),
  ]);
}

export async function prefetchAttendancePage(userId: string) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.attendance.today(userId),
      queryFn: async () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const { data } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .maybeSingle();
        return data;
      },
      staleTime: 1000 * 60,
    }),
  ]);
}

export async function prefetchLeavesPage(userId: string, isAdmin: boolean) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.leaves.list(isAdmin ? undefined : userId),
    queryFn: async () => {
      let query = supabase
        .from('leaves')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export async function prefetchShootsPage() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.shoots.list(),
    queryFn: async () => {
      const { data } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export async function prefetchTasksPage(userId: string) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  await queryClient.prefetchQuery({
    queryKey: queryKeys.tasks.forDate(userId, todayStr),
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60,
  });
}

export async function prefetchTeamMembers() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.teamMembers.list(),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, is_active')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export async function prefetchUsersPage() {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(),
      queryFn: async () => {
        const [profilesRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('*').order('full_name', { ascending: true }),
          supabase.from('user_roles').select('user_id, role'),
        ]);
        
        const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]));
        return (profilesRes.data || []).map(profile => ({
          ...profile,
          role: roleMap.get(profile.user_id) || 'employee',
        }));
      },
      staleTime: 1000 * 60 * 5,
    }),
  ]);
}

export async function prefetchHolidays() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.holidays.list(),
    queryFn: async () => {
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - holidays don't change often
  });
}

export async function prefetchRules() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.rules.config(),
    queryFn: async () => {
      const { data } = await supabase
        .from('rules_config')
        .select('*')
        .order('rule_key');
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export async function prefetchNotifications(userId: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map(n => ({ ...n, is_read: n.is_read ?? false }));
    },
    staleTime: 1000 * 60,
  });
}

// Initial app prefetch - called once on app load
export async function prefetchCriticalData(userId: string, isAdmin: boolean) {
  await Promise.all([
    prefetchTeamMembers(),
    prefetchHolidays(),
    prefetchRules(),
    prefetchNotifications(userId),
    prefetchDashboardData(userId),
  ]);
}
