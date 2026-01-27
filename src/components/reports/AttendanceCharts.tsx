import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
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

const COLORS = {
  present: 'hsl(var(--chart-1))',
  absent: 'hsl(var(--chart-2))',
  late: 'hsl(var(--chart-3))',
  onTime: 'hsl(var(--chart-4))',
};

export function AttendanceCharts({ stats }: AttendanceChartsProps) {
  // Prepare data for employee work hours chart
  const workHoursData = stats.employees
    .map(e => ({
      name: e.fullName.split(' ')[0],
      hours: e.totalWorkHours,
      avgHours: e.averageWorkHours,
    }))
    .slice(0, 10); // Show top 10

  // Prepare data for late arrivals chart
  const lateArrivalsData = stats.employees
    .filter(e => e.lateDays > 0)
    .sort((a, b) => b.lateDays - a.lateDays)
    .slice(0, 10)
    .map(e => ({
      name: e.fullName.split(' ')[0],
      lateDays: e.lateDays,
      lateMinutes: Math.round(e.totalLateMinutes / 60 * 10) / 10,
    }));

  // Prepare pie chart data
  const totalPresent = stats.employees.reduce((sum, e) => sum + e.presentDays, 0);
  const totalAbsent = stats.employees.reduce((sum, e) => sum + e.absentDays, 0);
  const totalLate = stats.employees.reduce((sum, e) => sum + e.lateDays, 0);
  const totalOnTime = totalPresent - totalLate;

  const pieData = [
    { name: 'On Time', value: totalOnTime, color: COLORS.onTime },
    { name: 'Late', value: totalLate, color: COLORS.late },
    { name: 'Absent', value: totalAbsent, color: COLORS.absent },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Analytics</CardTitle>
        <CardDescription>Visual breakdown of attendance patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily Trend</TabsTrigger>
            <TabsTrigger value="workHours">Work Hours</TabsTrigger>
            <TabsTrigger value="lateArrivals">Late Arrivals</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="present" 
                  stroke={COLORS.present}
                  strokeWidth={2}
                  name="Present"
                />
                <Line 
                  type="monotone" 
                  dataKey="late" 
                  stroke={COLORS.late}
                  strokeWidth={2}
                  name="Late"
                />
                <Line 
                  type="monotone" 
                  dataKey="absent" 
                  stroke={COLORS.absent}
                  strokeWidth={2}
                  name="Absent"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="workHours" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workHoursData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}h`, '']}
                />
                <Legend />
                <Bar 
                  dataKey="hours" 
                  fill={COLORS.present}
                  name="Total Hours"
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="avgHours" 
                  fill={COLORS.onTime}
                  name="Avg Daily Hours"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="lateArrivals" className="h-[350px]">
            {lateArrivalsData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No late arrivals recorded this month 🎉
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lateArrivalsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="lateDays" 
                    fill={COLORS.late}
                    name="Late Days"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="lateMinutes" 
                    fill={COLORS.absent}
                    name="Late Hours"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="overview" className="h-[350px]">
            <div className="flex items-center justify-center h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
