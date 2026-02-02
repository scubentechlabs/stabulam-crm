import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];

export function useTasks(attendanceId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (attendanceId) {
        query = query.eq('attendance_id', attendanceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, attendanceId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (
    title: string,
    description: string | null,
    taskType: TaskType,
    attendanceId?: string
  ) => {
    if (!user) return null;

    setIsSubmitting(true);
    
    try {
      const taskData: TaskInsert = {
        user_id: user.id,
        title,
        description,
        task_type: taskType,
        attendance_id: attendanceId || null,
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Task Added',
        description: taskType === 'tod' ? 'Task of the Day added.' : taskType === 'utod' ? 'UTOD task added.' : 'EOD task added.',
      });

      await fetchTasks();
      return data;
    } catch (error: any) {
      console.error('Add task error:', error);
      toast({
        title: 'Failed to Add Task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, fetchTasks]);

  const updateTask = useCallback(async (
    taskId: string,
    updates: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      pending_reason?: string | null;
    }
  ) => {
    if (!user) return null;

    setIsSubmitting(true);
    
    try {
      const updateData: Partial<Task> = {
        ...updates,
        is_edited: true,
      };

      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      return data;
    } catch (error: any) {
      console.error('Update task error:', error);
      toast({
        title: 'Failed to Update Task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, fetchTasks]);

  const completeAllEod = useCallback(async (
    taskUpdates: { id: string; status: TaskStatus; pending_reason?: string }[]
  ) => {
    if (!user) return false;

    setIsSubmitting(true);
    
    try {
      for (const update of taskUpdates) {
        const updateData: Partial<Task> = {
          status: update.status,
          pending_reason: update.pending_reason || null,
        };

        if (update.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', update.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast({
        title: 'EOD Completed',
        description: 'All tasks have been updated. You can now clock out.',
      });

      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Complete EOD error:', error);
      toast({
        title: 'Failed to Complete EOD',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, fetchTasks]);

  const todTasks = tasks.filter(t => t.task_type === 'tod');
  const utodTasks = tasks.filter(t => t.task_type === 'utod' || t.task_type === 'urgent_tod');
  const eodTasks = tasks.filter(t => t.task_type === 'eod');
  const allTasks = tasks;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return {
    tasks,
    todTasks,
    utodTasks,
    eodTasks,
    allTasks,
    pendingTasks,
    completedTasks,
    isLoading,
    isSubmitting,
    addTask,
    updateTask,
    completeAllEod,
    refetch: fetchTasks,
  };
}
