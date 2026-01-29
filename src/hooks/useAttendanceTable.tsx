import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AttendanceTableRow {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  department: string | null;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  is_late: boolean | null;
  late_minutes: number | null;
  tod_submitted: boolean | null;
  eod_submitted: boolean | null;
  status: 'present' | 'absent' | 'late' | 'working' | 'completed';
  work_hours: string | null;
}

export function useAttendanceTable() {
  const { users } = useUsers();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      let query = supabase
        .from('attendance')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });

      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedEmployee]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const calculateWorkHours = (clockIn: string | null, clockOut: string | null): string | null => {
    if (!clockIn || !clockOut) return null;
    
    const inTime = new Date(clockIn);
    const outTime = new Date(clockOut);
    const diffMs = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatus = (record: Attendance): AttendanceTableRow['status'] => {
    if (!record.clock_in_time) return 'absent';
    if (record.clock_out_time) return 'completed';
    if (record.is_late) return 'late';
    return 'working';
  };

  const tableData = useMemo((): AttendanceTableRow[] => {
    const activeEmployees = users.filter(u => u.is_active && u.role === 'employee');
    
    // Get all dates in range
    const datesInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const today = new Date();
    
    const rows: AttendanceTableRow[] = [];
    
    // Filter employees based on selection
    const employeesToShow = selectedEmployee === 'all' 
      ? activeEmployees 
      : activeEmployees.filter(e => e.user_id === selectedEmployee);
    
    for (const employee of employeesToShow) {
      for (const date of datesInRange) {
        // Don't show future dates
        if (date > today) continue;
        
        const dateStr = format(date, 'yyyy-MM-dd');
        const record = attendanceRecords.find(
          r => r.user_id === employee.user_id && r.date === dateStr
        );
        
        if (record) {
          rows.push({
            id: record.id,
            user_id: employee.user_id,
            user_name: employee.full_name,
            avatar_url: employee.avatar_url,
            department: employee.department,
            date: record.date,
            clock_in_time: record.clock_in_time,
            clock_out_time: record.clock_out_time,
            is_late: record.is_late,
            late_minutes: record.late_minutes,
            tod_submitted: record.tod_submitted,
            eod_submitted: record.eod_submitted,
            status: getStatus(record),
            work_hours: calculateWorkHours(record.clock_in_time, record.clock_out_time),
          });
        } else {
          // Create absent row
          rows.push({
            id: `absent-${employee.user_id}-${dateStr}`,
            user_id: employee.user_id,
            user_name: employee.full_name,
            avatar_url: employee.avatar_url,
            department: employee.department,
            date: dateStr,
            clock_in_time: null,
            clock_out_time: null,
            is_late: null,
            late_minutes: null,
            tod_submitted: null,
            eod_submitted: null,
            status: 'absent',
            work_hours: null,
          });
        }
      }
    }
    
    // Sort by date descending, then by name
    return rows.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.user_name.localeCompare(b.user_name);
    });
  }, [users, attendanceRecords, dateRange, selectedEmployee]);

  const stats = useMemo(() => {
    const activeEmployees = users.filter(u => u.is_active && u.role === 'employee');
    const present = attendanceRecords.filter(r => r.clock_in_time).length;
    const late = attendanceRecords.filter(r => r.is_late).length;
    const completed = attendanceRecords.filter(r => r.clock_out_time).length;
    const totalPossible = tableData.length;
    const absent = tableData.filter(r => r.status === 'absent').length;
    
    return {
      total: activeEmployees.length,
      present,
      absent,
      late,
      completed,
      working: present - completed,
      avgAttendance: totalPossible > 0 ? Math.round((present / totalPossible) * 100) : 0,
    };
  }, [users, attendanceRecords, tableData]);

  const employees = useMemo(() => {
    return users
      .filter(u => u.is_active && u.role === 'employee')
      .map(u => ({ value: u.user_id, label: u.full_name }));
  }, [users]);

  return {
    tableData,
    stats,
    employees,
    isLoading,
    dateRange,
    setDateRange,
    selectedEmployee,
    setSelectedEmployee,
    refetch: fetchAttendance,
  };
}
