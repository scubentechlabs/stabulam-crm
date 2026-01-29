import { useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Download, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAttendanceTable } from '@/hooks/useAttendanceTable';
import { AttendanceTableView } from '@/components/attendance/AttendanceTableView';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceStatsCards } from '@/components/attendance/AttendanceStatsCards';
import { BulkAttendanceManager } from '@/components/attendance/BulkAttendanceManager';
import { AttendanceExportDialog } from '@/components/attendance/AttendanceExportDialog';

export default function AdminAttendance() {
  const {
    tableData,
    stats,
    employees,
    isLoading,
    dateRange,
    setDateRange,
    selectedEmployee,
    setSelectedEmployee,
  } = useAttendanceTable();

  const handleResetFilters = () => {
    setSelectedEmployee('all');
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-description">Track and manage employee attendance records</p>
        </div>
        <AttendanceExportDialog
          trigger={
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Attendance Records
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <AttendanceStatsCards stats={stats} />

          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <AttendanceFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedEmployee={selectedEmployee}
              onEmployeeChange={setSelectedEmployee}
              employees={employees}
              onReset={handleResetFilters}
            />
            <p className="text-sm text-muted-foreground">
              Showing {tableData.length} record(s)
            </p>
          </div>

          {/* Table */}
          <AttendanceTableView data={tableData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkAttendanceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
