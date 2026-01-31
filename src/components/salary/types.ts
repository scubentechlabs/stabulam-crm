export interface AttendanceSummary {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeaves: number;
  lateArrivalsCount: number;
  totalLateMinutes: number;
  overtimeHours: number;
}

export interface GeneratedSalary {
  userId: string;
  employeeName: string;
  monthYear: string;
  periodStart: string;
  periodEnd: string;
  slipNumber?: string;
  
  baseSalary: number;
  
  // Late deduction
  includedLate: boolean;
  lateRuleType: string;
  lateRuleValue: number;
  lateArrivalsCount: number;
  totalLateMinutes: number;
  lateDeduction: number;
  
  // Overtime
  includedOvertime: boolean;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  
  // Bonus
  includedBonus: boolean;
  bonusAmount: number;
  bonusNote: string;
  
  // Custom deduction
  includedCustomDeduction: boolean;
  customDeductionAmount: number;
  customDeductionNote: string;
  
  netSalary: number;
}
