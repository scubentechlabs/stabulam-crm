import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
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

export function useLeavesQuery() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.leaves.list(isAdmin ? undefined : user?.id);

  // Fetch leaves
  const leavesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<LeaveWithProfile[]> => {
      let query = supabase
        .from('leaves')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
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
        return data.map(leave => ({
          ...leave,
          profiles: profileMap.get(leave.user_id),
        }));
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data: CreateLeaveData) => {
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const leaveStart = new Date(data.start_date + 'T09:00:00+05:30');
      const hoursDiff = (leaveStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      const hasAdvanceNotice = hoursDiff >= 48;

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

      // Notify admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && insertedLeave) {
        const leaveTypeLabel = data.leave_type === 'half_day' ? 'Half Day' : 
                               data.leave_type === 'full_day' ? 'Full Day' : 'Multiple Days';
        await notifyLeaveRequest(
          adminRoles.map(r => r.user_id),
          profile?.full_name || 'An employee',
          leaveTypeLabel,
          insertedLeave.id
        );
      }

      return insertedLeave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaveBalances.all });
      toast({ title: 'Success', description: 'Leave request submitted successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      leaveId,
      status,
      adminComments,
      penaltyAmount,
    }: {
      leaveId: string;
      status: 'approved' | 'rejected';
      adminComments?: string;
      penaltyAmount?: number;
    }) => {
      if (!user || !isAdmin) throw new Error('Not authorized');

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

      // Notify employee
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaveBalances.all });
      toast({ title: 'Success', description: 'Leave request updated' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update leave request',
        variant: 'destructive',
      });
    },
  });

  // Cancel leave mutation
  const cancelLeaveMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('leaves')
        .update({
          status: 'rejected' as const,
          admin_comments: 'Cancelled by employee',
          processed_at: new Date().toISOString(),
        })
        .eq('id', leaveId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Leave request not found or already processed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaveBalances.all });
      toast({ title: 'Success', description: 'Leave request cancelled' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel leave request',
        variant: 'destructive',
      });
    },
  });

  const leaves = leavesQuery.data || [];

  const calculateAdvanceNotice = (startDate: string): boolean => {
    const now = new Date();
    const leaveStart = new Date(startDate + 'T09:00:00+05:30');
    const hoursDifference = (leaveStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 48;
  };

  return {
    leaves,
    pendingLeaves: leaves.filter(l => l.status === 'pending'),
    approvedLeaves: leaves.filter(l => l.status === 'approved'),
    rejectedLeaves: leaves.filter(l => l.status === 'rejected'),
    isLoading: leavesQuery.isLoading,
    createLeave: createLeaveMutation.mutateAsync,
    updateLeaveStatus: (
      leaveId: string,
      status: 'approved' | 'rejected',
      adminComments?: string,
      penaltyAmount?: number
    ) => updateStatusMutation.mutateAsync({ leaveId, status, adminComments, penaltyAmount }),
    cancelLeave: cancelLeaveMutation.mutateAsync,
    refreshLeaves: () => queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all }),
    calculateAdvanceNotice,
  };
}
