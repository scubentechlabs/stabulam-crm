import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import { notifyExtraWorkRequest } from '@/lib/notifications';
import type { Database } from '@/integrations/supabase/types';

type ExtraWorkStatus = Database['public']['Enums']['extra_work_status'];

export const EXTRA_WORK_TIERS = {
  1: 150,
  2: 250,
  3: 350,
  4: 450,
} as const;

export interface ExtraWork {
  id: string;
  user_id: string;
  attendance_id: string | null;
  work_date: string;
  hours: number;
  task_description: string;
  notes: string | null;
  status: ExtraWorkStatus | null;
  compensation_amount: number | null;
  admin_comments: string | null;
  approved_by: string | null;
  requested_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtraWorkWithProfile extends ExtraWork {
  profiles?: {
    full_name: string;
    email: string;
    monthly_salary: number | null;
  };
}

interface CreateExtraWorkData {
  hours: 1 | 2 | 3 | 4;
  task_description: string;
  notes?: string;
  attendance_id?: string;
}

export function useExtraWorkQuery() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.extraWork.list(isAdmin ? undefined : user?.id);

  // Fetch extra work
  const extraWorkQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<ExtraWorkWithProfile[]> => {
      let query = supabase
        .from('extra_work')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (isAdmin && data) {
        const userIds = [...new Set(data.map(e => e.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, monthly_salary')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        return data.map(ew => ({
          ...ew,
          profiles: profileMap.get(ew.user_id),
        }));
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Create extra work mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateExtraWorkData) => {
      if (!user) throw new Error('Not authenticated');

      const compensation = EXTRA_WORK_TIERS[data.hours];
      const today = new Date().toISOString().split('T')[0];

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: insertedData, error } = await supabase.from('extra_work').insert({
        user_id: user.id,
        work_date: today,
        hours: data.hours,
        task_description: data.task_description,
        notes: data.notes || null,
        attendance_id: data.attendance_id || null,
        compensation_amount: compensation,
        status: 'pending',
        requested_at: new Date().toISOString(),
      }).select('id').single();

      if (error) throw error;

      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && insertedData) {
        await notifyExtraWorkRequest(
          adminRoles.map(r => r.user_id),
          profile?.full_name || 'An employee',
          data.hours,
          insertedData.id
        );
      }

      return insertedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.extraWork.all });
      toast({ title: 'Success', description: 'Extra work request submitted successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit extra work request',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      extraWorkId,
      status,
      adminComments,
      adjustedCompensation,
    }: {
      extraWorkId: string;
      status: 'approved' | 'rejected';
      adminComments?: string;
      adjustedCompensation?: number;
    }) => {
      if (!user || !isAdmin) throw new Error('Not authorized');

      const { data: ewData, error: fetchError } = await supabase
        .from('extra_work')
        .select('user_id, hours, work_date, compensation_amount')
        .eq('id', extraWorkId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: Record<string, unknown> = {
        status,
        admin_comments: adminComments || null,
        approved_by: user.id,
        processed_at: new Date().toISOString(),
      };

      if (adjustedCompensation !== undefined) {
        updateData.compensation_amount = adjustedCompensation;
      }

      const { error } = await supabase
        .from('extra_work')
        .update(updateData)
        .eq('id', extraWorkId);

      if (error) throw error;

      const notificationType = status === 'approved' ? 'request_approved' : 'request_rejected';
      const finalCompensation = adjustedCompensation ?? ewData.compensation_amount ?? 0;

      await supabase.from('notifications').insert({
        user_id: ewData.user_id,
        notification_type: notificationType,
        title: `Extra Work Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your ${ewData.hours}-hour extra work request for ${ewData.work_date} has been ${status}.${status === 'approved' ? ` Compensation: ₹${finalCompensation}` : ''}${adminComments ? ` Comment: ${adminComments}` : ''}`,
        reference_id: extraWorkId,
        reference_type: 'extra_work',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.extraWork.all });
      toast({ title: 'Success', description: 'Extra work request updated' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update extra work request',
        variant: 'destructive',
      });
    },
  });

  const extraWorkRequests = extraWorkQuery.data || [];

  const currentMonthApproved = extraWorkRequests
    .filter(e => {
      if (e.status !== 'approved') return false;
      const requestDate = new Date(e.work_date);
      const now = new Date();
      return requestDate.getMonth() === now.getMonth() && 
             requestDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.compensation_amount || 0), 0);

  return {
    extraWorkRequests,
    pendingRequests: extraWorkRequests.filter(e => e.status === 'pending'),
    approvedRequests: extraWorkRequests.filter(e => e.status === 'approved'),
    rejectedRequests: extraWorkRequests.filter(e => e.status === 'rejected'),
    currentMonthApproved,
    isLoading: extraWorkQuery.isLoading,
    createExtraWork: createMutation.mutateAsync,
    updateExtraWorkStatus: (
      extraWorkId: string,
      status: 'approved' | 'rejected',
      adminComments?: string,
      adjustedCompensation?: number
    ) => updateStatusMutation.mutateAsync({ extraWorkId, status, adminComments, adjustedCompensation }),
    refreshExtraWork: () => queryClient.invalidateQueries({ queryKey: queryKeys.extraWork.all }),
    EXTRA_WORK_TIERS,
  };
}
