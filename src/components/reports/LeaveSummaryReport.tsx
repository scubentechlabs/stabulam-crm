import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CheckCircle, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Timer
} from 'lucide-react';
import { useLeaveStats } from '@/hooks/useLeaveStats';
import { LeaveCharts } from './LeaveCharts';
import { LeaveStatsTable } from './LeaveStatsTable';
import { DateRangePicker } from './DateRangePicker';

export function LeaveSummaryReport() {
  const { 
    employeeStats, 
    dailyTrends, 
    leaveTypeDistribution, 
    statusDistribution,
    summary, 
    isLoading,
    dateRange,
    setDateRange
  } = useLeaveStats();

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border bg-card">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const approvalRate = summary.totalLeaveRequests > 0 
    ? Math.round((summary.approvedLeaves / summary.totalLeaveRequests) * 100)
    : 0;

  const kpiCards = [
    {
      title: 'Total Requests',
      value: summary.totalLeaveRequests,
      suffix: '',
      trend: `Avg ${summary.avgLeavesPerEmployee}`,
      trendUp: true,
      trendLabel: 'per employee',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Approved',
      value: summary.approvedLeaves,
      suffix: '',
      trend: `${approvalRate}%`,
      trendUp: true,
      trendLabel: 'approval rate',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Advance Notice',
      value: summary.advanceNoticeRate,
      suffix: '%',
      trend: '+5%',
      trendUp: true,
      trendLabel: 'requests with 48h+ notice',
      icon: Timer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Penalties',
      value: formatCurrency(summary.totalPenalties),
      suffix: '',
      trend: `${summary.pendingLeaves} pending`,
      trendUp: false,
      trendLabel: 'requests pending',
      icon: IndianRupee,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Leave Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Leave patterns and usage trends
          </p>
        </div>
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />
      </div>

      {/* KPI Cards - CRM Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {kpi.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight">
                  {kpi.value}{kpi.suffix}
                </p>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{kpi.trendLabel}</p>
            </CardContent>
          </Card>
        ))}
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
