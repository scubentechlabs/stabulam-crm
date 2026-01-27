import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

interface AttendanceExportRecord extends Attendance {
  employee_name?: string;
  employee_email?: string;
}

interface ExportOptions {
  startDate: Date;
  endDate: Date;
  format: 'csv' | 'pdf';
  userId?: string; // For admin exporting specific user, undefined for self
}

export function useAttendanceExport() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const fetchAttendanceData = async (
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AttendanceExportRecord[]> => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    let query = supabase
      .from('attendance')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });

    // If userId provided (admin exporting specific user)
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (role !== 'admin') {
      // Employee can only export their own data
      query = query.eq('user_id', user?.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // For admin exports, fetch user profiles to add names
    if (role === 'admin' && !userId) {
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, { name: p.full_name, email: p.email }]) || []
      );

      return (data || []).map(record => ({
        ...record,
        employee_name: profileMap.get(record.user_id)?.name || 'Unknown',
        employee_email: profileMap.get(record.user_id)?.email || '',
      }));
    }

    return data || [];
  };

  const exportToCSV = (records: AttendanceExportRecord[], isAdmin: boolean) => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records found for the selected date range.',
        variant: 'destructive',
      });
      return;
    }

    const headers = isAdmin
      ? ['Date', 'Employee Name', 'Email', 'Clock In', 'Clock Out', 'Late', 'Late Minutes', 'TOD Submitted', 'EOD Submitted']
      : ['Date', 'Clock In', 'Clock Out', 'Late', 'Late Minutes', 'TOD Submitted', 'EOD Submitted'];

    const rows = records.map(record => {
      const baseRow = [
        record.date,
        record.clock_in_time ? format(new Date(record.clock_in_time), 'h:mm a') : '-',
        record.clock_out_time ? format(new Date(record.clock_out_time), 'h:mm a') : '-',
        record.is_late ? 'Yes' : 'No',
        record.late_minutes?.toString() || '0',
        record.tod_submitted ? 'Yes' : 'No',
        record.eod_submitted ? 'Yes' : 'No',
      ];

      if (isAdmin) {
        return [
          record.date,
          record.employee_name || '',
          record.employee_email || '',
          ...baseRow.slice(1),
        ];
      }

      return baseRow;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Successfully exported ${records.length} attendance records.`,
    });
  };

  const exportToPDF = async (
    records: AttendanceExportRecord[],
    startDate: Date,
    endDate: Date,
    isAdmin: boolean,
    employeeName?: string
  ) => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records found for the selected date range.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('generate-attendance-pdf', {
        body: {
          records,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          isAdmin,
          employeeName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate PDF');
      }

      const htmlContent = response.data;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }

      toast({
        title: 'PDF Generated',
        description: 'Attendance report is ready. Use Print → Save as PDF.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      });
    }
  };

  const exportAttendance = async (options: ExportOptions) => {
    setIsExporting(true);

    try {
      const records = await fetchAttendanceData(
        options.startDate,
        options.endDate,
        options.userId
      );

      const isAdminExport = role === 'admin' && !options.userId;

      if (options.format === 'csv') {
        exportToCSV(records, isAdminExport);
      } else {
        await exportToPDF(
          records,
          options.startDate,
          options.endDate,
          isAdminExport
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting attendance data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportAttendance,
    isExporting,
  };
}
