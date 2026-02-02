import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceSelfieAvatarProps {
  clockInPhotoUrl: string | null;
  avatarUrl: string | null;
  userName: string;
}

export function AttendanceSelfieAvatar({ 
  clockInPhotoUrl, 
  avatarUrl, 
  userName 
}: AttendanceSelfieAvatarProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      if (!clockInPhotoUrl) {
        setSignedUrl(null);
        return;
      }

      // Extract the path from the full URL
      // URL format: https://...supabase.co/storage/v1/object/public/attendance-photos/user-id/filename.jpg
      const match = clockInPhotoUrl.match(/attendance-photos\/(.+)$/);
      if (!match) {
        setSignedUrl(null);
        return;
      }

      const filePath = match[1];

      try {
        const { data, error } = await supabase.storage
          .from('attendance-photos')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignedUrl(null);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setSignedUrl(null);
      }
    }

    getSignedUrl();
  }, [clockInPhotoUrl]);

  const displayUrl = signedUrl || avatarUrl || undefined;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
      <AvatarImage src={displayUrl} />
      <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
