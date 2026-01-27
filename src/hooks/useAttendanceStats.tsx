import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, differenceInMinutes, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { useRealtimeDashboard } from './useRealtimeDashboard';

interface EmployeeStats {
  userId: string;
  fullName: string;
  department: string | null;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalWorkHours: number;
  averageWorkHours: number;
  onTimePercentage: number;
}

interface DailyStats {
  date: string;
  present: number;
  absent: number;
  late: number;
  onTime: number;
}

interface AttendanceStats {
  employees: EmployeeStats[];
  dailyStats: DailyStats[];
  summary: {
    totalEmployees: number;
    averageAttendance: number;
    averageLatePercentage: number;
    averageWorkHours: number;
  };
}

export function useAttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      // Fetch all active employees
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, department')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch attendance records for the month
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr);

      if (attendanceError) throw attendanceError;

      // Fetch approved leaves for the month
      const { data: leaves, error: leavesError } = await supabase
        .from('leaves')
        .select('*')
        .eq('status', 'approved')
        .lte('start_date', endStr)
        .gte('end_date', startStr);

      if (leavesError) throw leavesError;

      // Calculate working days in the month (excluding weekends)
      const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const workingDays = allDays.filter(day => !isWeekend(day));
      const totalWorkingDays = workingDays.length;

      // Calculate employee stats
      const employeeStats: EmployeeStats[] = (profiles || []).map(profile => {
        const userAttendance = (attendance || []).filter(a => a.user_id === profile.user_id);
        const userLeaves = (leaves || []).filter(l => l.user_id === profile.user_id);

        // Count leave days
        let leaveDays = 0;
        userLeaves.forEach(leave => {
          const leaveStart = parseISO(leave.start_date);
          const leaveEnd = parseISO(leave.end_date);
          const leaveDaysInMonth = eachDayOfInterval({
            start: leaveStart < monthStart ? monthStart : leaveStart,
            end: leaveEnd > monthEnd ? monthEnd : leaveEnd
          }).filter(d => !isWeekend(d)).length;
          
          if (leave.leave_type === 'half_day') {
            leaveDays += 0.5;
          } else {
            leaveDays += leaveDaysInMonth;
          }
        });

        const presentDays = userAttendance.filter(a => a.clock_in_time).length;
        const lateDays = userAttendance.filter(a => a.is_late).length;
        const totalLateMinutes = userAttendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0);
        
        // Calculate work hours
        let totalWorkMinutes = 0;
        userAttendance.forEach(a => {
          if (a.clock_in_time && a.clock_out_time) {
            const clockIn = parseISO(a.clock_in_time);
            const clockOut = parseISO(a.clock_out_time);
            totalWorkMinutes += differenceInMinutes(clockOut, clockIn);
          }
        });
        const totalWorkHours = totalWorkMinutes / 60;
        const averageWorkHours = presentDays > 0 ? totalWorkHours / presentDays : 0;

        // Days employee should have worked (excluding leaves)
        const expectedDays = Math.max(0, totalWorkingDays - leaveDays);
        const absentDays = Math.max(0, expectedDays - presentDays);
        const onTimePercentage = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 100 : 100;

        return {
          userId: profile.user_id,
          fullName: profile.full_name,
          department: profile.department,
          totalDays: expectedDays,
          presentDays,
          absentDays,
          lateDays,
          totalLateMinutes,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          averageWorkHours: Math.round(averageWorkHours * 10) / 10,
          onTimePercentage: Math.round(onTimePercentage),
        };
      });

      // Calculate daily stats
      const dailyStats: DailyStats[] = workingDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAttendance = (attendance || []).filter(a => a.date === dateStr);
        const present = dayAttendance.filter(a => a.clock_in_time).length;
        const late = dayAttendance.filter(a => a.is_late).length;
        const onTime = present - late;
        const absent = (profiles?.length || 0) - present;

        return {
          date: format(day, 'MMM dd'),
          present,
          absent: Math.max(0, absent),
          late,
          onTime,
        };
      });

      // Calculate summary
      const totalEmployees = profiles?.length || 0;
      const averageAttendance = employeeStats.length > 0
        ? employeeStats.reduce((sum, e) => sum + (e.presentDays / Math.max(1, e.totalDays) * 100), 0) / employeeStats.length
        : 0;
      const averageLatePercentage = employeeStats.length > 0
        ? employeeStats.reduce((sum, e) => sum + (100 - e.onTimePercentage), 0) / employeeStats.length
        : 0;
      const averageWorkHours = employeeStats.length > 0
        ? employeeStats.reduce((sum, e) => sum + e.averageWorkHours, 0) / employeeStats.length
        : 0;

      setStats({
        employees: employeeStats,
        dailyStats,
        summary: {
          totalEmployees,
          averageAttendance: Math.round(averageAttendance),
          averageLatePercentage: Math.round(averageLatePercentage),
          averageWorkHours: Math.round(averageWorkHours * 10) / 10,
        },
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Subscribe to realtime updates
  useRealtimeDashboard({
    tables: ['attendance', 'leaves'],
    onDataChange: fetchStats,
    enabled: true,
  });

  return {
    stats,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    refetch: fetchStats,
  };
}
