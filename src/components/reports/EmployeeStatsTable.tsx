import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface EmployeeStats {
  userId: string;
  fullName: string;
  department: string | null;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalWorkHours: number;
  averageWorkHours: number;
  onTimePercentage: number;
}

interface EmployeeStatsTableProps {
  employees: EmployeeStats[];
}

export function EmployeeStatsTable({ employees }: EmployeeStatsTableProps) {
  const sortedEmployees = [...employees].sort((a, b) => {
    const aAttendance = a.totalDays > 0 ? (a.presentDays / a.totalDays) * 100 : 0;
    const bAttendance = b.totalDays > 0 ? (b.presentDays / b.totalDays) * 100 : 0;
    return bAttendance - aAttendance;
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getOnTimeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Attendance Details</CardTitle>
        <CardDescription>Individual attendance statistics for the selected month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Work Hours</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
                <TableHead>On-Time Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => {
                const attendancePercentage = employee.totalDays > 0
                  ? Math.round((employee.presentDays / employee.totalDays) * 100)
                  : 0;

                return (
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
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {employee.presentDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {employee.absentDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {employee.lateDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <span className="font-medium">{employee.totalWorkHours}h</span>
                        <span className="text-muted-foreground text-xs block">
                          avg {employee.averageWorkHours}h/day
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getAttendanceColor(attendancePercentage)}`}>
                        {attendancePercentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div 
                            className={`h-full transition-all ${getOnTimeColor(employee.onTimePercentage)}`}
                            style={{ width: `${employee.onTimePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">
                          {employee.onTimePercentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
