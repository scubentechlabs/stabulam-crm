import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Flag {
  id: string;
  employee_id: string;
  issued_by: string;
  title: string;
  description: string;
  status: 'open' | 'acknowledged';
  created_at: string;
  updated_at: string;
  employee_profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  issuer_profile?: {
    full_name: string;
  };
  replies_count?: number;
}

export interface FlagReply {
  id: string;
  flag_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CreateFlagData {
  employee_id: string;
  title: string;
  description: string;
}

export interface CreateReplyData {
  flag_id: string;
  reply_text: string;
}

export interface FlagFilters {
  employeeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'open' | 'acknowledged' | 'all';
  search?: string;
}

export function useFlags(filters?: FlagFilters) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all flags (admin sees all, employee sees own)
  const flagsQuery = useQuery({
    queryKey: ['flags', filters, user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('flags')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profile information for each flag
      const flagsWithProfiles = await Promise.all(
        (data || []).map(async (flag) => {
          // Fetch employee profile
          const { data: employeeProfile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', flag.employee_id)
            .single();

          // Fetch issuer profile
          const { data: issuerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', flag.issued_by)
            .single();

          // Fetch replies count
          const { count } = await supabase
            .from('flag_replies')
            .select('*', { count: 'exact', head: true })
            .eq('flag_id', flag.id);

          return {
            ...flag,
            employee_profile: employeeProfile,
            issuer_profile: issuerProfile,
            replies_count: count || 0,
          } as Flag;
        })
      );

      return flagsWithProfiles;
    },
    enabled: !!user,
  });

  // Fetch single flag with replies
  const useFlagDetails = (flagId: string | null) => {
    return useQuery({
      queryKey: ['flag-details', flagId],
      queryFn: async () => {
        if (!flagId) return null;

        const { data: flag, error: flagError } = await supabase
          .from('flags')
          .select('*')
          .eq('id', flagId)
          .single();

        if (flagError) throw flagError;

        // Fetch profiles
        const { data: employeeProfile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('user_id', flag.employee_id)
          .single();

        const { data: issuerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', flag.issued_by)
          .single();

        // Fetch replies
        const { data: replies, error: repliesError } = await supabase
          .from('flag_replies')
          .select('*')
          .eq('flag_id', flagId)
          .order('created_at', { ascending: true });

        console.log('Fetched replies for flag', flagId, ':', replies, 'Error:', repliesError);

        if (repliesError) throw repliesError;

        // Fetch reply user profiles
        const repliesWithProfiles = await Promise.all(
          (replies || []).map(async (reply) => {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', reply.user_id)
              .single();

            return {
              ...reply,
              user_profile: userProfile,
            } as FlagReply;
          })
        );

        return {
          ...flag,
          employee_profile: employeeProfile,
          issuer_profile: issuerProfile,
          replies: repliesWithProfiles,
        };
      },
      enabled: !!flagId,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    });
  };

  // Create flag (admin only)
  const createFlagMutation = useMutation({
    mutationFn: async (data: CreateFlagData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: newFlag, error } = await supabase
        .from('flags')
        .insert({
          employee_id: data.employee_id,
          issued_by: user.id,
          title: data.title,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for employee
      await supabase.from('notifications').insert({
        user_id: data.employee_id,
        title: 'New Flag Issued',
        message: `You have received a new flag: "${data.title}"`,
        notification_type: 'request_rejected', // Using existing type for warning-like notification
        reference_type: 'flag',
        reference_id: newFlag.id,
      });

      return newFlag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      toast.success('Flag issued successfully');
    },
    onError: (error) => {
      console.error('Error creating flag:', error);
      toast.error('Failed to issue flag');
    },
  });

  // Add reply to flag
  const addReplyMutation = useMutation({
    mutationFn: async (data: CreateReplyData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: newReply, error } = await supabase
        .from('flag_replies')
        .insert({
          flag_id: data.flag_id,
          user_id: user.id,
          reply_text: data.reply_text,
        })
        .select()
        .single();

      if (error) throw error;
      return newReply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flag-details', variables.flag_id] });
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      toast.success('Reply submitted');
    },
    onError: (error) => {
      console.error('Error adding reply:', error);
      toast.error('Failed to submit reply');
    },
  });

  // Update flag status (admin only)
  const updateFlagStatusMutation = useMutation({
    mutationFn: async ({ flagId, status }: { flagId: string; status: 'open' | 'acknowledged' }) => {
      const { error } = await supabase
        .from('flags')
        .update({ status })
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      toast.success('Flag status updated');
    },
    onError: (error) => {
      console.error('Error updating flag:', error);
      toast.error('Failed to update flag status');
    },
  });

  // Get flag statistics for analytics
  const useFlagStats = (dateFrom?: Date, dateTo?: Date) => {
    return useQuery({
      queryKey: ['flagStats', dateFrom?.toISOString(), dateTo?.toISOString()],
      queryFn: async () => {
        let query = supabase.from('flags').select('*');

        if (dateFrom) {
          query = query.gte('created_at', dateFrom.toISOString());
        }

        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        // Group by date
        const byDate: Record<string, number> = {};
        const byEmployee: Record<string, { count: number; employee_id: string }> = {};

        (data || []).forEach((flag) => {
          const date = new Date(flag.created_at).toISOString().split('T')[0];
          byDate[date] = (byDate[date] || 0) + 1;

          if (!byEmployee[flag.employee_id]) {
            byEmployee[flag.employee_id] = { count: 0, employee_id: flag.employee_id };
          }
          byEmployee[flag.employee_id].count++;
        });

        // Get top flagged employees
        const topFlagged = Object.values(byEmployee)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Fetch names for top flagged
        const topFlaggedWithNames = await Promise.all(
          topFlagged.map(async (item) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', item.employee_id)
              .single();

            return {
              ...item,
              name: profile?.full_name || 'Unknown',
            };
          })
        );

        return {
          total: data?.length || 0,
          byDate,
          topFlagged: topFlaggedWithNames,
          openCount: data?.filter((f) => f.status === 'open').length || 0,
          acknowledgedCount: data?.filter((f) => f.status === 'acknowledged').length || 0,
        };
      },
      enabled: isAdmin,
    });
  };

  // Get employee flag count for profile integration
  const useEmployeeFlagCount = (employeeId: string) => {
    return useQuery({
      queryKey: ['employeeFlagCount', employeeId],
      queryFn: async () => {
        const { count, error } = await supabase
          .from('flags')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', employeeId);

        if (error) throw error;
        return count || 0;
      },
      enabled: !!employeeId,
    });
  };

  return {
    flags: flagsQuery.data || [],
    isLoading: flagsQuery.isLoading,
    error: flagsQuery.error,
    refetch: flagsQuery.refetch,
    createFlag: createFlagMutation.mutate,
    isCreating: createFlagMutation.isPending,
    addReply: addReplyMutation.mutate,
    isAddingReply: addReplyMutation.isPending,
    updateFlagStatus: updateFlagStatusMutation.mutate,
    useFlagDetails,
    useFlagStats,
    useEmployeeFlagCount,
  };
}
