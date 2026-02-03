import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyLeaveRequest } from '@/lib/notifications';
import type { Database } from '@/integrations/supabase/types';

type LeaveType = Database['public']['Enums']['leave_type'];
type LeaveStatus = Database['public']['Enums']['leave_status'];

export interface Leave {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  half_day_period: string | null;
  reason: string | null;
  delegation_notes: string;
  status: LeaveStatus | null;
  has_advance_notice: boolean | null;
  penalty_amount: number | null;
  admin_comments: string | null;
  approved_by: string | null;
  requested_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveWithProfile extends Leave {
  profiles?: {
    full_name: string;
    email: string;
    monthly_salary: number | null;
  };
}

interface CreateLeaveData {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  half_day_period?: string | null;
  reason?: string;
  delegation_notes: string;
}

export function useLeaves() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('leaves')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // For admin, fetch profile info
      if (isAdmin && data) {
        const userIds = [...new Set(data.map(l => l.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, monthly_salary')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const leavesWithProfiles = data.map(leave => ({
          ...leave,
          profiles: profileMap.get(leave.user_id),
        }));
        
        setLeaves(leavesWithProfiles);
      } else {
        setLeaves(data || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const calculateAdvanceNotice = (startDate: string): boolean => {
    const now = new Date();
    // Parse the start date and set it to the beginning of the work day (9 AM IST)
    const leaveStart = new Date(startDate + 'T09:00:00+05:30');
    const hoursDifference = (leaveStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 48;
  };

  const createLeave = async (data: CreateLeaveData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const hasAdvanceNotice = calculateAdvanceNotice(data.start_date);
      
      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: insertedLeave, error } = await supabase.from('leaves').insert({
        user_id: user.id,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        half_day_period: data.half_day_period || null,
        reason: data.reason || null,
        delegation_notes: data.delegation_notes,
        has_advance_notice: hasAdvanceNotice,
        status: 'pending',
        requested_at: new Date().toISOString(),
      }).select('id').single();

      if (error) throw error;

      // Notify all admins about the new leave request
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0 && insertedLeave) {
        const adminUserIds = adminRoles.map(r => r.user_id);
        const leaveTypeLabel = data.leave_type === 'half_day' ? 'Half Day' : 
                               data.leave_type === 'full_day' ? 'Full Day' : 'Multiple Days';
        await notifyLeaveRequest(
          adminUserIds,
          profile?.full_name || 'An employee',
          leaveTypeLabel,
          insertedLeave.id
        );
      }

      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });

      await fetchLeaves();
      return { error: null };
    } catch (error) {
      console.error('Error creating leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateLeaveStatus = async (
    leaveId: string, 
    status: 'approved' | 'rejected', 
    adminComments?: string,
    penaltyAmount?: number
  ) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      // First get the leave to find the user_id
      const { data: leaveData, error: fetchError } = await supabase
        .from('leaves')
        .select('user_id, leave_type, start_date, end_date')
        .eq('id', leaveId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('leaves')
        .update({
          status,
          admin_comments: adminComments || null,
          penalty_amount: penaltyAmount || 0,
          approved_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', leaveId);

      if (error) throw error;

      // Send notification to the employee
      const notificationType = status === 'approved' ? 'request_approved' : 'request_rejected';
      const leaveTypeLabel = leaveData.leave_type === 'half_day' ? 'Half Day' : 
                             leaveData.leave_type === 'full_day' ? 'Full Day' : 'Multiple Days';
      
      await supabase.from('notifications').insert({
        user_id: leaveData.user_id,
        notification_type: notificationType,
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your ${leaveTypeLabel} leave request for ${leaveData.start_date}${leaveData.start_date !== leaveData.end_date ? ` to ${leaveData.end_date}` : ''} has been ${status}.${adminComments ? ` Comment: ${adminComments}` : ''}`,
        reference_id: leaveId,
        reference_type: 'leave',
      });

      toast({
        title: 'Success',
        description: `Leave request ${status}`,
      });

      await fetchLeaves();
      return { error: null };
    } catch (error) {
      console.error('Error updating leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to update leave request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const cancelLeave = async (leaveId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Update leave status to 'rejected' with a cancellation note instead of deleting
      // since RLS doesn't allow DELETE on leaves table
      const { error } = await supabase
        .from('leaves')
        .update({
          status: 'rejected' as const,
          admin_comments: 'Cancelled by employee',
          processed_at: new Date().toISOString(),
        })
        .eq('id', leaveId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Leave request cancelled',
      });

      await fetchLeaves();
      return { error: null };
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel leave request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  return {
    leaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    isLoading,
    createLeave,
    updateLeaveStatus,
    cancelLeave,
    refreshLeaves: fetchLeaves,
    calculateAdvanceNotice,
  };
}
