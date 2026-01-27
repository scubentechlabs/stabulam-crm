import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type RegularizationStatus = 'pending' | 'approved' | 'rejected';

export interface Regularization {
  id: string;
  user_id: string;
  request_date: string;
  requested_clock_in: string;
  requested_clock_out: string;
  reason: string;
  status: RegularizationStatus;
  admin_comments: string | null;
  approved_by: string | null;
  processed_at: string | null;
  attendance_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegularizationWithProfile extends Regularization {
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CreateRegularizationData {
  request_date: string;
  requested_clock_in: string;
  requested_clock_out: string;
  reason: string;
}

export function useAttendanceRegularization() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [regularizations, setRegularizations] = useState<RegularizationWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRegularizations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('attendance_regularizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For admin, fetch profile info
      if (isAdmin && data) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const regularizationsWithProfiles = data.map(reg => ({
          ...reg,
          status: reg.status as RegularizationStatus,
          profiles: profileMap.get(reg.user_id),
        }));
        
        setRegularizations(regularizationsWithProfiles);
      } else {
        setRegularizations((data || []).map(d => ({
          ...d,
          status: d.status as RegularizationStatus,
        })));
      }
    } catch (error) {
      console.error('Error fetching regularizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch regularization requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchRegularizations();
  }, [fetchRegularizations]);

  const createRegularization = async (data: CreateRegularizationData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Check if there's an existing attendance record for that date
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', data.request_date)
        .maybeSingle();

      const { data: insertedReg, error } = await supabase
        .from('attendance_regularizations')
        .insert({
          user_id: user.id,
          request_date: data.request_date,
          requested_clock_in: data.requested_clock_in,
          requested_clock_out: data.requested_clock_out,
          reason: data.reason,
          status: 'pending',
          attendance_id: existingAttendance?.id || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Notify all admins about the new regularization request
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0 && insertedReg) {
        const notifications = adminRoles.map(r => ({
          user_id: r.user_id,
          notification_type: 'regularization_request' as const,
          title: 'New Regularization Request',
          message: `${profile?.full_name || 'An employee'} has requested attendance regularization for ${format(new Date(data.request_date), 'MMM dd, yyyy')}`,
          reference_id: insertedReg.id,
          reference_type: 'regularization',
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: 'Success',
        description: 'Regularization request submitted successfully',
      });

      await fetchRegularizations();
      return { error: null };
    } catch (error) {
      console.error('Error creating regularization:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit regularization request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateRegularizationStatus = async (
    regularizationId: string, 
    status: 'approved' | 'rejected', 
    adminComments?: string
  ) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      // First get the regularization details
      const { data: regData, error: fetchError } = await supabase
        .from('attendance_regularizations')
        .select('*')
        .eq('id', regularizationId)
        .single();

      if (fetchError) throw fetchError;

      // Update regularization status
      const { error } = await supabase
        .from('attendance_regularizations')
        .update({
          status,
          admin_comments: adminComments || null,
          approved_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', regularizationId);

      if (error) throw error;

      // If approved, update or create the attendance record
      if (status === 'approved') {
        const clockInTime = new Date(`${regData.request_date}T${regData.requested_clock_in}`);
        const clockOutTime = new Date(`${regData.request_date}T${regData.requested_clock_out}`);

        if (regData.attendance_id) {
          // Update existing attendance record
          await supabase
            .from('attendance')
            .update({
              clock_in_time: clockInTime.toISOString(),
              clock_out_time: clockOutTime.toISOString(),
              is_late: false,
              late_minutes: 0,
              notes: `Regularized: ${regData.reason}`,
            })
            .eq('id', regData.attendance_id);
        } else {
          // Create new attendance record
          await supabase
            .from('attendance')
            .insert({
              user_id: regData.user_id,
              date: regData.request_date,
              clock_in_time: clockInTime.toISOString(),
              clock_out_time: clockOutTime.toISOString(),
              is_late: false,
              late_minutes: 0,
              tod_submitted: true,
              eod_submitted: true,
              notes: `Regularized: ${regData.reason}`,
            });
        }
      }

      // Send notification to the employee
      const notificationType = status === 'approved' ? 'regularization_approved' : 'regularization_rejected';
      
      await supabase.from('notifications').insert({
        user_id: regData.user_id,
        notification_type: notificationType,
        title: `Regularization ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your attendance regularization request for ${format(new Date(regData.request_date), 'MMM dd, yyyy')} has been ${status}.${adminComments ? ` Comment: ${adminComments}` : ''}`,
        reference_id: regularizationId,
        reference_type: 'regularization',
      });

      toast({
        title: 'Success',
        description: `Regularization request ${status}`,
      });

      await fetchRegularizations();
      return { error: null };
    } catch (error) {
      console.error('Error updating regularization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update regularization request',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const pendingRegularizations = regularizations.filter(r => r.status === 'pending');
  const approvedRegularizations = regularizations.filter(r => r.status === 'approved');
  const rejectedRegularizations = regularizations.filter(r => r.status === 'rejected');

  return {
    regularizations,
    pendingRegularizations,
    approvedRegularizations,
    rejectedRegularizations,
    isLoading,
    createRegularization,
    updateRegularizationStatus,
    refetch: fetchRegularizations,
  };
}
