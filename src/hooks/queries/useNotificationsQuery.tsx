import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotificationsQuery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.notifications.list(user?.id || '');

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(n => ({
        ...n,
        is_read: n.is_read ?? false,
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Optimistically update cache
          queryClient.setQueryData<Notification[]>(queryKey, (old) => {
            if (!old) return [newNotification];
            return [newNotification, ...old];
          });
          
          // Show toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          queryClient.setQueryData<Notification[]>(queryKey, (old) => {
            if (!old) return [];
            return old.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey, toast]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      
      queryClient.setQueryData<Notification[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      
      queryClient.setQueryData<Notification[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map(n => ({ ...n, is_read: true }));
      });
    },
    onSuccess: () => {
      toast({ title: 'Done', description: 'All notifications marked as read' });
    },
  });

  const notifications = notificationsQuery.data || [];
  const unreadNotifications = notifications.filter(n => !n.is_read);

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    leaveNotifications: notifications.filter(n => 
      ['leave_request', 'request_approved', 'request_rejected'].includes(n.notification_type)
    ),
    extraWorkNotifications: notifications.filter(n => 
      n.notification_type === 'extra_work_request'
    ),
    shootNotifications: notifications.filter(n => 
      n.notification_type === 'shoot_reminder'
    ),
    taskNotifications: notifications.filter(n => 
      ['missing_tod', 'missing_eod', 'task_assigned'].includes(n.notification_type)
    ),
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    refreshNotifications: () => queryClient.invalidateQueries({ queryKey }),
  };
}
