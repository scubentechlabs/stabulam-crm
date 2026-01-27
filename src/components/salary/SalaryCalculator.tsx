import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calculator, Users, Calendar } from 'lucide-react';
import { useSalaryCalculator, CalculatedSalary } from '@/hooks/useSalaryCalculator';
import { SalaryPreview } from './SalaryPreview';

export function SalaryCalculator() {
  const { profiles, isCalculating, generateSalaries, saveSalaryRecord } = useSalaryCalculator();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return format(lastMonth, 'yyyy-MM');
  });
  const [calculatedSalaries, setCalculatedSalaries] = useState<CalculatedSalary[]>([]);

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

  const handleSelectAll = () => {
    if (selectedUserIds.length === profiles?.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(profiles?.map(p => p.user_id) || []);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCalculate = async () => {
    if (selectedUserIds.length === 0) return;

    const [year, month] = selectedMonth.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    const results = await generateSalaries(selectedUserIds, periodStart, periodEnd);
    setCalculatedSalaries(results as CalculatedSalary[]);
  };

  const handleSave = (salary: CalculatedSalary) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    saveSalaryRecord({
      ...salary,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Salaries
          </CardTitle>
          <CardDescription>
            Select employees and period to calculate salaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Salary Period
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Employees
              </Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedUserIds.length === profiles?.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {profiles?.map(profile => (
                <div
                  key={profile.user_id}
                  className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={profile.user_id}
                    checked={selectedUserIds.includes(profile.user_id)}
                    onCheckedChange={() => handleUserToggle(profile.user_id)}
                  />
                  <label
                    htmlFor={profile.user_id}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-sm">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.department || 'No department'} • ₹{profile.monthly_salary?.toLocaleString() || 0}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={selectedUserIds.length === 0 || isCalculating}
            className="w-full sm:w-auto"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculating...' : `Calculate for ${selectedUserIds.length} Employee${selectedUserIds.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {calculatedSalaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Calculated Salaries</h2>
          {calculatedSalaries.map(salary => (
            <SalaryPreview 
              key={salary.user_id} 
              salary={salary} 
              onSave={() => handleSave(salary)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
