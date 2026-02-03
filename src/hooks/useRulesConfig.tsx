import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

export function useRulesConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rules_config')
        .select('*')
        .order('rule_key');

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rules configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const getRule = useCallback((key: string): RuleConfig | undefined => {
    return rules.find(r => r.rule_key === key);
  }, [rules]);

  const getLatePolicy = useCallback((): LatePolicy | null => {
    const rule = getRule('late_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as LatePolicy;
  }, [getRule]);

  const getLeavePolicy = useCallback((): LeavePolicy | null => {
    const rule = getRule('leave_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as LeavePolicy;
  }, [getRule]);

  const getExtraWorkPolicy = useCallback((): ExtraWorkPolicy | null => {
    const rule = getRule('extra_work_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as ExtraWorkPolicy;
  }, [getRule]);

  const getReportingPolicy = useCallback((): ReportingPolicy | null => {
    const rule = getRule('reporting_policy');
    if (!rule) return null;
    return rule.rule_value as unknown as ReportingPolicy;
  }, [getRule]);

  const updateRule = useCallback(async (
    ruleKey: string,
    ruleValue: Json,
    isEnabled?: boolean
  ): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
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

      toast({
        title: 'Success',
        description: 'Rule configuration updated successfully',
      });

      await fetchRules();
      return true;
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule configuration',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast, fetchRules]);

  const updateLatePolicy = useCallback(async (policy: LatePolicy): Promise<boolean> => {
    return updateRule('late_policy', policy as unknown as Json);
  }, [updateRule]);

  const updateLeavePolicy = useCallback(async (policy: LeavePolicy): Promise<boolean> => {
    return updateRule('leave_policy', policy as unknown as Json);
  }, [updateRule]);

  const updateExtraWorkPolicy = useCallback(async (policy: ExtraWorkPolicy): Promise<boolean> => {
    return updateRule('extra_work_policy', policy as unknown as Json);
  }, [updateRule]);

  const updateReportingPolicy = useCallback(async (policy: ReportingPolicy): Promise<boolean> => {
    return updateRule('reporting_policy', policy as unknown as Json);
  }, [updateRule]);

  return {
    rules,
    isLoading,
    isSaving,
    refetch: fetchRules,
    getRule,
    getLatePolicy,
    getLeavePolicy,
    getExtraWorkPolicy,
    getReportingPolicy,
    updateRule,
    updateLatePolicy,
    updateLeavePolicy,
    updateExtraWorkPolicy,
    updateReportingPolicy,
  };
}
