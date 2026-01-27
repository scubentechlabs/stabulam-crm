import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface EmployeeTaskStats {
  userId: string;
  fullName: string;
  department: string | null;
  totalTodTasks: number;
  completedTodTasks: number;
  pendingTodTasks: number;
  todSubmissionRate: number;
  eodSubmittedDays: number;
  todSubmittedDays: number;
  workingDays: number;
  eodSubmissionRate: number;
}

interface TaskStatsTableProps {
  employees: EmployeeTaskStats[];
}

export function TaskStatsTable({ employees }: TaskStatsTableProps) {
  const sortedEmployees = [...employees].sort((a, b) => {
    const avgA = (a.todSubmissionRate + a.eodSubmissionRate) / 2;
    const avgB = (b.todSubmissionRate + b.eodSubmissionRate) / 2;
    return avgB - avgA;
  });

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRateBadgeVariant = (rate: number): "default" | "secondary" | "destructive" => {
    if (rate >= 90) return 'default';
    if (rate >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Task Details</CardTitle>
        <CardDescription>Individual task submission and completion statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Working Days</TableHead>
                <TableHead className="text-center">TOD Rate</TableHead>
                <TableHead className="text-center">EOD Rate</TableHead>
                <TableHead className="text-center">Tasks Created</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow key={employee.userId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{employee.fullName}</p>
                      {employee.department && (
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{employee.workingDays}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative h-2 w-16 overflow-hidden rounded-full bg-secondary">
                        <div 
                          className={`h-full transition-all ${getRateColor(employee.todSubmissionRate)}`}
                          style={{ width: `${employee.todSubmissionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10">{employee.todSubmissionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative h-2 w-16 overflow-hidden rounded-full bg-secondary">
                        <div 
                          className={`h-full transition-all ${getRateColor(employee.eodSubmissionRate)}`}
                          style={{ width: `${employee.eodSubmissionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10">{employee.eodSubmissionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {employee.totalTodTasks}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {employee.completedTodTasks}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={employee.pendingTodTasks > 0 ? 'destructive' : 'outline'}
                      className={employee.pendingTodTasks === 0 ? 'bg-muted' : ''}
                    >
                      {employee.pendingTodTasks}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {sortedEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No employee data available for this month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
