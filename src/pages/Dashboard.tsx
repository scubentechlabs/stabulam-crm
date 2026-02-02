import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  ClipboardList, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Camera,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TodayShootsWidget } from '@/components/dashboard/TodayShootsWidget';
import { EmployeeOverviewCalendar } from '@/components/dashboard/EmployeeOverviewCalendar';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatTimeIST, isWorkingDay } from '@/lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, todayStatus, isLoading } = useDashboardStats();
  const today = new Date();
  const isSunday = !isWorkingDay(today);
  const greeting = getGreeting();

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const formatTime = (timeStr: string | null) => formatTimeIST(timeStr);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(today, 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {isSunday ? (
            <Button variant="outline" size="lg" className="gap-2" disabled>
              <PartyPopper className="h-4 w-4" />
              Holiday Today
            </Button>
          ) : (
            <Button asChild size="lg" className="gap-2">
              <Link to="/attendance">
                <Clock className="h-4 w-4" />
                {todayStatus.clockedIn ? (todayStatus.clockOutTime ? 'View Attendance' : 'Clock Out') : 'Clock In'}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Streak</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-1">{stats.attendanceStreak} days</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-1">{stats.tasksCompleted}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Leaves</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-1">{stats.pendingLeaves}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today Shoots</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-1">{stats.todayShoots}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card hover:border-primary/50 cursor-pointer transition-colors">
          <Link to="/attendance" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Attendance</h3>
                <p className="text-sm text-muted-foreground">Clock in/out</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 cursor-pointer transition-colors">
          <Link to="/tasks" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Tasks</h3>
                <p className="text-sm text-muted-foreground">TOD / EOD</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 cursor-pointer transition-colors">
          <Link to="/leaves" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Leave Request</h3>
                <p className="text-sm text-muted-foreground">Apply for leave</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 cursor-pointer transition-colors">
          <Link to="/extra-work" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold">Extra Work</h3>
                <p className="text-sm text-muted-foreground">Log overtime</p>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      {/* Today's Status & Today Shoots */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Status</CardTitle>
            <CardDescription>Your attendance and task status for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSunday ? (
              <div className="flex items-center justify-center p-8 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="text-center">
                  <PartyPopper className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-medium text-amber-700 dark:text-amber-400">It's Sunday!</p>
                  <p className="text-sm text-muted-foreground mt-1">Enjoy your day off 🌟</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {todayStatus.clockedIn ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                    <div>
                      <span>Clock-in Status</span>
                      {todayStatus.clockInTime && (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(todayStatus.clockInTime)}
                          {todayStatus.isLate && ` (${todayStatus.lateMinutes} min late)`}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`status-badge ${
                    todayStatus.clockedIn 
                      ? (todayStatus.isLate ? 'status-badge-rejected' : 'status-badge-approved')
                      : 'status-badge-pending'
                  }`}>
                    {todayStatus.clockedIn 
                      ? (todayStatus.isLate ? 'Late' : 'Clocked in')
                      : 'Not clocked in'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {todayStatus.todSubmitted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span>TOD Submitted</span>
                  </div>
                  <span className={`status-badge ${
                    todayStatus.todSubmitted ? 'status-badge-approved' : 'status-badge-pending'
                  }`}>
                    {todayStatus.todSubmitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {todayStatus.eodSubmitted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span>EOD Submitted</span>
                  </div>
                  <span className={`status-badge ${
                    todayStatus.eodSubmitted ? 'status-badge-approved' : 'status-badge-pending'
                  }`}>
                    {todayStatus.eodSubmitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
                {todayStatus.clockOutTime && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span>Clock-out Time</span>
                    </div>
                    <span className="text-sm font-medium">{formatTime(todayStatus.clockOutTime)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <TodayShootsWidget />
      </div>

      {/* Employee Overview Calendar */}
      <EmployeeOverviewCalendar />
    </div>
  );
}
