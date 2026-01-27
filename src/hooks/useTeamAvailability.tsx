import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, format, eachDayOfInterval, isWeekend } from 'date-fns';

interface TeamMember {
  user_id: string;
  full_name: string;
  department: string | null;
  avatar_url: string | null;
}

interface LeaveEntry {
  user_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  half_day_period: string | null;
}

export interface TeamAvailability {
  date: Date;
  members: {
    user_id: string;
    full_name: string;
    department: string | null;
    avatar_url: string | null;
    status: 'available' | 'leave' | 'half_day' | 'weekend';
    leave_type?: string;
    half_day_period?: string | null;
  }[];
}

export function useTeamAvailability(selectedMonth: Date) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      // Fetch all active team members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, department, avatar_url')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError) throw profilesError;
      setTeamMembers(profiles || []);

      // Fetch approved leaves that overlap with the selected month
      const { data: leavesData, error: leavesError } = await supabase
        .from('leaves')
        .select('user_id, start_date, end_date, leave_type, half_day_period')
        .eq('status', 'approved')
        .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
        .gte('end_date', format(monthStart, 'yyyy-MM-dd'));

      if (leavesError) throw leavesError;
      setLeaves(leavesData || []);

    } catch (error) {
      console.error('Error fetching team availability:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAvailabilityForMonth = useCallback((): TeamAvailability[] => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isWeekendDay = isWeekend(date);

      const members = teamMembers.map(member => {
        // Check if member is on leave this day
        const memberLeave = leaves.find(leave => 
          leave.user_id === member.user_id &&
          dateStr >= leave.start_date &&
          dateStr <= leave.end_date
        );

        let status: 'available' | 'leave' | 'half_day' | 'weekend' = 'available';
        let leave_type: string | undefined;
        let half_day_period: string | null | undefined;

        if (isWeekendDay) {
          status = 'weekend';
        } else if (memberLeave) {
          if (memberLeave.leave_type === 'half_day') {
            status = 'half_day';
            half_day_period = memberLeave.half_day_period;
          } else {
            status = 'leave';
          }
          leave_type = memberLeave.leave_type;
        }

        return {
          ...member,
          status,
          leave_type,
          half_day_period,
        };
      });

      return { date, members };
    });
  }, [selectedMonth, teamMembers, leaves]);

  const getMembersOnLeaveForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return teamMembers.filter(member => {
      return leaves.some(leave => 
        leave.user_id === member.user_id &&
        dateStr >= leave.start_date &&
        dateStr <= leave.end_date
      );
    }).map(member => {
      const memberLeave = leaves.find(leave => 
        leave.user_id === member.user_id &&
        dateStr >= leave.start_date &&
        dateStr <= leave.end_date
      );
      
      return {
        ...member,
        leave_type: memberLeave?.leave_type,
        half_day_period: memberLeave?.half_day_period,
      };
    });
  }, [teamMembers, leaves]);

  const getAvailableMembersForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return teamMembers.filter(member => {
      return !leaves.some(leave => 
        leave.user_id === member.user_id &&
        dateStr >= leave.start_date &&
        dateStr <= leave.end_date
      );
    });
  }, [teamMembers, leaves]);

  return {
    teamMembers,
    isLoading,
    getAvailabilityForMonth,
    getMembersOnLeaveForDate,
    getAvailableMembersForDate,
    refetch: fetchData,
  };
}
