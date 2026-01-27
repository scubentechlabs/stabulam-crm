import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  leave_notifications: boolean;
  extra_work_notifications: boolean;
  shoot_notifications: boolean;
  task_notifications: boolean;
  salary_notifications: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the database function to get or create preferences
      const { data, error } = await supabase
        .rpc('get_or_create_notification_preferences', { _user_id: user.id });

      if (error) throw error;
      
      setPreferences(data as NotificationPreferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (
    key: keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    value: boolean
  ): Promise<boolean> => {
    if (!user || !preferences) return false;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      
      toast({
        title: 'Saved',
        description: 'Notification preference updated',
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAllPreferences = async (
    updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!user || !preferences) return false;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Saved',
        description: 'Notification preferences updated',
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    updateAllPreferences,
    refreshPreferences: fetchPreferences,
  };
}
