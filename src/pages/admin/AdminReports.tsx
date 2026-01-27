import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Calendar } from 'lucide-react';
import { AttendanceSummaryReport } from '@/components/reports/AttendanceSummaryReport';

export default function AdminReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-description">View detailed reports and analytics</p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance" className="gap-2">
            <Users className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="h-4 w-4" />
            Leaves
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendanceSummaryReport />
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Report</CardTitle>
              <CardDescription>Task performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Task Analytics Coming Soon</p>
                <p className="text-sm">Task completion trends and performance metrics will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle>Leave Analysis Report</CardTitle>
              <CardDescription>Leave patterns and usage trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Leave Analytics Coming Soon</p>
                <p className="text-sm">Leave patterns and trends will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
