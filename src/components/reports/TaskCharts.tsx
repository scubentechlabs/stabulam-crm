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
  AreaChart,
  Area,
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

const COLORS = {
  tod: 'hsl(var(--chart-1))',
  eod: 'hsl(var(--chart-2))',
  pending: 'hsl(var(--chart-3))',
  completed: 'hsl(var(--chart-4))',
};

export function TaskCharts({ stats }: TaskChartsProps) {
  // Prepare data for submission rates chart
  const submissionRatesData = stats.employees
    .map(e => ({
      name: e.fullName.split(' ')[0],
      todRate: e.todSubmissionRate,
      eodRate: e.eodSubmissionRate,
    }))
    .slice(0, 10);

  // Prepare data for task completion by employee
  const taskCompletionData = stats.employees
    .filter(e => e.totalTodTasks > 0)
    .sort((a, b) => b.completedTodTasks - a.completedTodTasks)
    .slice(0, 10)
    .map(e => ({
      name: e.fullName.split(' ')[0],
      completed: e.completedTodTasks,
      pending: e.pendingTodTasks,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Analytics</CardTitle>
        <CardDescription>Visual breakdown of task submission and completion patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Submissions</TabsTrigger>
            <TabsTrigger value="rates">Submission Rates</TabsTrigger>
            <TabsTrigger value="completion">Task Completion</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyStats}>
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
                <Area 
                  type="monotone" 
                  dataKey="todSubmitted" 
                  stroke={COLORS.tod}
                  fill={COLORS.tod}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="TOD Submitted"
                />
                <Area 
                  type="monotone" 
                  dataKey="eodSubmitted" 
                  stroke={COLORS.eod}
                  fill={COLORS.eod}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="EOD Submitted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="rates" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionRatesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
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
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend />
                <Bar 
                  dataKey="todRate" 
                  fill={COLORS.tod}
                  name="TOD Rate"
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="eodRate" 
                  fill={COLORS.eod}
                  name="EOD Rate"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="completion" className="h-[350px]">
            {taskCompletionData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No task data available for this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData}>
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
                    dataKey="completed" 
                    fill={COLORS.completed}
                    name="Completed"
                    radius={[4, 4, 0, 0]}
                    stackId="stack"
                  />
                  <Bar 
                    dataKey="pending" 
                    fill={COLORS.pending}
                    name="Pending"
                    radius={[4, 4, 0, 0]}
                    stackId="stack"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
