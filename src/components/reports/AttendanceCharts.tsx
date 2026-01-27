import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

interface DailyStats {
  date: string;
  present: number;
  absent: number;
  late: number;
  onTime: number;
}

interface AttendanceStats {
  employees: EmployeeStats[];
  dailyStats: DailyStats[];
  summary: {
    totalEmployees: number;
    averageAttendance: number;
    averageLatePercentage: number;
    averageWorkHours: number;
  };
}

interface AttendanceChartsProps {
  stats: AttendanceStats;
}

const CHART_COLORS = {
  primary: 'hsl(221 83% 53%)',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  danger: 'hsl(0 84% 60%)',
  purple: 'hsl(280 65% 60%)',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export function AttendanceCharts({ stats }: AttendanceChartsProps) {
  // Prepare data for employee work hours chart
  const workHoursData = stats.employees
    .sort((a, b) => b.totalWorkHours - a.totalWorkHours)
    .slice(0, 6)
    .map(e => ({
      name: e.fullName.split(' ')[0],
      hours: e.totalWorkHours,
      target: 160,
      percentage: Math.round((e.totalWorkHours / 160) * 100),
    }));

  // Prepare pie chart data
  const totalPresent = stats.employees.reduce((sum, e) => sum + e.presentDays, 0);
  const totalAbsent = stats.employees.reduce((sum, e) => sum + e.absentDays, 0);
  const totalLate = stats.employees.reduce((sum, e) => sum + e.lateDays, 0);
  const totalOnTime = totalPresent - totalLate;

  const attendanceDistribution = [
    { name: 'On Time', value: totalOnTime, color: CHART_COLORS.success, percentage: totalPresent > 0 ? Math.round((totalOnTime / totalPresent) * 100) : 0 },
    { name: 'Late', value: totalLate, color: CHART_COLORS.warning, percentage: totalPresent > 0 ? Math.round((totalLate / totalPresent) * 100) : 0 },
    { name: 'Absent', value: totalAbsent, color: CHART_COLORS.danger, percentage: (totalPresent + totalAbsent) > 0 ? Math.round((totalAbsent / (totalPresent + totalAbsent)) * 100) : 0 },
  ].filter(d => d.value > 0);

  // Top performers
  const topPerformers = stats.employees
    .sort((a, b) => b.onTimePercentage - a.onTimePercentage)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Trend Chart - Takes 2 columns */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Daily Attendance Trend</CardTitle>
            <CardDescription>Daily breakdown for the selected month</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Daily</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyStats}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0}/>
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
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorPresent)"
                  name="Present"
                />
                <Area 
                  type="monotone" 
                  dataKey="late" 
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  fill="url(#colorLate)"
                  name="Late"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Distribution - Donut Chart */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Attendance Status</CardTitle>
            <CardDescription>Distribution overview</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {attendanceDistribution.map((entry, index) => (
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
            {attendanceDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.percentage}%</span>
                  <span className="text-xs text-muted-foreground">({item.value})</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Hours by Employee */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Monthly Work Hours</CardTitle>
            <CardDescription>Top performers by total hours</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {workHoursData.map((employee, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{employee.hours}h</span>
                    <Badge 
                      variant={employee.percentage >= 100 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {employee.percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.min(employee.percentage, 100)}%`,
                      background: employee.percentage >= 100 
                        ? 'linear-gradient(90deg, hsl(142 76% 36%), hsl(142 76% 46%))' 
                        : 'linear-gradient(90deg, hsl(221 83% 53%), hsl(221 83% 63%))'
                    }}
                  />
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
            <CardDescription>Best on-time attendance</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((employee, index) => (
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
                  <p className="text-xs text-muted-foreground">{employee.presentDays} days present</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="font-semibold text-emerald-600">{employee.onTimePercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
