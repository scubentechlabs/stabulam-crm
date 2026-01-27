import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Save, 
  TrendingDown, 
  TrendingUp,
  Clock,
  Calendar,
  FileText,
  Briefcase
} from 'lucide-react';
import type { CalculatedSalary } from '@/hooks/useSalaryCalculator';

interface SalaryPreviewProps {
  salary: CalculatedSalary;
  onSave: () => void;
}

export function SalaryPreview({ salary, onSave }: SalaryPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalDeductions = 
    salary.late_deductions + 
    salary.leave_deductions + 
    salary.leave_penalties + 
    salary.tod_penalties + 
    salary.eod_penalties;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{salary.profile.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {salary.profile.department || 'No department'} • {salary.profile.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(salary.net_salary)}</p>
            <p className="text-sm text-muted-foreground">Net Salary</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Base Salary</p>
            <p className="font-semibold">{formatCurrency(salary.base_salary)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              Deductions
            </p>
            <p className="font-semibold text-destructive">-{formatCurrency(totalDeductions)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Additions
            </p>
            <p className="font-semibold text-green-600">+{formatCurrency(salary.extra_work_additions)}</p>
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Late
            </span>
            <span className="font-medium text-destructive">-{formatCurrency(salary.late_deductions)}</span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Leaves
            </span>
            <span className="font-medium text-destructive">-{formatCurrency(salary.leave_deductions)}</span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-muted-foreground">Leave Penalty</span>
            <span className="font-medium text-destructive">-{formatCurrency(salary.leave_penalties)}</span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> TOD
            </span>
            <span className="font-medium text-destructive">-{formatCurrency(salary.tod_penalties)}</span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> EOD
            </span>
            <span className="font-medium text-destructive">-{formatCurrency(salary.eod_penalties)}</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>View Detailed Breakdown</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Attendance Summary */}
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Attendance
              </h4>
              <p className="text-sm text-muted-foreground">
                {salary.breakdown.attendance_days} days present out of {salary.breakdown.working_days} working days
              </p>
            </div>

            {/* Late Days */}
            {salary.breakdown.late_days.length > 0 && (
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Late Arrivals ({salary.breakdown.late_days.length})</h4>
                <div className="space-y-1">
                  {salary.breakdown.late_days.map((day, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{day.date}</span>
                      <span>{day.minutes} min late → -{formatCurrency(day.deduction)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leave Days */}
            {salary.breakdown.leave_days.length > 0 && (
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Leaves ({salary.breakdown.leave_days.length})</h4>
                <div className="space-y-1">
                  {salary.breakdown.leave_days.map((day, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        {day.date}
                        <Badge variant="outline" className="text-xs">{day.type}</Badge>
                      </span>
                      <span>
                        -{formatCurrency(day.deduction)}
                        {day.penalty > 0 && <span className="text-destructive"> + {formatCurrency(day.penalty)} penalty</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Reports */}
            {(salary.breakdown.missing_tod_days.length > 0 || salary.breakdown.missing_eod_days.length > 0) && (
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Missing Reports</h4>
                {salary.breakdown.missing_tod_days.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Missing TOD: {salary.breakdown.missing_tod_days.length} days
                  </p>
                )}
                {salary.breakdown.missing_eod_days.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Missing EOD: {salary.breakdown.missing_eod_days.length} days
                  </p>
                )}
              </div>
            )}

            {/* Extra Work */}
            {salary.breakdown.extra_work_entries.length > 0 && (
              <div className="p-3 border rounded-lg border-green-200 bg-green-50/50">
                <h4 className="font-medium mb-2 text-green-700">Extra Work Compensation</h4>
                <div className="space-y-1">
                  {salary.breakdown.extra_work_entries.map((entry, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{entry.date} ({entry.hours}h)</span>
                      <span className="text-green-600">+{formatCurrency(entry.compensation)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
