import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import type { Json } from '@/integrations/supabase/types';

export interface LatePolicyTier {
  min_minutes: number;
  max_minutes: number | null;
  deduction?: number;
  deduction_type?: 'half_day' | 'full_day';
}

export interface LatePolicy {
  tiers: LatePolicyTier[];
}

export interface LeavePolicy {
  advance_notice_hours: number;
  penalty_without_notice: number;
  half_day_with_notice_deduction: number;
}

export interface ExtraWorkTier {
  hours: number;
  compensation: number;
}

export interface ExtraWorkPolicy {
  tiers: ExtraWorkTier[];
}

export interface ReportingPolicy {
  missing_tod_penalty: number;
  missing_eod_penalty: number;
}

export interface RuleConfig {
  id: string;
  rule_key: string;
  rule_value: Json;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export function useRulesQuery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.rules.config();

  // Fetch rules
  const rulesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<RuleConfig[]> => {
      const { data, error } = await supabase
        .from('rules_config')
        .select('*')
        .order('rule_key');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - rules rarely change
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({
      ruleKey,
      ruleValue,
      isEnabled,
    }: {
      ruleKey: string;
      ruleValue: Json;
      isEnabled?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const updateData: { rule_value: Json; updated_by: string; is_enabled?: boolean } = {
        rule_value: ruleValue,
        updated_by: user.id,
      };

      if (isEnabled !== undefined) {
        updateData.is_enabled = isEnabled;
      }

      const { error } = await supabase
        .from('rules_config')
        .update(updateData)
        .eq('rule_key', ruleKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rules.all });
      toast({ title: 'Success', description: 'Rule configuration updated successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update rule configuration',
        variant: 'destructive',
      });
    },
  });

  const rules = rulesQuery.data || [];

  const getRule = (key: string): RuleConfig | undefined => {
    return rules.find(r => r.rule_key === key);
  };

  const getLatePolicy = (): LatePolicy | null => {
    const rule = getRule('late_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as LatePolicy;
  };

  const getLeavePolicy = (): LeavePolicy | null => {
    const rule = getRule('leave_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as LeavePolicy;
  };

  const getExtraWorkPolicy = (): ExtraWorkPolicy | null => {
    const rule = getRule('extra_work_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as ExtraWorkPolicy;
  };

  const getReportingPolicy = (): ReportingPolicy | null => {
    const rule = getRule('reporting_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as ReportingPolicy;
  };

  const updateRule = async (
    ruleKey: string,
    ruleValue: Json,
    isEnabled?: boolean
  ): Promise<boolean> => {
    try {
      await updateRuleMutation.mutateAsync({ ruleKey, ruleValue, isEnabled });
      return true;
    } catch {
      return false;
    }
  };

  return {
    rules,
    isLoading: rulesQuery.isLoading,
    isSaving: updateRuleMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.rules.all }),
    getRule,
    getLatePolicy,
    getLeavePolicy,
    getExtraWorkPolicy,
    getReportingPolicy,
    updateRule,
    updateLatePolicy: (policy: LatePolicy) => updateRule('late_policy', policy as unknown as Json),
    updateLeavePolicy: (policy: LeavePolicy) => updateRule('leave_policy', policy as unknown as Json),
    updateExtraWorkPolicy: (policy: ExtraWorkPolicy) => updateRule('extra_work_policy', policy as unknown as Json),
    updateReportingPolicy: (policy: ReportingPolicy) => updateRule('reporting_policy', policy as unknown as Json),
  };
}
