import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Check, 
  Clock,
  User
} from 'lucide-react';
import { useSalaryCalculator } from '@/hooks/useSalaryCalculator';

export function SalaryRecordsList() {
  const { salaryRecords, isLoadingSalaryRecords, profiles, finalizeSalary } = useSalaryCalculator();

  const getProfileName = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    return profile?.full_name || 'Unknown';
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  if (isLoadingSalaryRecords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!salaryRecords || salaryRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No salary records yet</p>
            <p className="text-sm">Generate salaries to see records here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Salary Records</CardTitle>
        <CardDescription>Previously generated salary slips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {salaryRecords.map(record => (
          <div 
            key={record.id} 
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{getProfileName(record.user_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.period_start), 'MMM d')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="font-semibold text-lg">{formatCurrency(record.net_salary)}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {formatCurrency(record.base_salary)}
                  </p>
                </div>
                
                {record.is_finalized ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="h-3 w-3 mr-1" />
                    Finalized
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => finalizeSalary(record.id)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Finalize
                  </Button>
                )}
              </div>
            </div>

            {/* Quick deduction summary */}
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 text-xs">
              {record.late_deductions !== null && record.late_deductions > 0 && (
                <Badge variant="secondary">Late: -{formatCurrency(record.late_deductions)}</Badge>
              )}
              {record.leave_deductions !== null && record.leave_deductions > 0 && (
                <Badge variant="secondary">Leave: -{formatCurrency(record.leave_deductions)}</Badge>
              )}
              {record.tod_penalties !== null && record.tod_penalties > 0 && (
                <Badge variant="secondary">TOD: -{formatCurrency(record.tod_penalties)}</Badge>
              )}
              {record.eod_penalties !== null && record.eod_penalties > 0 && (
                <Badge variant="secondary">EOD: -{formatCurrency(record.eod_penalties)}</Badge>
              )}
              {record.extra_work_additions !== null && record.extra_work_additions > 0 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Extra: +{formatCurrency(record.extra_work_additions)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
