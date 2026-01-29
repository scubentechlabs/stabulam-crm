import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  TrendingUp,
  AlertTriangle,
  Camera,
  Calendar,
  ArrowRight,
  UserPlus,
  DollarSign,
  FileText,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

export default function AdminDashboard() {
  const today = new Date();
  const { stats, pendingApprovalsList, isLoading } = useAdminDashboardStats();

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <Calendar className="h-4 w-4 text-info" />;
      case 'extra_work':
        return <Briefcase className="h-4 w-4 text-warning" />;
      case 'regularization':
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getApprovalTypeBadge = (type: string) => {
    switch (type) {
      case 'leave':
        return <Badge variant="secondary" className="text-xs">Leave</Badge>;
      case 'extra_work':
        return <Badge variant="outline" className="text-xs">Extra Work</Badge>;
      case 'regularization':
        return <Badge className="text-xs">Regularization</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {format(today, 'EEEE, MMMM do, yyyy')} • Overview of agency operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/approvals">
              <CheckSquare className="h-4 w-4 mr-2" />
              Approvals ({isLoading ? '...' : stats.pendingApprovals})
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-5 w-5 text-primary" />}
          bgColor="bg-primary/10"
          isLoading={isLoading}
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={<Clock className="h-5 w-5 text-success" />}
          bgColor="bg-success/10"
          isLoading={isLoading}
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<CheckSquare className="h-5 w-5 text-warning" />}
          bgColor="bg-warning/10"
          isLoading={isLoading}
        />
        <StatCard
          label="Late Today"
          value={stats.lateArrivals}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          bgColor="bg-destructive/10"
          isLoading={isLoading}
        />
        <StatCard
          label="On Leave"
          value={stats.onLeave}
          icon={<Calendar className="h-5 w-5 text-info" />}
          bgColor="bg-info/10"
          isLoading={isLoading}
        />
        <StatCard
          label="Today Shoots"
          value={stats.todayShoots}
          icon={<Camera className="h-5 w-5 text-chart-4" />}
          bgColor="bg-chart-4/10"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          to="/admin/users"
          icon={<Users className="h-6 w-6 text-primary" />}
          iconBg="bg-primary/10"
          title="User Management"
          description="Manage employees"
        />
        <QuickActionCard
          to="/admin/attendance"
          icon={<Clock className="h-6 w-6 text-success" />}
          iconBg="bg-success/10"
          title="Attendance Monitor"
          description="View all attendance"
        />
        <QuickActionCard
          to="/admin/salary"
          icon={<DollarSign className="h-6 w-6 text-warning" />}
          iconBg="bg-warning/10"
          title="Salary Generator"
          description="Calculate salaries"
        />
        <QuickActionCard
          to="/admin/reports"
          icon={<TrendingUp className="h-6 w-6 text-info" />}
          iconBg="bg-info/10"
          title="Reports"
          description="Analytics & exports"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <CardDescription>Leave and extra work requests</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/approvals">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pendingApprovalsList.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovalsList.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getApprovalTypeIcon(approval.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{approval.userName}</span>
                        {getApprovalTypeBadge(approval.type)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {approval.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(approval.requestDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending approvals</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today's Attendance</CardTitle>
              <CardDescription>Live attendance status</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/attendance">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                  <span className="text-sm font-medium">Present</span>
                  <span className="text-lg font-bold text-success">{stats.presentToday}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <span className="text-sm font-medium">Late Arrivals</span>
                  <span className="text-lg font-bold text-destructive">{stats.lateArrivals}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-info/5 border border-info/20">
                  <span className="text-sm font-medium">On Leave</span>
                  <span className="text-lg font-bold text-info">{stats.onLeave}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Not Yet In</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {Math.max(0, stats.totalEmployees - stats.presentToday - stats.onLeave)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Extracted components for better organization
function StatCard({
  label,
  value,
  icon,
  bgColor,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  isLoading: boolean;
}) {
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function QuickActionCard({
  to,
  icon,
  iconBg,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="dashboard-card hover:border-primary/50 transition-colors">
      <Link to={to} className="block p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
    </Card>
  );
}
