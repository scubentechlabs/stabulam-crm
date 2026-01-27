import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Attendance = Database['public']['Tables']['attendance']['Row'];
type Leave = Database['public']['Tables']['leaves']['Row'];
type ExtraWork = Database['public']['Tables']['extra_work']['Row'];
type SalaryRecord = Database['public']['Tables']['salary_records']['Row'];

interface RulesConfig {
  late_policy: {
    tiers: Array<{
      min_minutes: number;
      max_minutes: number | null;
      deduction?: number;
      deduction_type?: 'half_day' | 'full_day';
    }>;
  };
  leave_policy: {
    advance_notice_hours: number;
    half_day_with_notice_deduction: number;
    penalty_without_notice: number;
  };
  reporting_policy: {
    missing_tod_penalty: number;
    missing_eod_penalty: number;
  };
  extra_work_policy: {
    tiers: Array<{
      hours: number;
      compensation: number;
    }>;
  };
  working_days: {
    days: string[];
    holidays: string[];
  };
}

interface SalaryBreakdown {
  attendance_days: number;
  working_days: number;
  late_days: Array<{ date: string; minutes: number; deduction: number }>;
  leave_days: Array<{ date: string; type: string; deduction: number; penalty: number }>;
  missing_tod_days: string[];
  missing_eod_days: string[];
  extra_work_entries: Array<{ date: string; hours: number; compensation: number }>;
}

export interface CalculatedSalary {
  user_id: string;
  profile: Profile;
  base_salary: number;
  late_deductions: number;
  leave_deductions: number;
  leave_penalties: number;
  tod_penalties: number;
  eod_penalties: number;
  extra_work_additions: number;
  net_salary: number;
  breakdown: SalaryBreakdown;
}

export function useSalaryCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch all profiles
  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch rules config
  const { data: rulesConfig } = useQuery({
    queryKey: ['rules-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules_config')
        .select('*')
        .eq('is_enabled', true);
      if (error) throw error;
      
      const config: Record<string, unknown> = {};
      data.forEach((rule) => {
        config[rule.rule_key] = rule.rule_value;
      });
      return config as unknown as RulesConfig;
    },
  });

  // Fetch salary records
  const { data: salaryRecords, isLoading: isLoadingSalaryRecords } = useQuery({
    queryKey: ['salary-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SalaryRecord[];
    },
  });

  const calculateLateDeduction = (lateMinutes: number, dailySalary: number): number => {
    if (!rulesConfig?.late_policy) return 0;
    
    for (const tier of rulesConfig.late_policy.tiers) {
      const maxMinutes = tier.max_minutes ?? Infinity;
      if (lateMinutes >= tier.min_minutes && lateMinutes <= maxMinutes) {
        if (tier.deduction_type === 'half_day') {
          return dailySalary / 2;
        } else if (tier.deduction_type === 'full_day') {
          return dailySalary;
        }
        return tier.deduction || 0;
      }
    }
    return 0;
  };

  const calculateExtraWorkCompensation = (hours: number): number => {
    if (!rulesConfig?.extra_work_policy) return 0;
    
    const tier = rulesConfig.extra_work_policy.tiers.find(t => t.hours === hours);
    return tier?.compensation || 0;
  };

  const calculateSalary = async (
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalculatedSalary | null> => {
    const profile = profiles?.find(p => p.user_id === userId);
    if (!profile || !rulesConfig) return null;

    const baseSalary = profile.monthly_salary || 0;
    const workingDaysPerMonth = 26; // From salary_settings
    const dailySalary = baseSalary / workingDaysPerMonth;

    // Fetch attendance for period
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', periodStart.toISOString().split('T')[0])
      .lte('date', periodEnd.toISOString().split('T')[0]);

    const attendance = (attendanceData || []) as Attendance[];

    // Fetch approved leaves for period
    const { data: leavesData } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('start_date', periodStart.toISOString().split('T')[0])
      .lte('end_date', periodEnd.toISOString().split('T')[0]);

    const leaves = (leavesData || []) as Leave[];

    // Fetch approved extra work for period
    const { data: extraWorkData } = await supabase
      .from('extra_work')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('work_date', periodStart.toISOString().split('T')[0])
      .lte('work_date', periodEnd.toISOString().split('T')[0]);

    const extraWork = (extraWorkData || []) as ExtraWork[];

    // Calculate deductions
    let lateDeductions = 0;
    let leaveDeductions = 0;
    let leavePenalties = 0;
    let todPenalties = 0;
    let eodPenalties = 0;
    let extraWorkAdditions = 0;

    const breakdown: SalaryBreakdown = {
      attendance_days: attendance.length,
      working_days: workingDaysPerMonth,
      late_days: [],
      leave_days: [],
      missing_tod_days: [],
      missing_eod_days: [],
      extra_work_entries: [],
    };

    // Process attendance
    for (const record of attendance) {
      // Late deductions
      if (record.is_late && record.late_minutes && record.late_minutes > 0) {
        const deduction = calculateLateDeduction(record.late_minutes, dailySalary);
        lateDeductions += deduction;
        breakdown.late_days.push({
          date: record.date,
          minutes: record.late_minutes,
          deduction,
        });
      }

      // TOD penalties
      if (!record.tod_submitted) {
        todPenalties += rulesConfig.reporting_policy.missing_tod_penalty;
        breakdown.missing_tod_days.push(record.date);
      }

      // EOD penalties
      if (!record.eod_submitted) {
        eodPenalties += rulesConfig.reporting_policy.missing_eod_penalty;
        breakdown.missing_eod_days.push(record.date);
      }
    }

    // Process leaves
    for (const leave of leaves) {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let deduction = 0;
      let penalty = 0;

      if (leave.leave_type === 'half_day') {
        deduction = dailySalary / 2;
        if (!leave.has_advance_notice) {
          penalty = rulesConfig.leave_policy.penalty_without_notice;
        }
      } else {
        deduction = dailySalary * days;
        if (!leave.has_advance_notice) {
          penalty = rulesConfig.leave_policy.penalty_without_notice * days;
        }
      }

      leaveDeductions += deduction;
      leavePenalties += penalty;

      breakdown.leave_days.push({
        date: leave.start_date,
        type: leave.leave_type,
        deduction,
        penalty,
      });
    }

    // Process extra work
    for (const ew of extraWork) {
      const compensation = ew.compensation_amount || calculateExtraWorkCompensation(ew.hours);
      extraWorkAdditions += compensation;
      breakdown.extra_work_entries.push({
        date: ew.work_date,
        hours: ew.hours,
        compensation,
      });
    }

    const netSalary = baseSalary 
      - lateDeductions 
      - leaveDeductions 
      - leavePenalties 
      - todPenalties 
      - eodPenalties 
      + extraWorkAdditions;

    return {
      user_id: userId,
      profile,
      base_salary: baseSalary,
      late_deductions: lateDeductions,
      leave_deductions: leaveDeductions,
      leave_penalties: leavePenalties,
      tod_penalties: todPenalties,
      eod_penalties: eodPenalties,
      extra_work_additions: extraWorkAdditions,
      net_salary: Math.max(0, netSalary),
      breakdown,
    };
  };

  const generateSalaries = async (
    userIds: string[],
    periodStart: Date,
    periodEnd: Date
  ) => {
    setIsCalculating(true);
    const results: CalculatedSalary[] = [];

    try {
      for (const userId of userIds) {
        const salary = await calculateSalary(userId, periodStart, periodEnd);
        if (salary) {
          results.push(salary);
        }
      }

      return results;
    } finally {
      setIsCalculating(false);
    }
  };

  const saveSalaryRecordMutation = useMutation({
    mutationFn: async (salary: CalculatedSalary & { period_start: string; period_end: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('salary_records')
        .insert({
          user_id: salary.user_id,
          period_start: salary.period_start,
          period_end: salary.period_end,
          base_salary: salary.base_salary,
          late_deductions: salary.late_deductions,
          leave_deductions: salary.leave_deductions,
          leave_penalties: salary.leave_penalties,
          tod_penalties: salary.tod_penalties,
          eod_penalties: salary.eod_penalties,
          extra_work_additions: salary.extra_work_additions,
          net_salary: salary.net_salary,
          breakdown: salary.breakdown as unknown as Database['public']['Tables']['salary_records']['Insert']['breakdown'],
          generated_by: user?.id,
          is_finalized: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast({
        title: 'Salary record saved',
        description: 'The salary record has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const finalizeSalaryMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('salary_records')
        .update({ is_finalized: true })
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast({
        title: 'Salary finalized',
        description: 'The salary record has been finalized.',
      });
    },
  });

  return {
    profiles,
    rulesConfig,
    salaryRecords,
    isLoadingSalaryRecords,
    isCalculating,
    generateSalaries,
    saveSalaryRecord: saveSalaryRecordMutation.mutate,
    finalizeSalary: finalizeSalaryMutation.mutate,
  };
}
