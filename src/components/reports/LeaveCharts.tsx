import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { DailyLeaveTrend, LeaveTypeDistribution, EmployeeLeaveStats } from '@/hooks/useLeaveStats';

interface LeaveChartsProps {
  dailyTrends: DailyLeaveTrend[];
  leaveTypeDistribution: LeaveTypeDistribution[];
  statusDistribution: { status: string; count: number; fill: string }[];
  employeeStats: EmployeeLeaveStats[];
}

const CHART_COLORS = {
  primary: 'hsl(221 83% 53%)',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  danger: 'hsl(0 84% 60%)',
  purple: 'hsl(280 65% 60%)',
};

export function LeaveCharts({ dailyTrends, leaveTypeDistribution, statusDistribution, employeeStats }: LeaveChartsProps) {
  // Top leave takers
  const topLeaveTakers = employeeStats
    .sort((a, b) => b.totalDaysOff - a.totalDaysOff)
    .slice(0, 5);

  // Advance notice data
  const withNotice = employeeStats.reduce((sum, e) => sum + e.withAdvanceNotice, 0);
  const withoutNotice = employeeStats.reduce((sum, e) => sum + e.withoutAdvanceNotice, 0);
  const noticeData = [
    { name: 'With Notice', value: withNotice, color: CHART_COLORS.success },
    { name: 'Without Notice', value: withoutNotice, color: CHART_COLORS.danger },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Leave Trends */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Daily Leave Trend</CardTitle>
            <CardDescription>Leave requests by status throughout the month</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">Daily</Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
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
                  dataKey="approved" 
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  fill="url(#colorApproved)"
                  name="Approved"
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  fill="url(#colorPending)"
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Leave Type Distribution */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Leave Types</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                  strokeWidth={0}
                >
                  {leaveTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
          <div className="space-y-2 mt-4">
            {leaveTypeDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-muted-foreground">{item.type}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Leave Takers */}
      <Card className="lg:col-span-2 border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Leave Usage by Employee</CardTitle>
            <CardDescription>Employees with highest leave days</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {topLeaveTakers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No leave data available</p>
            ) : (
              topLeaveTakers.map((employee, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {employee.totalLeaves} requests
                      </Badge>
                      <Badge 
                        variant={employee.totalDaysOff > 3 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {employee.totalDaysOff} days
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${Math.min((employee.totalDaysOff / 18) * 100, 100)}%`,
                        background: employee.totalDaysOff > 10 
                          ? 'linear-gradient(90deg, hsl(0 84% 60%), hsl(0 84% 50%))' 
                          : employee.totalDaysOff > 5
                          ? 'linear-gradient(90deg, hsl(38 92% 50%), hsl(38 92% 60%))'
                          : 'linear-gradient(90deg, hsl(142 76% 36%), hsl(142 76% 46%))'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advance Notice Compliance */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Notice Compliance</CardTitle>
            <CardDescription>48+ hours advance notice</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={noticeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {noticeData.map((entry, index) => (
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
            {noticeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.value}</span>
                  {item.name === 'With Notice' && (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
