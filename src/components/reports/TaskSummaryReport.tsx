import { format, subMonths, addMonths } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskStats } from '@/hooks/useTaskStats';
import { TaskCharts } from './TaskCharts';
import { TaskStatsTable } from './TaskStatsTable';

export function TaskSummaryReport() {
  const { stats, isLoading, selectedMonth, setSelectedMonth } = useTaskStats();

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
        <div className="p-6 rounded-xl border bg-card">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'TOD Submission',
      value: stats?.summary.avgTodSubmissionRate || 0,
      suffix: '%',
      trend: '+8.2%',
      trendUp: true,
      trendLabel: 'from last month',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'EOD Submission',
      value: stats?.summary.avgEodSubmissionRate || 0,
      suffix: '%',
      trend: '+5.4%',
      trendUp: true,
      trendLabel: 'from last month',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Task Completion',
      value: stats?.summary.avgTaskCompletionRate || 0,
      suffix: '%',
      trend: '+12.3%',
      trendUp: true,
      trendLabel: 'completion rate',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Pending Tasks',
      value: stats?.summary.totalPendingTasks || 0,
      suffix: '',
      trend: '-15',
      trendUp: true,
      trendLabel: 'fewer than last month',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Month Selector - Modern Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Task Performance</h2>
          <p className="text-sm text-muted-foreground">
            TOD/EOD submission rates and task completion trends
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

      {/* Charts */}
      {stats && <TaskCharts stats={stats} />}

      {/* Employee Table */}
      {stats && <TaskStatsTable employees={stats.employees} />}
    </div>
  );
}
