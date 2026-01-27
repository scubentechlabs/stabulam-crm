import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

interface DailyTaskStats {
  date: string;
  todSubmitted: number;
  eodSubmitted: number;
  pendingTasks: number;
  completedTasks: number;
}

interface TaskStats {
  employees: EmployeeTaskStats[];
  dailyStats: DailyTaskStats[];
  summary: {
    totalEmployees: number;
    avgTodSubmissionRate: number;
    avgEodSubmissionRate: number;
    avgTaskCompletionRate: number;
    totalPendingTasks: number;
  };
}

interface TaskChartsProps {
  stats: TaskStats;
}

const CHART_COLORS = {
  primary: 'hsl(221 83% 53%)',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  purple: 'hsl(280 65% 60%)',
};

export function TaskCharts({ stats }: TaskChartsProps) {
  // Prepare submission data
  const submissionRatesData = stats.employees
    .sort((a, b) => (b.todSubmissionRate + b.eodSubmissionRate) - (a.todSubmissionRate + a.eodSubmissionRate))
    .slice(0, 6)
    .map(e => ({
      name: e.fullName.split(' ')[0],
      todRate: e.todSubmissionRate,
      eodRate: e.eodSubmissionRate,
      avgRate: Math.round((e.todSubmissionRate + e.eodSubmissionRate) / 2),
    }));

  // Task completion distribution
  const totalCompleted = stats.employees.reduce((sum, e) => sum + e.completedTodTasks, 0);
  const totalPending = stats.employees.reduce((sum, e) => sum + e.pendingTodTasks, 0);
  
  const completionDistribution = [
    { name: 'Completed', value: totalCompleted, color: CHART_COLORS.success },
    { name: 'Pending', value: totalPending, color: CHART_COLORS.warning },
  ].filter(d => d.value > 0);

  // Top performers by completion
  const topPerformers = stats.employees
    .filter(e => e.totalTodTasks > 0)
    .sort((a, b) => {
      const aRate = (a.todSubmissionRate + a.eodSubmissionRate) / 2;
      const bRate = (b.todSubmissionRate + b.eodSubmissionRate) / 2;
      return bRate - aRate;
    })
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Submissions Chart */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Daily Submission Trend</CardTitle>
            <CardDescription>TOD and EOD submissions throughout the month</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">Daily</Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyStats}>
                <defs>
                  <linearGradient id="colorTod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="todSubmitted" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorTod)"
                  name="TOD Submitted"
                />
                <Area 
                  type="monotone" 
                  dataKey="eodSubmitted" 
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  fill="url(#colorEod)"
                  name="EOD Submitted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Distribution */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Task Status</CardTitle>
            <CardDescription>Completion distribution</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {completionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="space-y-3 mt-4">
            {completionDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission Rates by Employee */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Submission Rates</CardTitle>
            <CardDescription>TOD and EOD rates by employee</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {submissionRatesData.map((employee, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-primary" />
                      <span className="text-xs">{employee.todRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs">{employee.eodRate}%</span>
                    </div>
                    <Badge 
                      variant={employee.avgRate >= 80 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {employee.avgRate}% avg
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all duration-500 rounded-full bg-primary"
                      style={{ width: `${employee.todRate}%` }}
                    />
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all duration-500 rounded-full bg-emerald-500"
                      style={{ width: `${employee.eodRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
            <CardDescription>Highest submission rates</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((employee, index) => {
              const avgRate = Math.round((employee.todSubmissionRate + employee.eodSubmissionRate) / 2);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold text-sm ${
                    index === 0 ? 'bg-amber-500' : 
                    index === 1 ? 'bg-slate-400' : 
                    index === 2 ? 'bg-amber-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{employee.completedTodTasks} tasks completed</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-600">{avgRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
