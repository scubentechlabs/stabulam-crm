import { useState, useCallback } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

export interface AttendanceDay {
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  isLate: boolean;
  lateMinutes: number;
  todSubmitted: boolean;
  eodSubmitted: boolean;
}

export function useAttendanceHistory() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchMonthAttendance = useCallback(async (month: Date) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true });

      if (error) throw error;
      setAttendanceRecords(data || []);
      setCurrentMonth(month);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getAttendanceForDate = useCallback((date: Date): AttendanceDay | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceRecords.find(r => r.date === dateStr);
    
    if (!record) return null;

    return {
      date: record.date,
      clockInTime: record.clock_in_time,
      clockOutTime: record.clock_out_time,
      isLate: record.is_late || false,
      lateMinutes: record.late_minutes || 0,
      todSubmitted: record.tod_submitted || false,
      eodSubmitted: record.eod_submitted || false,
    };
  }, [attendanceRecords]);

  const getMonthStats = useCallback(() => {
    const totalDays = attendanceRecords.length;
    const lateDays = attendanceRecords.filter(r => r.is_late).length;
    const completedDays = attendanceRecords.filter(r => r.clock_out_time).length;
    const totalLateMinutes = attendanceRecords.reduce((acc, r) => acc + (r.late_minutes || 0), 0);

    return {
      totalDays,
      lateDays,
      completedDays,
      onTimeDays: totalDays - lateDays,
      totalLateMinutes,
      avgLateMinutes: lateDays > 0 ? Math.round(totalLateMinutes / lateDays) : 0,
    };
  }, [attendanceRecords]);

  return {
    attendanceRecords,
    isLoading,
    currentMonth,
    fetchMonthAttendance,
    getAttendanceForDate,
    getMonthStats,
  };
}
