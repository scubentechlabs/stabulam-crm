import { 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { AttendanceCharts } from './AttendanceCharts';
import { EmployeeStatsTable } from './EmployeeStatsTable';
import { DateRangePicker } from './DateRangePicker';

export function AttendanceSummaryReport() {
  const { stats, isLoading, dateRange, setDateRange } = useAttendanceStats();

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border bg-card">
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Employees',
      value: stats?.summary.totalEmployees || 0,
      suffix: '',
      trend: '+3',
      trendUp: true,
      trendLabel: 'from last period',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Avg Attendance',
      value: stats?.summary.averageAttendance || 0,
      suffix: '%',
      trend: '+5.2%',
      trendUp: true,
      trendLabel: 'from last period',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Late Arrivals',
      value: stats?.summary.averageLatePercentage || 0,
      suffix: '%',
      trend: '-2.1%',
      trendUp: false,
      trendLabel: 'from last period',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Avg Work Hours',
      value: stats?.summary.averageWorkHours || 0,
      suffix: 'h',
      trend: '+0.5h',
      trendUp: true,
      trendLabel: 'daily average',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Attendance statistics and employee performance
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
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
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

      {/* Charts Section */}
      {stats && <AttendanceCharts stats={stats} />}

      {/* Employee Table */}
      {stats && <EmployeeStatsTable employees={stats.employees} />}
    </div>
  );
}
