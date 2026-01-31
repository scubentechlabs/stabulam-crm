import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
// Extended task types - includes new enum values added via migration
type TaskType = 'tod' | 'eod' | 'utod' | 'urgent_tod';
type DbTaskType = Database['public']['Enums']['task_type'];

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

    setIsLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      // If a specific user is selected, filter by that user
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      } else if (!isAdmin) {
        // Non-admins can only see their own tasks
        query = query.eq('user_id', user.id);
      }

      // Filter by month if provided
      if (selectedMonth) {
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        
        query = query
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());
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
  }, [user, isAdmin, selectedUserId, selectedMonth, toast]);

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
    if (!user || !isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can create tasks',
        variant: 'destructive',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const taskData: TaskInsert = {
        user_id: assignedUserId,
        title,
        description,
        task_type: taskType as DbTaskType,
        submitted_at: taskDate.toISOString(),
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
    const dateKey = task.submitted_at 
      ? new Date(task.submitted_at).toISOString().split('T')[0]
      : new Date(task.created_at).toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, WorkCalendarTask[]>);

  // Filter tasks by type
  const todTasks = tasks.filter(t => t.task_type === 'tod');
  const eodTasks = tasks.filter(t => t.task_type === 'eod');
  const utodTasks = tasks.filter(t => t.task_type === 'utod');
  const urgentTasks = tasks.filter(t => t.task_type === 'urgent_tod');

  return {
    tasks,
    tasksByDate,
    todTasks,
    eodTasks,
    utodTasks,
    urgentTasks,
    isLoading,
    isSubmitting,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
