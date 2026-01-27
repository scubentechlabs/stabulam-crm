import { format, subMonths, addMonths } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { AttendanceCharts } from './AttendanceCharts';
import { EmployeeStatsTable } from './EmployeeStatsTable';

export function AttendanceSummaryReport() {
  const { stats, isLoading, selectedMonth, setSelectedMonth } = useAttendanceStats();

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

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
      trendLabel: 'from last month',
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
      trendLabel: 'from last month',
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
      trendLabel: 'from last month',
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
      {/* Month Selector - Modern Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Monthly attendance statistics and employee performance
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePrevMonth}
            className="h-9 w-9 rounded-lg hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(selectedMonth, 'MMMM yyyy')}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextMonth}
            disabled={selectedMonth >= new Date()}
            className="h-9 w-9 rounded-lg hover:bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
