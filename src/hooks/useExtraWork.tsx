import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyExtraWorkRequest } from '@/lib/notifications';
import type { Database } from '@/integrations/supabase/types';

type ExtraWorkStatus = Database['public']['Enums']['extra_work_status'];

// Compensation tiers
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

export function useExtraWork() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [extraWorkRequests, setExtraWorkRequests] = useState<ExtraWorkWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExtraWork = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('extra_work')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // For admin, fetch profile info
      if (isAdmin && data) {
        const userIds = [...new Set(data.map(e => e.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, monthly_salary')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const extraWorkWithProfiles = data.map(ew => ({
          ...ew,
          profiles: profileMap.get(ew.user_id),
        }));
        
        setExtraWorkRequests(extraWorkWithProfiles);
      } else {
        setExtraWorkRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching extra work:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch extra work requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchExtraWork();
  }, [fetchExtraWork]);

  const createExtraWork = async (data: CreateExtraWorkData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const compensation = EXTRA_WORK_TIERS[data.hours];
      const today = new Date().toISOString().split('T')[0];

      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: insertedExtraWork, error } = await supabase.from('extra_work').insert({
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

      // Notify all admins about the new extra work request
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0 && insertedExtraWork) {
        const adminUserIds = adminRoles.map(r => r.user_id);
        await notifyExtraWorkRequest(
          adminUserIds,
          profile?.full_name || 'An employee',
          data.hours,
          insertedExtraWork.id
        );
      }

      toast({
        title: 'Success',
        description: 'Extra work request submitted successfully',
      });

      await fetchExtraWork();
      return { error: null };
    } catch (error) {
      console.error('Error creating extra work:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit extra work request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateExtraWorkStatus = async (
    extraWorkId: string, 
    status: 'approved' | 'rejected', 
    adminComments?: string,
    adjustedCompensation?: number
  ) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      // First get the extra work to find the user_id and details
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

      // Allow admin to adjust compensation if needed
      if (adjustedCompensation !== undefined) {
        updateData.compensation_amount = adjustedCompensation;
      }

      const { error } = await supabase
        .from('extra_work')
        .update(updateData)
        .eq('id', extraWorkId);

      if (error) throw error;

      // Send notification to the employee
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

      toast({
        title: 'Success',
        description: `Extra work request ${status}`,
      });

      await fetchExtraWork();
      return { error: null };
    } catch (error) {
      console.error('Error updating extra work:', error);
      toast({
        title: 'Error',
        description: 'Failed to update extra work request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const pendingRequests = extraWorkRequests.filter(e => e.status === 'pending');
  const approvedRequests = extraWorkRequests.filter(e => e.status === 'approved');
  const rejectedRequests = extraWorkRequests.filter(e => e.status === 'rejected');

  // Calculate total approved compensation for current month
  const currentMonthApproved = approvedRequests
    .filter(e => {
      const requestDate = new Date(e.work_date);
      const now = new Date();
      return requestDate.getMonth() === now.getMonth() && 
             requestDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.compensation_amount || 0), 0);

  return {
    extraWorkRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    currentMonthApproved,
    isLoading,
    createExtraWork,
    updateExtraWorkStatus,
    refreshExtraWork: fetchExtraWork,
    EXTRA_WORK_TIERS,
  };
}
