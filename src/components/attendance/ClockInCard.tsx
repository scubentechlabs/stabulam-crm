import { useState } from 'react';
import { Clock, Camera, MapPin, Loader2, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CameraCapture } from './CameraCapture';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isWorkingDay } from '@/lib/utils';

interface ClockInCardProps {
  onClockInComplete: () => void;
}

export function ClockInCard({ onClockInComplete }: ClockInCardProps) {
  const today = new Date();
  const isSunday = !isWorkingDay(today);
  const { user } = useAuth();
  const { toast } = useToast();
  const { clockIn, isClockingIn } = useAttendance();
  const { getPosition, isLoading: isGettingLocation } = useGeolocation();
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleStartClockIn = () => {
    setShowCamera(true);
  };

  const uploadPhoto = async (imageData: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${user.id}/${timestamp}.jpg`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('attendance-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      return null;
    }
  };

  const handlePhotoCapture = async (imageData: string) => {
    setIsUploading(true);
    
    try {
      // Get location in parallel with photo upload
      const [photoUrl, location] = await Promise.all([
        uploadPhoto(imageData),
        getPosition(),
      ]);

      if (!photoUrl) {
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload photo. Please try again.',
          variant: 'destructive',
        });
        setShowCamera(false);
        return;
      }

      // Clock in with photo and location
      const result = await clockIn(
        photoUrl,
        location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        } : undefined
      );

      if (result) {
        setShowCamera(false);
        onClockInComplete();
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast({
        title: 'Clock In Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowCamera(false);
  };

  const isProcessing = isClockingIn || isUploading || isGettingLocation;

  if (showCamera) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Take Attendance Photo</CardTitle>
          <CardDescription>
            Capture a clear selfie for attendance verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {isUploading ? 'Uploading photo...' : 
                 isGettingLocation ? 'Getting location...' : 
                 'Clocking in...'}
              </p>
            </div>
          ) : (
            <CameraCapture
              onCapture={handlePhotoCapture}
              onCancel={handleCancel}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Show holiday message on Sundays
  if (isSunday) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <PartyPopper className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">It's a Holiday!</CardTitle>
          <CardDescription className="text-base mt-2">
            Today is Sunday - enjoy your day off!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-muted/50 rounded-xl p-6">
            <p className="text-muted-foreground">
              Clock-in is not available on Sundays. Our working week runs from 
              <span className="font-medium text-foreground"> Monday to Saturday</span>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            See you on the next working day! 🌟
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Clock In
        </CardTitle>
        <CardDescription>
          Start your day by capturing your attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
          <Camera className="h-20 w-20 text-muted-foreground/30" />
        </div>
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleStartClockIn}
        >
          <Camera className="h-5 w-5 mr-2" />
          Start Camera
        </Button>
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <MapPin className="h-3 w-3" />
          Location will be captured with your clock-in
        </p>
      </CardContent>
    </Card>
  );
}
