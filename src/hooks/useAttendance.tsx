import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];

interface TodayAttendance extends Attendance {
  canClockIn: boolean;
  canClockOut: boolean;
  canSubmitExtraWork: boolean;
}

export function useAttendance() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodayAttendance({
          ...data,
          canClockIn: !data.clock_in_time,
          canClockOut: !!data.clock_in_time && !data.clock_out_time,
          canSubmitExtraWork: !!data.clock_out_time,
        });
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const calculateLateStatus = useCallback((clockInTime: Date) => {
    if (!profile?.work_start_time) return { isLate: false, lateMinutes: 0 };

    const [hours, minutes] = profile.work_start_time.split(':').map(Number);
    const startTime = new Date(clockInTime);
    startTime.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.floor((clockInTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    return {
      isLate: diffMinutes > 0,
      lateMinutes: Math.max(0, diffMinutes),
    };
  }, [profile]);

  const clockIn = useCallback(async (
    photoUrl: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ) => {
    if (!user) return null;

    setIsClockingIn(true);
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const { isLate, lateMinutes } = calculateLateStatus(now);

      const attendanceData: AttendanceInsert = {
        user_id: user.id,
        date: today,
        clock_in_time: now.toISOString(),
        clock_in_photo_url: photoUrl,
        clock_in_location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        } : null,
        is_late: isLate,
        late_minutes: lateMinutes,
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: isLate ? 'Clocked In (Late)' : 'Clocked In Successfully',
        description: isLate 
          ? `You are ${lateMinutes} minutes late. Please submit your TOD.`
          : 'Please submit your Task of the Day.',
      });

      await fetchTodayAttendance();
      return data;
    } catch (error: any) {
      console.error('Clock in error:', error);
      toast({
        title: 'Clock In Failed',
        description: error.message || 'Failed to clock in. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsClockingIn(false);
    }
  }, [user, calculateLateStatus, toast, fetchTodayAttendance]);

  const clockOut = useCallback(async () => {
    if (!user || !todayAttendance) return null;

    setIsClockingOut(true);
    
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from('attendance')
        .update({
          clock_out_time: now.toISOString(),
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Clocked Out Successfully',
        description: 'Have a great evening! You can now submit extra work if applicable.',
      });

      await fetchTodayAttendance();
      return data;
    } catch (error: any) {
      console.error('Clock out error:', error);
      toast({
        title: 'Clock Out Failed',
        description: error.message || 'Failed to clock out. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsClockingOut(false);
    }
  }, [user, todayAttendance, toast, fetchTodayAttendance]);

  const updateTodStatus = useCallback(async (submitted: boolean) => {
    if (!todayAttendance) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .update({ tod_submitted: submitted })
        .eq('id', todayAttendance.id);

      if (error) throw error;
      await fetchTodayAttendance();
    } catch (error) {
      console.error('Error updating TOD status:', error);
    }
  }, [todayAttendance, fetchTodayAttendance]);

  const updateEodStatus = useCallback(async (submitted: boolean) => {
    if (!todayAttendance) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .update({ eod_submitted: submitted })
        .eq('id', todayAttendance.id);

      if (error) throw error;
      await fetchTodayAttendance();
    } catch (error) {
      console.error('Error updating EOD status:', error);
    }
  }, [todayAttendance, fetchTodayAttendance]);

  return {
    todayAttendance,
    isLoading,
    isClockingIn,
    isClockingOut,
    clockIn,
    clockOut,
    updateTodStatus,
    updateEodStatus,
    refetch: fetchTodayAttendance,
  };
}
