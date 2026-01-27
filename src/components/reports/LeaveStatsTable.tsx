import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeeLeaveStats } from '@/hooks/useLeaveStats';

interface LeaveStatsTableProps {
  employeeStats: EmployeeLeaveStats[];
}

export function LeaveStatsTable({ employeeStats }: LeaveStatsTableProps) {
  const sortedStats = [...employeeStats].sort((a, b) => b.totalLeaves - a.totalLeaves);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Leave Statistics</CardTitle>
        <CardDescription>Detailed leave breakdown per employee</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Approved</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">Rejected</TableHead>
                <TableHead className="text-center">Days Off</TableHead>
                <TableHead className="text-center">Leave Types</TableHead>
                <TableHead className="text-center">Advance Notice</TableHead>
                <TableHead className="text-right">Penalties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No leave data available for this period
                  </TableCell>
                </TableRow>
              ) : (
                sortedStats.map((employee) => (
                  <TableRow key={employee.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{employee.totalLeaves}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        {employee.approvedLeaves}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{employee.pendingLeaves}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                        {employee.rejectedLeaves}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {employee.totalDaysOff}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {employee.halfDayLeaves > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ½D: {employee.halfDayLeaves}
                          </Badge>
                        )}
                        {employee.fullDayLeaves > 0 && (
                          <Badge variant="outline" className="text-xs">
                            1D: {employee.fullDayLeaves}
                          </Badge>
                        )}
                        {employee.multipleDayLeaves > 0 && (
                          <Badge variant="outline" className="text-xs">
                            M: {employee.multipleDayLeaves}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative h-2 w-16 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ 
                              width: `${employee.totalLeaves > 0 
                                ? (employee.withAdvanceNotice / employee.totalLeaves) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {employee.withAdvanceNotice}/{employee.totalLeaves}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {employee.totalPenalties > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(employee.totalPenalties)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
