import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Users } from 'lucide-react';

export default function AdminReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-description">View detailed reports and analytics</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="dashboard-card hover:border-primary/50 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Attendance Report</CardTitle>
                <CardDescription>Monthly attendance trends</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">Task Completion</CardTitle>
                <CardDescription>Task performance metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="dashboard-card hover:border-primary/50 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base">Leave Analysis</CardTitle>
                <CardDescription>Leave patterns and trends</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Visual overview of agency operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Analytics Coming Soon</p>
            <p className="text-sm">Charts and graphs will appear here once data is available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
