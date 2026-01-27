import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Calendar } from 'lucide-react';
import { AttendanceSummaryReport } from '@/components/reports/AttendanceSummaryReport';
import { TaskSummaryReport } from '@/components/reports/TaskSummaryReport';
import { LeaveSummaryReport } from '@/components/reports/LeaveSummaryReport';
import { ReportExportDialog } from '@/components/reports/ReportExportDialog';

export default function AdminReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-description">View detailed reports and analytics</p>
        </div>
        <ReportExportDialog />
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
          <TaskSummaryReport />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveSummaryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
