import { useState, useCallback } from 'react';
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
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      if (error) throw error;
      setTodayAttendance(data || []);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkClockIn = useCallback(async (
    userIds: string[],
    notes?: string
  ): Promise<BulkAttendanceResult> => {
    setIsProcessing(true);
    const result: BulkAttendanceResult = { success: [], failed: [] };
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // Check which users already have attendance today
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('user_id')
        .eq('date', today)
        .in('user_id', userIds);

      const existingUserIds = new Set(existingAttendance?.map(a => a.user_id) || []);
      
      // Filter out users who already clocked in
      const usersToClockIn = userIds.filter(id => !existingUserIds.has(id));
      const alreadyClockedIn = userIds.filter(id => existingUserIds.has(id));

      // Add already clocked in users to failed
      alreadyClockedIn.forEach(userId => {
        result.failed.push({ userId, error: 'Already clocked in today' });
      });

      if (usersToClockIn.length === 0) {
        toast({
          title: 'No Action Needed',
          description: 'All selected employees have already clocked in today.',
        });
        return result;
      }

      // Create attendance records for remaining users
      const attendanceRecords = usersToClockIn.map(userId => ({
        user_id: userId,
        date: today,
        clock_in_time: now.toISOString(),
        notes: notes ? `[Admin Bulk Clock-In] ${notes}` : '[Admin Bulk Clock-In]',
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
        description: `Successfully clocked in ${result.success.length} employee(s).${result.failed.length > 0 ? ` ${result.failed.length} failed.` : ''}`,
      });

      await fetchTodayAttendance();
      return result;
    } catch (error: any) {
      console.error('Bulk clock in error:', error);
      toast({
        title: 'Bulk Clock-In Failed',
        description: error.message || 'Failed to clock in employees.',
        variant: 'destructive',
      });
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, fetchTodayAttendance]);

  const bulkClockOut = useCallback(async (
    userIds: string[],
    notes?: string
  ): Promise<BulkAttendanceResult> => {
    setIsProcessing(true);
    const result: BulkAttendanceResult = { success: [], failed: [] };
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // Get attendance records for selected users that are clocked in but not out
      const { data: attendanceToUpdate, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today)
        .in('user_id', userIds)
        .not('clock_in_time', 'is', null)
        .is('clock_out_time', null);

      if (fetchError) throw fetchError;

      const usersWithAttendance = new Set(attendanceToUpdate?.map(a => a.user_id) || []);
      
      // Mark users without valid attendance as failed
      userIds.forEach(userId => {
        if (!usersWithAttendance.has(userId)) {
          result.failed.push({ userId, error: 'Not clocked in today or already clocked out' });
        }
      });

      if (!attendanceToUpdate || attendanceToUpdate.length === 0) {
        toast({
          title: 'No Action Needed',
          description: 'No employees are eligible for clock-out.',
        });
        return result;
      }

      // Update attendance records
      const attendanceIds = attendanceToUpdate.map(a => a.id);
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          clock_out_time: now.toISOString(),
          notes: notes 
            ? supabase.rpc ? `[Admin Bulk Clock-Out] ${notes}` : `[Admin Bulk Clock-Out] ${notes}`
            : '[Admin Bulk Clock-Out]',
        })
        .in('id', attendanceIds);

      if (updateError) throw updateError;

      result.success = attendanceToUpdate.map(a => a.user_id);

      toast({
        title: 'Bulk Clock-Out Complete',
        description: `Successfully clocked out ${result.success.length} employee(s).${result.failed.length > 0 ? ` ${result.failed.length} failed.` : ''}`,
      });

      await fetchTodayAttendance();
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
  }, [toast, fetchTodayAttendance]);

  const getAttendanceStatus = useCallback((userId: string) => {
    const attendance = todayAttendance.find(a => a.user_id === userId);
    if (!attendance) return 'not_clocked_in';
    if (attendance.clock_out_time) return 'clocked_out';
    if (attendance.clock_in_time) return 'clocked_in';
    return 'not_clocked_in';
  }, [todayAttendance]);

  return {
    isProcessing,
    isLoading,
    todayAttendance,
    bulkClockIn,
    bulkClockOut,
    fetchTodayAttendance,
    getAttendanceStatus,
  };
}
