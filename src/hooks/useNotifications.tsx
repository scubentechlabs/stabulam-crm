import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  reference_id?: string;
  reference_type?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications((data || []).map(n => ({
        ...n,
        is_read: n.is_read ?? false,
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Set up real-time subscription
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
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      return { error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { error };
    }
  };

  const markAllAsRead = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      toast({
        title: 'Done',
        description: 'All notifications marked as read',
      });

      return { error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { error };
    }
  };

  const createNotification = async (data: CreateNotificationData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          notification_type: data.notification_type,
          reference_id: data.reference_id || null,
          reference_type: data.reference_type || null,
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { error };
    }
  };

  // Computed values
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  // Group by type
  const leaveNotifications = notifications.filter(n => 
    n.notification_type === 'leave_request' || 
    n.notification_type === 'request_approved' || 
    n.notification_type === 'request_rejected'
  );
  const extraWorkNotifications = notifications.filter(n => 
    n.notification_type === 'extra_work_request'
  );
  const shootNotifications = notifications.filter(n => 
    n.notification_type === 'shoot_reminder'
  );
  const taskNotifications = notifications.filter(n => 
    n.notification_type === 'missing_tod' || 
    n.notification_type === 'missing_eod'
  );

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    leaveNotifications,
    extraWorkNotifications,
    shootNotifications,
    taskNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: fetchNotifications,
  };
}
