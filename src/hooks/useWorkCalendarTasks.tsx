import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDateIST, toISTMidnightUTC } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
// Extended task types - standardized to tod, utod, eod (urgent_tod legacy support)
type TaskType = 'tod' | 'utod' | 'eod';
type DbTaskType = Database['public']['Enums']['task_type'];

// IST (Indian Standard Time) is UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface WorkCalendarTask extends Task {
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useWorkCalendarTasks(selectedUserId?: string, selectedMonth?: Date) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<WorkCalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    // Don't fetch if no user is selected yet (wait for useEffect to set it)
    const targetUserId = selectedUserId || user.id;
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      // Filter by month if provided - in IST boundaries, using submitted_at
      if (selectedMonth) {
        const y = selectedMonth.getFullYear();
        const m = selectedMonth.getMonth();

        // Convert IST month start to UTC instant
        const startUTC = new Date(Date.UTC(y, m, 1, 0, 0, 0) - IST_OFFSET_MS);
        const nextMonthStartUTC = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0) - IST_OFFSET_MS);

        query = query
          .gte('submitted_at', startUTC.toISOString())
          .lt('submitted_at', nextMonthStartUTC.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedUserId, selectedMonth, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (
    title: string,
    description: string | null,
    taskType: TaskType,
    assignedUserId: string,
    taskDate: Date
  ) => {
    if (!user) {
      toast({
        title: 'Permission Denied',
        description: 'You must be logged in to create tasks',
        variant: 'destructive',
      });
      return null;
    }

    // Non-admins can only create tasks for themselves
    if (!isAdmin && assignedUserId !== user.id) {
      toast({
        title: 'Permission Denied',
        description: 'You can only create tasks for yourself',
        variant: 'destructive',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      // Convert local date to UTC timestamp representing midnight IST for that date
      const istMidnightUTC = toISTMidnightUTC(taskDate);
      
      const taskData: TaskInsert = {
        user_id: assignedUserId,
        title,
        description,
        task_type: taskType as DbTaskType,
        submitted_at: istMidnightUTC.toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Task Created',
        description: `${taskType.toUpperCase()} task created successfully`,
      });

      await fetchTasks();
      return data;
    } catch (error: any) {
      console.error('Create task error:', error);
      toast({
        title: 'Failed to Create Task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isAdmin, toast, fetchTasks]);

  const updateTask = useCallback(async (
    taskId: string,
    updates: {
      title?: string;
      description?: string | null;
      task_type?: TaskType;
    }
  ) => {
    if (!user || !isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can edit tasks',
        variant: 'destructive',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        is_edited: true,
      };
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.task_type) updateData.task_type = updates.task_type;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Task Updated',
        description: 'Task updated successfully',
      });

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
  }, [user, isAdmin, toast, fetchTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user || !isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can delete tasks',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      // Note: Tasks table doesn't allow DELETE by RLS, so we'll need to handle this
      // For now, we can mark as completed or use a soft delete approach
      toast({
        title: 'Delete Not Allowed',
        description: 'Task deletion is restricted by database policy',
        variant: 'destructive',
      });
      return false;
    } catch (error: any) {
      console.error('Delete task error:', error);
      toast({
        title: 'Failed to Delete Task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isAdmin, toast]);

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    // IMPORTANT: Use IST date keys so tasks don't shift to previous day due to UTC ISO strings.
    const dateKey = task.submitted_at
      ? formatDateIST(task.submitted_at, 'yyyy-MM-dd')
      : formatDateIST(task.created_at, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, WorkCalendarTask[]>);

  // Filter tasks by type (utod includes legacy urgent_tod)
  const todTasks = tasks.filter(t => t.task_type === 'tod');
  const utodTasks = tasks.filter(t => t.task_type === 'utod' || t.task_type === 'urgent_tod');
  const eodTasks = tasks.filter(t => t.task_type === 'eod');

  return {
    tasks,
    tasksByDate,
    todTasks,
    utodTasks,
    eodTasks,
    isLoading,
    isSubmitting,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
