import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import type { DailyLeaveTrend, LeaveTypeDistribution, EmployeeLeaveStats } from '@/hooks/useLeaveStats';

interface LeaveChartsProps {
  dailyTrends: DailyLeaveTrend[];
  leaveTypeDistribution: LeaveTypeDistribution[];
  statusDistribution: { status: string; count: number; fill: string }[];
  employeeStats: EmployeeLeaveStats[];
}

const chartConfig = {
  approved: { label: 'Approved', color: 'hsl(var(--chart-2))' },
  pending: { label: 'Pending', color: 'hsl(var(--chart-4))' },
  rejected: { label: 'Rejected', color: 'hsl(var(--chart-5))' },
  halfDay: { label: 'Half Day', color: 'hsl(var(--chart-1))' },
  fullDay: { label: 'Full Day', color: 'hsl(var(--chart-2))' },
  multipleDays: { label: 'Multiple Days', color: 'hsl(var(--chart-3))' },
  totalDaysOff: { label: 'Days Off', color: 'hsl(var(--chart-1))' },
  totalLeaves: { label: 'Total Requests', color: 'hsl(var(--chart-2))' },
};

export function LeaveCharts({ dailyTrends, leaveTypeDistribution, statusDistribution, employeeStats }: LeaveChartsProps) {
  // Prepare employee usage data (top 10 by total leaves)
  const employeeUsageData = employeeStats
    .sort((a, b) => b.totalLeaves - a.totalLeaves)
    .slice(0, 10)
    .map(emp => ({
      name: emp.name.split(' ')[0],
      totalLeaves: emp.totalLeaves,
      totalDaysOff: emp.totalDaysOff,
    }));

  // Prepare advance notice data
  const advanceNoticeData = [
    { 
      category: 'With Notice', 
      count: employeeStats.reduce((sum, e) => sum + e.withAdvanceNotice, 0),
      fill: 'hsl(var(--chart-2))'
    },
    { 
      category: 'Without Notice', 
      count: employeeStats.reduce((sum, e) => sum + e.withoutAdvanceNotice, 0),
      fill: 'hsl(var(--chart-5))'
    },
  ].filter(d => d.count > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Daily Leave Trends */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Daily Leave Trends</CardTitle>
          <CardDescription>Leave requests throughout the month by status</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={dailyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dayLabel" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="approved"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stackId="1"
                stroke="hsl(var(--chart-4))"
                fill="hsl(var(--chart-4))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="rejected"
                stackId="1"
                stroke="hsl(var(--chart-5))"
                fill="hsl(var(--chart-5))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Leave Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Type Distribution</CardTitle>
          <CardDescription>Breakdown by leave duration type</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <Pie
                data={leaveTypeDistribution}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ type, count }) => `${type}: ${count}`}
                labelLine={false}
              >
                {leaveTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Request Status Overview</CardTitle>
          <CardDescription>Leave requests by approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
                labelLine={false}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Employee Leave Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Usage</CardTitle>
          <CardDescription>Top employees by leave requests and days off</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={employeeUsageData} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" allowDecimals={false} className="text-xs" />
              <YAxis type="category" dataKey="name" className="text-xs" width={55} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="totalLeaves" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="totalDaysOff" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Advance Notice Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Advance Notice Compliance</CardTitle>
          <CardDescription>Requests with 48+ hours advance notice</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <Pie
                data={advanceNoticeData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={({ category, count }) => `${category}: ${count}`}
                labelLine={false}
              >
                {advanceNoticeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
