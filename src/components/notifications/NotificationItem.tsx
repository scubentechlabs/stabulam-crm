import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  FileText,
  DollarSign,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/hooks/useNotifications';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: () => void;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  leave_request: <Calendar className="h-5 w-5 text-blue-500" />,
  extra_work_request: <Clock className="h-5 w-5 text-purple-500" />,
  request_approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  request_rejected: <XCircle className="h-5 w-5 text-destructive" />,
  shoot_reminder: <Camera className="h-5 w-5 text-orange-500" />,
  missing_tod: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  missing_eod: <FileText className="h-5 w-5 text-yellow-500" />,
  salary_generated: <DollarSign className="h-5 w-5 text-green-500" />,
};

export function NotificationItem({ notification, onMarkRead, onClick }: NotificationItemProps) {
  const icon = iconMap[notification.notification_type] || <Bell className="h-5 w-5" />;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
        notification.is_read 
          ? 'bg-background hover:bg-muted/50' 
          : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
      )}
    >
      <div className="shrink-0 mt-0.5">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm',
            !notification.is_read && 'font-medium'
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {!notification.is_read && onMarkRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
