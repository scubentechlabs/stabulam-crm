import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

interface BulkAttendanceResult {
  success: string[];
  failed: { userId: string; error: string }[];
}

export function useBulkAttendance() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDateAttendance, setSelectedDateAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchAttendanceForDate = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', dateStr);

      if (error) throw error;
      setSelectedDateAttendance(data || []);
      setSelectedDate(date);
    } catch (error) {
      console.error('Error fetching attendance for date:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkClockIn = useCallback(async (
    userIds: string[],
    date: Date,
    clockInTime: string,
    notes?: string
  ): Promise<BulkAttendanceResult> => {
    setIsProcessing(true);
    const result: BulkAttendanceResult = { success: [], failed: [] };
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      // Check which users already have attendance for this date
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('user_id')
        .eq('date', dateStr)
        .in('user_id', userIds);

      const existingUserIds = new Set(existingAttendance?.map(a => a.user_id) || []);
      
      // Filter out users who already clocked in
      const usersToClockIn = userIds.filter(id => !existingUserIds.has(id));
      const alreadyClockedIn = userIds.filter(id => existingUserIds.has(id));

      // Add already clocked in users to failed
      alreadyClockedIn.forEach(userId => {
        result.failed.push({ userId, error: 'Already has attendance for this date' });
      });

      if (usersToClockIn.length === 0) {
        toast({
          title: 'No Action Needed',
          description: 'All selected employees already have attendance for this date.',
        });
        return result;
      }

      // Create clock-in datetime
      const [hours, minutes] = clockInTime.split(':').map(Number);
      const clockInDateTime = new Date(date);
      clockInDateTime.setHours(hours, minutes, 0, 0);

      // Create attendance records for remaining users
      const attendanceRecords = usersToClockIn.map(userId => ({
        user_id: userId,
        date: dateStr,
        clock_in_time: clockInDateTime.toISOString(),
        notes: notes ? `[Admin Bulk] ${notes}` : '[Admin Bulk Attendance]',
        is_late: false,
        late_minutes: 0,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select();

      if (error) throw error;

      result.success = data?.map(a => a.user_id) || [];

      toast({
        title: 'Bulk Clock-In Complete',
        description: `Successfully marked attendance for ${result.success.length} employee(s).${result.failed.length > 0 ? ` ${result.failed.length} already had records.` : ''}`,
      });

      await fetchAttendanceForDate(date);
      return result;
    } catch (error: any) {
      console.error('Bulk clock in error:', error);
      toast({
        title: 'Bulk Clock-In Failed',
        description: error.message || 'Failed to mark attendance.',
        variant: 'destructive',
      });
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, fetchAttendanceForDate]);

  const bulkClockOut = useCallback(async (
    userIds: string[],
    date: Date,
    clockOutTime: string,
    notes?: string
  ): Promise<BulkAttendanceResult> => {
    setIsProcessing(true);
    const result: BulkAttendanceResult = { success: [], failed: [] };
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      // Get attendance records for selected users that are clocked in but not out
      const { data: attendanceToUpdate, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', dateStr)
        .in('user_id', userIds)
        .not('clock_in_time', 'is', null)
        .is('clock_out_time', null);

      if (fetchError) throw fetchError;

      const usersWithAttendance = new Set(attendanceToUpdate?.map(a => a.user_id) || []);
      
      // Mark users without valid attendance as failed
      userIds.forEach(userId => {
        if (!usersWithAttendance.has(userId)) {
          result.failed.push({ userId, error: 'Not clocked in or already clocked out for this date' });
        }
      });

      if (!attendanceToUpdate || attendanceToUpdate.length === 0) {
        toast({
          title: 'No Action Needed',
          description: 'No employees are eligible for clock-out.',
        });
        return result;
      }

      // Create clock-out datetime
      const [hours, minutes] = clockOutTime.split(':').map(Number);
      const clockOutDateTime = new Date(date);
      clockOutDateTime.setHours(hours, minutes, 0, 0);

      // Update attendance records
      const attendanceIds = attendanceToUpdate.map(a => a.id);
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          clock_out_time: clockOutDateTime.toISOString(),
          notes: notes ? `[Admin Bulk] ${notes}` : '[Admin Bulk Attendance]',
        })
        .in('id', attendanceIds);

      if (updateError) throw updateError;

      result.success = attendanceToUpdate.map(a => a.user_id);

      toast({
        title: 'Bulk Clock-Out Complete',
        description: `Successfully clocked out ${result.success.length} employee(s).${result.failed.length > 0 ? ` ${result.failed.length} not eligible.` : ''}`,
      });

      await fetchAttendanceForDate(date);
      return result;
    } catch (error: any) {
      console.error('Bulk clock out error:', error);
      toast({
        title: 'Bulk Clock-Out Failed',
        description: error.message || 'Failed to clock out employees.',
        variant: 'destructive',
      });
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, fetchAttendanceForDate]);

  const bulkMarkFullDay = useCallback(async (
    userIds: string[],
    date: Date,
    clockInTime: string,
    clockOutTime: string,
    notes?: string
  ): Promise<BulkAttendanceResult> => {
    setIsProcessing(true);
    const result: BulkAttendanceResult = { success: [], failed: [] };
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      // Check which users already have attendance for this date
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('user_id')
        .eq('date', dateStr)
        .in('user_id', userIds);

      const existingUserIds = new Set(existingAttendance?.map(a => a.user_id) || []);
      
      // Filter out users who already have attendance
      const usersToMark = userIds.filter(id => !existingUserIds.has(id));
      const alreadyMarked = userIds.filter(id => existingUserIds.has(id));

      // Add already marked users to failed
      alreadyMarked.forEach(userId => {
        result.failed.push({ userId, error: 'Already has attendance for this date' });
      });

      if (usersToMark.length === 0) {
        toast({
          title: 'No Action Needed',
          description: 'All selected employees already have attendance for this date.',
        });
        return result;
      }

      // Create clock-in and clock-out datetimes
      const [inHours, inMinutes] = clockInTime.split(':').map(Number);
      const clockInDateTime = new Date(date);
      clockInDateTime.setHours(inHours, inMinutes, 0, 0);

      const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
      const clockOutDateTime = new Date(date);
      clockOutDateTime.setHours(outHours, outMinutes, 0, 0);

      // Create attendance records
      const attendanceRecords = usersToMark.map(userId => ({
        user_id: userId,
        date: dateStr,
        clock_in_time: clockInDateTime.toISOString(),
        clock_out_time: clockOutDateTime.toISOString(),
        notes: notes ? `[Admin Bulk] ${notes}` : '[Admin Bulk Attendance]',
        is_late: false,
        late_minutes: 0,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select();

      if (error) throw error;

      result.success = data?.map(a => a.user_id) || [];

      toast({
        title: 'Bulk Attendance Marked',
        description: `Successfully marked full-day attendance for ${result.success.length} employee(s).${result.failed.length > 0 ? ` ${result.failed.length} already had records.` : ''}`,
      });

      await fetchAttendanceForDate(date);
      return result;
    } catch (error: any) {
      console.error('Bulk mark full day error:', error);
      toast({
        title: 'Bulk Marking Failed',
        description: error.message || 'Failed to mark attendance.',
        variant: 'destructive',
      });
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, fetchAttendanceForDate]);

  const getAttendanceStatus = useCallback((userId: string) => {
    const attendance = selectedDateAttendance.find(a => a.user_id === userId);
    if (!attendance) return 'not_clocked_in';
    if (attendance.clock_out_time) return 'clocked_out';
    if (attendance.clock_in_time) return 'clocked_in';
    return 'not_clocked_in';
  }, [selectedDateAttendance]);

  return {
    isProcessing,
    isLoading,
    selectedDate,
    selectedDateAttendance,
    bulkClockIn,
    bulkClockOut,
    bulkMarkFullDay,
    fetchAttendanceForDate,
    getAttendanceStatus,
  };
}
