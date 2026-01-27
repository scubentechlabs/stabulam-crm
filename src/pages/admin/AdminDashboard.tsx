import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Camera,
  Calendar,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const today = new Date();

  // Placeholder stats - will be replaced with real data
  const stats = {
    totalEmployees: 24,
    presentToday: 18,
    pendingApprovals: 5,
    upcomingShoots: 3,
    lateArrivals: 2,
    onLeave: 4,
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
              Approvals ({stats.pendingApprovals})
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold mt-1">{stats.presentToday}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold mt-1">{stats.pendingApprovals}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Late Today</p>
              <p className="text-2xl font-bold mt-1">{stats.lateArrivals}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Leave</p>
              <p className="text-2xl font-bold mt-1">{stats.onLeave}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Shoots</p>
              <p className="text-2xl font-bold mt-1">{stats.upcomingShoots}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-chart-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card hover:border-primary/50 transition-colors">
          <Link to="/admin/users" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage employees</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 transition-colors">
          <Link to="/admin/attendance" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Attendance Monitor</h3>
                  <p className="text-sm text-muted-foreground">View all attendance</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 transition-colors">
          <Link to="/admin/salary" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">Salary Generator</h3>
                  <p className="text-sm text-muted-foreground">Calculate salaries</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 transition-colors">
          <Link to="/admin/reports" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold">Reports</h3>
                  <p className="text-sm text-muted-foreground">Analytics & exports</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>
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
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending approvals</p>
            </div>
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
                  {stats.totalEmployees - stats.presentToday - stats.onLeave}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
