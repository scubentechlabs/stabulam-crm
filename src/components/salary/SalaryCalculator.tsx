import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, getDay, eachDayOfInterval, isWeekend } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  User, 
  Calendar, 
  Clock, 
  Timer,
  Briefcase,
  TrendingDown,
  CheckCircle2,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SalaryAdjustmentsDialog, type SalaryAdjustments } from './SalaryAdjustmentsDialog';
import { SalaryPreviewDialog } from './SalaryPreviewDialog';
import type { AttendanceSummary, GeneratedSalary } from './types';
import { Input } from '@/components/ui/input';

export function SalaryCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return format(lastMonth, 'yyyy-MM');
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAdjustmentsDialog, setShowAdjustmentsDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSalary, setGeneratedSalary] = useState<GeneratedSalary | null>(null);

  // Fetch all active profiles
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['all-profiles-salary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Filter profiles by search term
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchTerm) return profiles;
    const term = searchTerm.toLowerCase();
    return profiles.filter(p => 
      p.full_name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.department?.toLowerCase().includes(term)
    );
  }, [profiles, searchTerm]);

  const selectedProfile = profiles?.find(p => p.user_id === selectedUserId);

  // Month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return options;
  }, []);

  const monthYearLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return format(new Date(year, month - 1), 'MMMM yyyy');
  }, [selectedMonth]);

  // Fetch attendance summary for selected user and month
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance-summary', selectedUserId, selectedMonth],
    queryFn: async (): Promise<AttendanceSummary> => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const periodStart = startOfMonth(new Date(year, month - 1));
      const periodEnd = endOfMonth(new Date(year, month - 1));

      // Fetch attendance records
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', selectedUserId)
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Fetch approved leaves
      const { data: leaves } = await supabase
        .from('leaves')
        .select('*')
        .eq('user_id', selectedUserId)
        .eq('status', 'approved')
        .gte('start_date', format(periodStart, 'yyyy-MM-dd'))
        .lte('end_date', format(periodEnd, 'yyyy-MM-dd'));

      // Calculate working days (excluding weekends)
      const allDays = eachDayOfInterval({ start: periodStart, end: periodEnd });
      const workingDays = allDays.filter(d => !isWeekend(d)).length;

      // Calculate summary
      const presentDays = attendance?.length || 0;
      const paidLeaves = leaves?.length || 0;
      const absentDays = Math.max(0, workingDays - presentDays - paidLeaves);

      const lateRecords = attendance?.filter(a => a.is_late) || [];
      const lateArrivalsCount = lateRecords.length;
      const totalLateMinutes = lateRecords.reduce((sum, a) => sum + (a.late_minutes || 0), 0);

      // Calculate overtime (hours worked beyond 8 per day)
      let overtimeMinutes = 0;
      for (const record of attendance || []) {
        if (record.clock_in_time && record.clock_out_time) {
          const clockIn = new Date(record.clock_in_time);
          const clockOut = new Date(record.clock_out_time);
          const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          if (hoursWorked > 9) {
            overtimeMinutes += (hoursWorked - 9) * 60;
          }
        }
      }

      return {
        workingDays,
        presentDays,
        absentDays,
        paidLeaves,
        lateArrivalsCount,
        totalLateMinutes,
        overtimeHours: Math.round(overtimeMinutes / 60 * 10) / 10,
      };
    },
    enabled: !!selectedUserId && !!selectedMonth,
  });

  // Check for existing salary record
  const { data: existingSalary } = useQuery({
    queryKey: ['existing-salary', selectedUserId, selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const periodStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const periodEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .eq('user_id', selectedUserId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedUserId && !!selectedMonth,
  });

  const handleGenerateClick = () => {
    if (!selectedUserId || !selectedProfile) {
      toast({
        title: 'Select Employee',
        description: 'Please select an employee to generate salary',
        variant: 'destructive',
      });
      return;
    }

    if (existingSalary) {
      toast({
        title: 'Salary Already Generated',
        description: `Salary for ${selectedProfile.full_name} for ${monthYearLabel} already exists.`,
        variant: 'destructive',
      });
      return;
    }

    setShowAdjustmentsDialog(true);
  };

  const handleGenerateFinalSalary = async (adjustments: SalaryAdjustments) => {
    if (!selectedProfile || !attendanceSummary) return;
    
    setIsGenerating(true);
    
    try {
      const baseSalary = selectedProfile.monthly_salary || 0;
      
      // Calculate late deduction
      let lateDeduction = 0;
      if (adjustments.includeLate && adjustments.lateRuleValue > 0) {
        if (adjustments.lateRuleType === 'per_late') {
          lateDeduction = attendanceSummary.lateArrivalsCount * adjustments.lateRuleValue;
        } else if (adjustments.lateRuleType === 'per_minute') {
          lateDeduction = attendanceSummary.totalLateMinutes * adjustments.lateRuleValue;
        } else {
          // Slab-based
          const minutes = attendanceSummary.totalLateMinutes;
          if (minutes <= 30) lateDeduction = 0;
          else if (minutes <= 60) lateDeduction = 50;
          else if (minutes <= 120) lateDeduction = 150;
          else lateDeduction = 300;
        }
      }

      // Calculate overtime pay
      let overtimeAmount = 0;
      if (adjustments.includeOvertime && adjustments.overtimeRate > 0) {
        overtimeAmount = attendanceSummary.overtimeHours * adjustments.overtimeRate;
      }

      // Bonus and custom deduction
      const bonusAmount = adjustments.includeBonus ? adjustments.bonusAmount : 0;
      const customDeductionAmount = adjustments.includeCustomDeduction ? adjustments.customDeductionAmount : 0;

      // Net salary
      const netSalary = baseSalary + overtimeAmount + bonusAmount - lateDeduction - customDeductionAmount;

      const [year, month] = selectedMonth.split('-').map(Number);
      const periodStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const periodEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      const salary: GeneratedSalary = {
        userId: selectedUserId,
        employeeName: selectedProfile.full_name,
        monthYear: monthYearLabel,
        periodStart,
        periodEnd,
        baseSalary,
        includedLate: adjustments.includeLate,
        lateRuleType: adjustments.lateRuleType,
        lateRuleValue: adjustments.lateRuleValue,
        lateArrivalsCount: attendanceSummary.lateArrivalsCount,
        totalLateMinutes: attendanceSummary.totalLateMinutes,
        lateDeduction,
        includedOvertime: adjustments.includeOvertime,
        overtimeHours: attendanceSummary.overtimeHours,
        overtimeRate: adjustments.overtimeRate,
        overtimeAmount,
        includedBonus: adjustments.includeBonus,
        bonusAmount,
        bonusNote: adjustments.bonusNote,
        includedCustomDeduction: adjustments.includeCustomDeduction,
        customDeductionAmount,
        customDeductionNote: adjustments.customDeductionNote,
        netSalary: Math.max(0, netSalary),
      };

      setGeneratedSalary(salary);
      setShowAdjustmentsDialog(false);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Error generating salary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate salary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSalaryMutation = useMutation({
    mutationFn: async (salary: GeneratedSalary) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Using type assertion since new columns may not be in generated types yet
      const insertData = {
        user_id: salary.userId,
        period_start: salary.periodStart,
        period_end: salary.periodEnd,
        base_salary: salary.baseSalary,
        late_deductions: salary.lateDeduction,
        net_salary: salary.netSalary,
        other_additions: salary.overtimeAmount + salary.bonusAmount,
        other_deductions: salary.customDeductionAmount,
        generated_by: user?.id,
        is_finalized: false,
        // Store detailed breakdown in the existing breakdown JSONB column
        breakdown: {
          month_year: salary.monthYear,
          included_late: salary.includedLate,
          late_rule_type: salary.lateRuleType,
          late_rule_value: salary.lateRuleValue,
          late_arrivals_count: salary.lateArrivalsCount,
          total_late_minutes: salary.totalLateMinutes,
          included_overtime: salary.includedOvertime,
          overtime_hours: salary.overtimeHours,
          overtime_rate: salary.overtimeRate,
          overtime_amount: salary.overtimeAmount,
          included_bonus: salary.includedBonus,
          bonus_amount: salary.bonusAmount,
          bonus_note: salary.bonusNote,
          included_custom_deduction: salary.includedCustomDeduction,
          custom_deduction_amount: salary.customDeductionAmount,
          custom_deduction_note: salary.customDeductionNote,
        },
      };

      const { error } = await supabase
        .from('salary_records')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      queryClient.invalidateQueries({ queryKey: ['existing-salary', selectedUserId, selectedMonth] });
      toast({
        title: 'Salary Saved',
        description: 'Salary record has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save salary record.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSalary = async () => {
    if (!generatedSalary) return;
    await saveSalaryMutation.mutateAsync(generatedSalary);
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Calculator
          </CardTitle>
          <CardDescription>
            Select an employee and month to generate salary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Employee
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 mb-2"
                />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-[300px]">
                  {isLoadingProfiles ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                  ) : filteredProfiles.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No employees found</div>
                  ) : (
                    filteredProfiles.map(profile => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        <div className="flex flex-col">
                          <span>{profile.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {profile.department || 'No dept'} • ₹{profile.monthly_salary?.toLocaleString() || 0}/mo
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Salary Month
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerateClick} 
            disabled={!selectedUserId}
            className="w-full sm:w-auto"
            size="lg"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Generate Salary
          </Button>
        </CardContent>
      </Card>

      {/* Attendance Summary Preview */}
      {selectedUserId && selectedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Attendance Summary
            </CardTitle>
            <CardDescription>
              {selectedProfile.full_name} • {monthYearLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingSalary && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Salary already generated</p>
                  <p className="text-sm">Net salary: ₹{existingSalary.net_salary.toLocaleString()}</p>
                </div>
              </div>
            )}

            {isLoadingAttendance ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : attendanceSummary ? (
              <div className="space-y-4">
                {/* Base Salary */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Base Salary</p>
                  <p className="text-2xl font-bold">₹{(selectedProfile.monthly_salary || 0).toLocaleString()}</p>
                </div>

                {/* Attendance Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Working Days
                    </p>
                    <p className="text-xl font-semibold">{attendanceSummary.workingDays}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Present
                    </p>
                    <p className="text-xl font-semibold text-green-600">{attendanceSummary.presentDays}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> Absent
                    </p>
                    <p className="text-xl font-semibold text-destructive">{attendanceSummary.absentDays}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Paid Leaves</p>
                    <p className="text-xl font-semibold">{attendanceSummary.paidLeaves}</p>
                  </div>
                </div>

                {/* Late & Overtime */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg border-amber-200 bg-amber-50/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Late Arrivals
                    </p>
                    <p className="text-xl font-semibold">
                      {attendanceSummary.lateArrivalsCount}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({attendanceSummary.totalLateMinutes} min total)
                      </span>
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg border-green-200 bg-green-50/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="h-3 w-3" /> Overtime Hours
                    </p>
                    <p className="text-xl font-semibold">{attendanceSummary.overtimeHours.toFixed(1)} hrs</p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Adjustments Dialog */}
      {selectedProfile && attendanceSummary && (
        <SalaryAdjustmentsDialog
          open={showAdjustmentsDialog}
          onOpenChange={setShowAdjustmentsDialog}
          employeeName={selectedProfile.full_name}
          monthYear={monthYearLabel}
          attendanceSummary={attendanceSummary}
          baseSalary={selectedProfile.monthly_salary || 0}
          onGenerate={handleGenerateFinalSalary}
          isGenerating={isGenerating}
        />
      )}

      {/* Preview Dialog */}
      <SalaryPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        salary={generatedSalary}
        onSave={handleSaveSalary}
        isSaving={saveSalaryMutation.isPending}
      />
    </div>
  );
}
