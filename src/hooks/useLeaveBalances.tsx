import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LeaveBalance {
  id: string;
  user_id: string;
  year: number;
  annual_allocation: number;
  carried_forward: number;
  used_leaves: number;
  pending_leaves: number;
  remaining_leaves: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalanceWithProfile extends LeaveBalance {
  profiles?: {
    full_name: string;
    email: string;
  };
}

export function useLeaveBalances(year?: number) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [balances, setBalances] = useState<LeaveBalanceWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = year || new Date().getFullYear();

  const fetchBalances = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (isAdmin) {
        // Fetch all employees and their balances
        const [balancesRes, profilesRes] = await Promise.all([
          supabase
            .from('leave_balances')
            .select('*')
            .eq('year', currentYear),
          supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .eq('is_active', true),
        ]);

        if (balancesRes.error) throw balancesRes.error;
        if (profilesRes.error) throw profilesRes.error;

        const profiles = profilesRes.data || [];
        const existingBalances = balancesRes.data || [];
        const balanceMap = new Map(existingBalances.map(b => [b.user_id, b]));

        // Create combined list with all employees
        const combinedBalances: LeaveBalanceWithProfile[] = profiles.map(profile => {
          const balance = balanceMap.get(profile.user_id);
          const annual = balance?.annual_allocation || 18;
          const carried = balance?.carried_forward || 0;
          const used = balance?.used_leaves || 0;
          const pending = balance?.pending_leaves || 0;

          return {
            id: balance?.id || '',
            user_id: profile.user_id,
            year: currentYear,
            annual_allocation: annual,
            carried_forward: carried,
            used_leaves: used,
            pending_leaves: pending,
            remaining_leaves: annual + carried - used,
            created_at: balance?.created_at || '',
            updated_at: balance?.updated_at || '',
            profiles: {
              full_name: profile.full_name,
              email: profile.email,
            },
          };
        });

        setBalances(combinedBalances);
      } else {
        // Fetch own balance
        const { data, error } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', currentYear)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const balance: LeaveBalanceWithProfile = {
            ...data,
            remaining_leaves: data.annual_allocation + data.carried_forward - data.used_leaves,
          };
          setBalances([balance]);
        } else {
          // Return default allocation if no record exists
          setBalances([{
            id: '',
            user_id: user.id,
            year: currentYear,
            annual_allocation: 18,
            carried_forward: 0,
            used_leaves: 0,
            pending_leaves: 0,
            remaining_leaves: 18,
            created_at: '',
            updated_at: '',
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, currentYear, toast]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const updateAllocation = async (userId: string, allocation: number, carriedForward: number = 0) => {
    if (!isAdmin) return { error: new Error('Not authorized') };

    try {
      // Check if balance exists
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('id')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('leave_balances')
          .update({
            annual_allocation: allocation,
            carried_forward: carriedForward,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leave_balances')
          .insert({
            user_id: userId,
            year: currentYear,
            annual_allocation: allocation,
            carried_forward: carriedForward,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Leave allocation updated successfully',
      });

      await fetchBalances();
      return { error: null };
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update leave allocation',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const syncBalance = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('sync_leave_balance', {
        _user_id: userId,
        _year: currentYear,
      });

      if (error) throw error;
      await fetchBalances();
      return { error: null };
    } catch (error) {
      console.error('Error syncing balance:', error);
      return { error };
    }
  };

  const syncAllBalances = async () => {
    if (!isAdmin) return;

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_active', true);

      if (profiles) {
        await Promise.all(
          profiles.map(p => supabase.rpc('sync_leave_balance', {
            _user_id: p.user_id,
            _year: currentYear,
          }))
        );
      }

      await fetchBalances();
      toast({
        title: 'Success',
        description: 'All leave balances synced successfully',
      });
    } catch (error) {
      console.error('Error syncing all balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync leave balances',
        variant: 'destructive',
      });
    }
  };

  return {
    balances,
    isLoading,
    refreshBalances: fetchBalances,
    updateAllocation,
    syncBalance,
    syncAllBalances,
  };
}
