import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, Calendar, Clock, Camera, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export default function Notifications() {
  const {
    notifications,
    unreadNotifications,
    leaveNotifications,
    extraWorkNotifications,
    shootNotifications,
    taskNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            Stay updated with important alerts
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead()}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" />
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="h-4 w-4" />
            Leaves
          </TabsTrigger>
          <TabsTrigger value="shoots" className="gap-2">
            <Camera className="h-4 w-4" />
            Shoots
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <FileText className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <NotificationList
            notifications={notifications}
            onMarkRead={markAsRead}
            emptyMessage="No notifications yet"
          />
        </TabsContent>

        <TabsContent value="unread">
          <NotificationList
            notifications={unreadNotifications}
            onMarkRead={markAsRead}
            emptyMessage="You're all caught up!"
          />
        </TabsContent>

        <TabsContent value="leaves">
          <NotificationList
            notifications={leaveNotifications}
            onMarkRead={markAsRead}
            emptyMessage="No leave notifications"
          />
        </TabsContent>

        <TabsContent value="shoots">
          <NotificationList
            notifications={shootNotifications}
            onMarkRead={markAsRead}
            emptyMessage="No shoot notifications"
          />
        </TabsContent>

        <TabsContent value="tasks">
          <NotificationList
            notifications={taskNotifications}
            onMarkRead={markAsRead}
            emptyMessage="No task notifications"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationListProps {
  notifications: any[];
  onMarkRead: (id: string) => void;
  emptyMessage: string;
}

function NotificationList({ notifications, onMarkRead, emptyMessage }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2">
        <div className="space-y-2">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
