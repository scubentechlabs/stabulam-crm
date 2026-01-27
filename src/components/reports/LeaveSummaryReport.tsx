import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, IndianRupee } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { useLeaveStats } from '@/hooks/useLeaveStats';
import { LeaveCharts } from './LeaveCharts';
import { LeaveStatsTable } from './LeaveStatsTable';

export function LeaveSummaryReport() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { 
    employeeStats, 
    dailyTrends, 
    leaveTypeDistribution, 
    statusDistribution,
    summary, 
    isLoading 
  } = useLeaveStats(selectedMonth);

  const goToPreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));
  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Analysis</h2>
          <p className="text-muted-foreground">
            Leave patterns and usage trends for {format(selectedMonth, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(selectedMonth, 'MMMM yyyy')}</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              Avg {summary.avgLeavesPerEmployee} per employee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.approvedLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalLeaveRequests > 0 
                ? Math.round((summary.approvedLeaves / summary.totalLeaveRequests) * 100)
                : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advance Notice Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.advanceNoticeRate}%</div>
            <p className="text-xs text-muted-foreground">
              Requests with 48h+ notice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penalties</CardTitle>
            <IndianRupee className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalPenalties)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.pendingLeaves} pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <LeaveCharts 
        dailyTrends={dailyTrends}
        leaveTypeDistribution={leaveTypeDistribution}
        statusDistribution={statusDistribution}
        employeeStats={employeeStats}
      />

      {/* Employee Stats Table */}
      <LeaveStatsTable employeeStats={employeeStats} />
    </div>
  );
}
