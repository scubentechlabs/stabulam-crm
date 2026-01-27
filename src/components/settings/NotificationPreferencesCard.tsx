import { Bell, Calendar, Clock, Camera, FileText, DollarSign, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';

interface PreferenceItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function PreferenceItem({ id, icon, label, description, checked, onCheckedChange, disabled }: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="text-base font-medium cursor-pointer">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationPreferencesCard() {
  const { preferences, isLoading, isSaving, updatePreference } = useNotificationPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Unable to load preferences</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <PreferenceItem
            id="leave-notifications"
            icon={<Calendar className="h-5 w-5" />}
            label="Leave Notifications"
            description="Get notified about leave request approvals and rejections"
            checked={preferences.leave_notifications}
            onCheckedChange={(checked) => updatePreference('leave_notifications', checked)}
            disabled={isSaving}
          />
          
          <PreferenceItem
            id="extra-work-notifications"
            icon={<Clock className="h-5 w-5" />}
            label="Extra Work Notifications"
            description="Get notified about extra work request approvals and rejections"
            checked={preferences.extra_work_notifications}
            onCheckedChange={(checked) => updatePreference('extra_work_notifications', checked)}
            disabled={isSaving}
          />
          
          <PreferenceItem
            id="shoot-notifications"
            icon={<Camera className="h-5 w-5" />}
            label="Shoot Notifications"
            description="Get reminders about upcoming shoots and assignments"
            checked={preferences.shoot_notifications}
            onCheckedChange={(checked) => updatePreference('shoot_notifications', checked)}
            disabled={isSaving}
          />
          
          <PreferenceItem
            id="task-notifications"
            icon={<FileText className="h-5 w-5" />}
            label="Task Notifications"
            description="Get reminders about missing TOD and EOD submissions"
            checked={preferences.task_notifications}
            onCheckedChange={(checked) => updatePreference('task_notifications', checked)}
            disabled={isSaving}
          />
          
          <PreferenceItem
            id="salary-notifications"
            icon={<DollarSign className="h-5 w-5" />}
            label="Salary Notifications"
            description="Get notified when your salary is generated"
            checked={preferences.salary_notifications}
            onCheckedChange={(checked) => updatePreference('salary_notifications', checked)}
            disabled={isSaving}
          />
        </div>

        <Separator className="my-4" />

        <PreferenceItem
          id="push-enabled"
          icon={<Bell className="h-5 w-5" />}
          label="Push Notifications"
          description="Receive notifications even when the app is closed"
          checked={preferences.push_enabled}
          onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
          disabled={isSaving}
        />
      </CardContent>
    </Card>
  );
}
