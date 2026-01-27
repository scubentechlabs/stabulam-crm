import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, toggleSubscription } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="text-base">
              Enable push notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              {permission === 'denied' 
                ? 'Notifications are blocked. Please enable them in browser settings.'
                : isSubscribed 
                  ? 'You will receive notifications when the app is closed'
                  : 'Enable to receive notifications outside the app'}
            </p>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={toggleSubscription}
              disabled={permission === 'denied'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
