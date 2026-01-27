import { useEffect } from 'react';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  Target,
  Zap,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { usePerformanceStats } from '@/hooks/usePerformanceStats';
import { cn } from '@/lib/utils';

const chartConfig = {
  daysPresent: { label: 'Days Present', color: 'hsl(var(--chart-1))' },
  daysLate: { label: 'Days Late', color: 'hsl(var(--chart-2))' },
  onTimeRate: { label: 'On-Time Rate', color: 'hsl(var(--chart-3))' },
  tasksCompleted: { label: 'Completed', color: 'hsl(var(--chart-1))' },
  tasksPending: { label: 'Pending', color: 'hsl(var(--chart-4))' },
  completionRate: { label: 'Completion Rate', color: 'hsl(var(--chart-5))' },
  leavesTaken: { label: 'Leaves', color: 'hsl(var(--chart-2))' },
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Performance() {
  const { monthlyStats, overallStats, isLoading, fetchPerformanceStats } = usePerformanceStats();

  useEffect(() => {
    fetchPerformanceStats(6);
  }, [fetchPerformanceStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const leavesPieData = [
    { name: 'Approved', value: monthlyStats.reduce((sum, m) => sum + m.leavesApproved, 0) },
    { name: 'Rejected', value: monthlyStats.reduce((sum, m) => sum + m.leavesRejected, 0) },
    { name: 'Pending', value: monthlyStats.reduce((sum, m) => sum + (m.leavesTaken - m.leavesApproved - m.leavesRejected), 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Performance Dashboard</h1>
        <p className="page-description">
          Track your attendance, tasks, and leave usage over the last 6 months
        </p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold mt-1">{overallStats?.currentStreak || 0} days</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <p className="text-2xl font-bold mt-1">{overallStats?.avgOnTimeRate || 100}%</p>
            </div>
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              (overallStats?.avgOnTimeRate || 100) >= 80 ? "bg-green-500/10" : "bg-yellow-500/10"
            )}>
              {(overallStats?.avgOnTimeRate || 100) >= 80 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Task Completion</p>
              <p className="text-2xl font-bold mt-1">{overallStats?.avgCompletionRate || 100}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Leaves Taken</p>
              <p className="text-2xl font-bold mt-1">{overallStats?.totalLeavesTaken || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Trend
          </CardTitle>
          <CardDescription>Daily attendance and punctuality over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="daysPresent"
                  name="Days Present"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
                <Area
                  type="monotone"
                  dataKey="daysLate"
                  name="Days Late"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorLate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Task Performance
            </CardTitle>
            <CardDescription>Monthly task completion breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="tasksCompleted" name="Completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tasksPending" name="Pending" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Completion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Rates
            </CardTitle>
            <CardDescription>On-time and completion rate trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="onTimeRate"
                    name="On-Time Rate %"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    name="Task Completion %"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-5))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leave Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Distribution
            </CardTitle>
            <CardDescription>Leave requests breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {leavesPieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leavesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {leavesPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>No leave requests in this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Leave Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leave Usage Trend</CardTitle>
            <CardDescription>Leaves taken per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leavesTaken" name="Leaves" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Summary</CardTitle>
          <CardDescription>Your performance overview for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Attendance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Days Present</span>
                  <span className="font-medium">{overallStats?.totalDaysPresent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Days Late</span>
                  <span className="font-medium text-yellow-600">{overallStats?.totalDaysLate || 0}</span>
                </div>
                <Progress value={overallStats?.avgOnTimeRate || 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {overallStats?.avgOnTimeRate || 100}% on-time rate
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Tasks</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium text-green-600">{overallStats?.totalTasksCompleted || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-medium text-orange-600">{overallStats?.totalTasksPending || 0}</span>
                </div>
                <Progress value={overallStats?.avgCompletionRate || 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {overallStats?.avgCompletionRate || 100}% completion rate
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Leaves</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Taken</span>
                  <span className="font-medium">{overallStats?.totalLeavesTaken || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Streak</span>
                  <span className="font-medium text-primary">{overallStats?.currentStreak || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
