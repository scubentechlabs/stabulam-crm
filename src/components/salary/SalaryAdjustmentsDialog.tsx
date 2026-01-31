import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, Timer, Gift, Minus, Calculator, Loader2 } from 'lucide-react';
import type { AttendanceSummary } from './types';

export interface SalaryAdjustments {
  includeLate: boolean;
  lateRuleType: 'per_late' | 'per_minute' | 'slab_based';
  lateRuleValue: number;
  
  includeOvertime: boolean;
  overtimeRate: number;
  
  includeBonus: boolean;
  bonusAmount: number;
  bonusNote: string;
  
  includeCustomDeduction: boolean;
  customDeductionAmount: number;
  customDeductionNote: string;
}

interface SalaryAdjustmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  monthYear: string;
  attendanceSummary: AttendanceSummary;
  baseSalary: number;
  onGenerate: (adjustments: SalaryAdjustments) => void;
  isGenerating?: boolean;
}

export function SalaryAdjustmentsDialog({
  open,
  onOpenChange,
  employeeName,
  monthYear,
  attendanceSummary,
  baseSalary,
  onGenerate,
  isGenerating = false,
}: SalaryAdjustmentsDialogProps) {
  const [adjustments, setAdjustments] = useState<SalaryAdjustments>({
    includeLate: false,
    lateRuleType: 'per_late',
    lateRuleValue: 0,
    includeOvertime: false,
    overtimeRate: 0,
    includeBonus: false,
    bonusAmount: 0,
    bonusNote: '',
    includeCustomDeduction: false,
    customDeductionAmount: 0,
    customDeductionNote: '',
  });

  const updateAdjustment = <K extends keyof SalaryAdjustments>(
    key: K,
    value: SalaryAdjustments[K]
  ) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  // Calculate preview amounts
  const calculateLateDeduction = () => {
    if (!adjustments.includeLate || adjustments.lateRuleValue <= 0) return 0;
    
    if (adjustments.lateRuleType === 'per_late') {
      return attendanceSummary.lateArrivalsCount * adjustments.lateRuleValue;
    } else if (adjustments.lateRuleType === 'per_minute') {
      return attendanceSummary.totalLateMinutes * adjustments.lateRuleValue;
    }
    // Slab-based: simplified calculation
    const minutes = attendanceSummary.totalLateMinutes;
    if (minutes <= 30) return 0;
    if (minutes <= 60) return 50;
    if (minutes <= 120) return 150;
    return 300;
  };

  const calculateOvertimePay = () => {
    if (!adjustments.includeOvertime || adjustments.overtimeRate <= 0) return 0;
    return attendanceSummary.overtimeHours * adjustments.overtimeRate;
  };

  const lateDeduction = calculateLateDeduction();
  const overtimePay = calculateOvertimePay();
  const bonus = adjustments.includeBonus ? adjustments.bonusAmount : 0;
  const customDeduction = adjustments.includeCustomDeduction ? adjustments.customDeductionAmount : 0;
  
  const previewNetSalary = baseSalary + overtimePay + bonus - lateDeduction - customDeduction;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleGenerate = () => {
    onGenerate(adjustments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Adjustments Checklist
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {employeeName} • {monthYear}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1: Attendance-linked Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Attendance-linked Items
            </h3>

            {/* Late Coming Deduction */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="includeLate"
                  checked={adjustments.includeLate}
                  onCheckedChange={(checked) => updateAdjustment('includeLate', !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeLate" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-4 w-4 text-destructive" />
                    Late Coming Deduction
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Late arrivals: <strong>{attendanceSummary.lateArrivalsCount}</strong> | 
                    Late minutes: <strong>{attendanceSummary.totalLateMinutes}</strong>
                  </p>
                </div>
              </div>

              {adjustments.includeLate && (
                <div className="ml-7 space-y-3 animate-fade-in">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Rule Type</Label>
                      <Select
                        value={adjustments.lateRuleType}
                        onValueChange={(v) => updateAdjustment('lateRuleType', v as SalaryAdjustments['lateRuleType'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="per_late">Per Late (₹)</SelectItem>
                          <SelectItem value="per_minute">Per Minute (₹)</SelectItem>
                          <SelectItem value="slab_based">Slab Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {adjustments.lateRuleType !== 'slab_based' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={adjustments.lateRuleValue}
                          onChange={(e) => updateAdjustment('lateRuleValue', parseFloat(e.target.value) || 0)}
                          placeholder="Enter amount"
                        />
                      </div>
                    )}
                  </div>
                  {adjustments.lateRuleType === 'slab_based' && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Slab rates:</strong> 0-30 min = ₹0, 31-60 min = ₹50, 61-120 min = ₹150, 120+ min = ₹300
                    </div>
                  )}
                  <div className="text-sm font-medium text-destructive">
                    Deduction Preview: -{formatCurrency(lateDeduction)}
                  </div>
                </div>
              )}
            </div>

            {/* Overtime Pay */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="includeOvertime"
                  checked={adjustments.includeOvertime}
                  onCheckedChange={(checked) => updateAdjustment('includeOvertime', !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeOvertime" className="flex items-center gap-2 cursor-pointer">
                    <Timer className="h-4 w-4 text-green-600" />
                    Overtime Pay
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overtime hours: <strong>{attendanceSummary.overtimeHours.toFixed(1)}</strong>
                  </p>
                </div>
              </div>

              {adjustments.includeOvertime && (
                <div className="ml-7 space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <Label className="text-xs">Overtime Rate (₹/hour)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={adjustments.overtimeRate}
                      onChange={(e) => updateAdjustment('overtimeRate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter rate per hour"
                      className="max-w-xs"
                    />
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Overtime Pay Preview: +{formatCurrency(overtimePay)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 2: Manual Additions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Manual Adjustments
            </h3>

            {/* Extra Bonus */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="includeBonus"
                  checked={adjustments.includeBonus}
                  onCheckedChange={(checked) => updateAdjustment('includeBonus', !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeBonus" className="flex items-center gap-2 cursor-pointer">
                    <Gift className="h-4 w-4 text-primary" />
                    Extra Bonus
                  </Label>
                </div>
              </div>

              {adjustments.includeBonus && (
                <div className="ml-7 space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <Label className="text-xs">Bonus Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={adjustments.bonusAmount}
                      onChange={(e) => updateAdjustment('bonusAmount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter bonus amount"
                      className="max-w-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note (optional)</Label>
                    <Textarea
                      value={adjustments.bonusNote}
                      onChange={(e) => updateAdjustment('bonusNote', e.target.value)}
                      placeholder="e.g., Diwali bonus, Performance reward"
                      className="h-16 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Deduction */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="includeCustomDeduction"
                  checked={adjustments.includeCustomDeduction}
                  onCheckedChange={(checked) => updateAdjustment('includeCustomDeduction', !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeCustomDeduction" className="flex items-center gap-2 cursor-pointer">
                    <Minus className="h-4 w-4 text-destructive" />
                    Custom Deduction
                  </Label>
                </div>
              </div>

              {adjustments.includeCustomDeduction && (
                <div className="ml-7 space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <Label className="text-xs">Deduction Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={adjustments.customDeductionAmount}
                      onChange={(e) => updateAdjustment('customDeductionAmount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter deduction amount"
                      className="max-w-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note (optional)</Label>
                    <Textarea
                      value={adjustments.customDeductionNote}
                      onChange={(e) => updateAdjustment('customDeductionNote', e.target.value)}
                      placeholder="e.g., Advance repayment, Penalty"
                      className="h-16 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Preview Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Salary Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Base Salary:</span>
              <span className="text-right font-medium">{formatCurrency(baseSalary)}</span>
              
              {overtimePay > 0 && (
                <>
                  <span className="text-muted-foreground">+ Overtime:</span>
                  <span className="text-right font-medium text-green-600">+{formatCurrency(overtimePay)}</span>
                </>
              )}
              
              {bonus > 0 && (
                <>
                  <span className="text-muted-foreground">+ Bonus:</span>
                  <span className="text-right font-medium text-green-600">+{formatCurrency(bonus)}</span>
                </>
              )}
              
              {lateDeduction > 0 && (
                <>
                  <span className="text-muted-foreground">- Late Deduction:</span>
                  <span className="text-right font-medium text-destructive">-{formatCurrency(lateDeduction)}</span>
                </>
              )}
              
              {customDeduction > 0 && (
                <>
                  <span className="text-muted-foreground">- Custom Deduction:</span>
                  <span className="text-right font-medium text-destructive">-{formatCurrency(customDeduction)}</span>
                </>
              )}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Net Payable Salary:</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(Math.max(0, previewNetSalary))}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Generate Final Salary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
