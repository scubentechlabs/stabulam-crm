import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileUpdateData {
  full_name?: string;
  mobile?: string;
  avatar_url?: string;
}

export function useSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          mobile: data.mobile,
          avatar_url: data.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err };
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    setIsChangingPassword(true);
    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Password change failed',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err };
    } finally {
      setIsChangingPassword(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache busting
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: avatarUrl });

      return { error: null, url: avatarUrl };
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err, url: null };
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return {
    updateProfile,
    changePassword,
    uploadAvatar,
    isUpdating,
    isChangingPassword,
    isUploadingAvatar,
  };
}
