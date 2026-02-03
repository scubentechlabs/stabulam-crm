import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isToday, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { useHolidays } from '@/hooks/useHolidays';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];
type Leave = Database['public']['Tables']['leaves']['Row'];
export interface DateRange {
  from: Date;
  to: Date;
}

export interface AttendanceTableRow {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  clock_in_photo_url: string | null;
  department: string | null;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  is_late: boolean | null;
  late_minutes: number | null;
  tod_submitted: boolean | null;
  eod_submitted: boolean | null;
  status: 'present' | 'absent' | 'late' | 'working' | 'completed' | 'not_clock_in' | 'holiday' | 'on_leave';
  work_hours: string | null;
  holiday_name?: string;
  is_on_leave?: boolean;
}

export function useAttendanceTable() {
  const { users } = useUsers();
  const { isHoliday } = useHolidays();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Fetch attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });

      if (selectedEmployee !== 'all') {
        attendanceQuery = attendanceQuery.eq('user_id', selectedEmployee);
      }

      // Fetch approved leaves that overlap with date range
      let leavesQuery = supabase
        .from('leaves')
        .select('*')
        .eq('status', 'approved')
        .lte('start_date', toDate)
        .gte('end_date', fromDate);

      if (selectedEmployee !== 'all') {
        leavesQuery = leavesQuery.eq('user_id', selectedEmployee);
      }

      const [attendanceResult, leavesResult] = await Promise.all([
        attendanceQuery,
        leavesQuery,
      ]);

      if (attendanceResult.error) throw attendanceResult.error;
      if (leavesResult.error) throw leavesResult.error;

      setAttendanceRecords(attendanceResult.data || []);
      setApprovedLeaves(leavesResult.data || []);
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

  // Check if user is on approved leave for a specific date
  const isUserOnLeave = (userId: string, dateStr: string): boolean => {
    return approvedLeaves.some(leave => {
      if (leave.user_id !== userId) return false;
      return dateStr >= leave.start_date && dateStr <= leave.end_date;
    });
  };

  const getStatus = (
    record: Attendance | null, 
    date: Date, 
    workEndTime: string | null,
    userId: string,
    dateStr: string
  ): AttendanceTableRow['status'] => {
    // Check if it's a holiday first
    const holidayCheck = isHoliday(date);
    if (holidayCheck.isHoliday) return 'holiday';

    // Check if user is on approved leave
    if (isUserOnLeave(userId, dateStr)) return 'on_leave';

    // If there's no record or no clock in
    if (!record || !record.clock_in_time) {
      // If it's today, check if we're past work end time
      if (isToday(date)) {
        const now = new Date();
        const endTime = workEndTime || '18:00:00';
        const [hours, minutes] = endTime.split(':').map(Number);
        const workEndDate = new Date();
        workEndDate.setHours(hours, minutes, 0, 0);
        
        // If current time is past work end time, show Absent
        if (now > workEndDate) {
          return 'absent';
        }
        // Otherwise show Not Clock In
        return 'not_clock_in';
      }
      // Past dates without clock in are Absent
      return 'absent';
    }
    
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
        
        const holidayCheck = isHoliday(date);
        const onLeave = isUserOnLeave(employee.user_id, dateStr);
        const status = getStatus(record || null, date, employee.work_end_time, employee.user_id, dateStr);
        if (record) {
          rows.push({
            id: record.id,
            user_id: employee.user_id,
            user_name: employee.full_name,
            avatar_url: employee.avatar_url,
            clock_in_photo_url: record.clock_in_photo_url,
            department: employee.department,
            date: record.date,
            clock_in_time: record.clock_in_time,
            clock_out_time: record.clock_out_time,
            is_late: record.is_late,
            late_minutes: record.late_minutes,
            tod_submitted: record.tod_submitted,
            eod_submitted: record.eod_submitted,
            status,
            work_hours: calculateWorkHours(record.clock_in_time, record.clock_out_time),
            holiday_name: holidayCheck.isHoliday ? holidayCheck.reason : undefined,
            is_on_leave: onLeave,
          });
        } else {
          // Create row for missing attendance
          rows.push({
            id: `absent-${employee.user_id}-${dateStr}`,
            user_id: employee.user_id,
            user_name: employee.full_name,
            avatar_url: employee.avatar_url,
            clock_in_photo_url: null,
            department: employee.department,
            date: dateStr,
            clock_in_time: null,
            clock_out_time: null,
            is_late: null,
            late_minutes: null,
            tod_submitted: null,
            eod_submitted: null,
            status,
            work_hours: null,
            holiday_name: holidayCheck.isHoliday ? holidayCheck.reason : undefined,
            is_on_leave: onLeave,
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
  }, [users, attendanceRecords, approvedLeaves, dateRange, selectedEmployee, isHoliday]);

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
