import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Calendar, Download, TrendingUp } from 'lucide-react';
import { AttendanceSummaryReport } from '@/components/reports/AttendanceSummaryReport';
import { TaskSummaryReport } from '@/components/reports/TaskSummaryReport';
import { LeaveSummaryReport } from '@/components/reports/LeaveSummaryReport';
import { ReportExportDialog } from '@/components/reports/ReportExportDialog';
import { Button } from '@/components/ui/button';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive insights and performance metrics
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportDialog />
        </div>
      </div>

      {/* Modern Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="h-12 p-1 bg-muted/50 rounded-xl border">
            <TabsTrigger 
              value="attendance" 
              className="gap-2 h-10 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="gap-2 h-10 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leaves" 
              className="gap-2 h-10 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Leaves</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceSummaryReport />
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <TaskSummaryReport />
        </TabsContent>

        <TabsContent value="leaves" className="mt-0">
          <LeaveSummaryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
