import { format } from 'date-fns';
import { Clock, Calendar, MessageSquare, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Regularization } from '@/hooks/useAttendanceRegularization';

interface RegularizationCardProps {
  regularization: Regularization;
}

export function RegularizationCard({ regularization }: RegularizationCardProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  };

  const getStatusBadge = () => {
    switch (regularization.status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(regularization.request_date), 'EEEE, MMM dd, yyyy')}
            </CardTitle>
            <CardDescription>
              Submitted {format(new Date(regularization.created_at), 'MMM dd \'at\' hh:mm a')}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Requested Times */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Clock-in</p>
              <p className="font-medium text-sm">{formatTime(regularization.requested_clock_in)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Clock-out</p>
              <p className="font-medium text-sm">{formatTime(regularization.requested_clock_out)}</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Reason
          </p>
          <p className="text-sm">{regularization.reason}</p>
        </div>

        {/* Admin Comments */}
        {regularization.admin_comments && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Admin Response</p>
            <p className="text-sm italic">{regularization.admin_comments}</p>
          </div>
        )}

        {/* Processed Time */}
        {regularization.processed_at && (
          <p className="text-xs text-muted-foreground pt-1">
            Processed {format(new Date(regularization.processed_at), 'MMM dd, yyyy \'at\' hh:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
