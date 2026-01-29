import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  completed: number;
  working: number;
  avgAttendance: number;
}

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
}

export function AttendanceStatsCards({ stats }: AttendanceStatsCardsProps) {
  const cards = [
    {
      title: 'Total Employees',
      value: stats.total,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Present',
      value: stats.present,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Absent',
      value: stats.absent,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Late Arrivals',
      value: stats.late,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.avgAttendance}%`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
