import { format } from 'date-fns';
import { Calendar, Clock, User, MessageSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { LeaveWithProfile } from '@/hooks/useLeaves';

interface LeaveCardProps {
  leave: LeaveWithProfile;
  onCancel?: (id: string) => void;
  showEmployeeName?: boolean;
}

export function LeaveCard({ leave, onCancel, showEmployeeName }: LeaveCardProps) {
  const getStatusBadge = () => {
    switch (leave.status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getLeaveTypeBadge = () => {
    switch (leave.leave_type) {
      case 'half_day':
        return <Badge variant="outline">Half Day ({leave.half_day_period})</Badge>;
      case 'full_day':
        return <Badge variant="outline">Full Day</Badge>;
      case 'multiple_days':
        return <Badge variant="outline">Multiple Days</Badge>;
    }
  };

  const formatDateRange = () => {
    if (leave.leave_type === 'half_day' || leave.start_date === leave.end_date) {
      return format(new Date(leave.start_date), 'PPP');
    }
    return `${format(new Date(leave.start_date), 'PP')} - ${format(new Date(leave.end_date), 'PP')}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {showEmployeeName && leave.profiles && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{leave.profiles.full_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">{formatDateRange()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getLeaveTypeBadge()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Advance Notice Status */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={leave.has_advance_notice ? 'text-green-600' : 'text-destructive'}>
            {leave.has_advance_notice ? '48+ hours advance notice' : 'No advance notice (penalty may apply)'}
          </span>
        </div>

        {/* Reason */}
        {leave.reason && (
          <div className="text-sm">
            <span className="text-muted-foreground">Reason: </span>
            <span>{leave.reason}</span>
          </div>
        )}

        {/* Delegation Notes */}
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Work Delegation</p>
              <p className="text-sm">{leave.delegation_notes}</p>
            </div>
          </div>
        </div>

        {/* Admin Comments */}
        {leave.admin_comments && (
          <div className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary">
            <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comments</p>
            <p className="text-sm">{leave.admin_comments}</p>
          </div>
        )}

        {/* Penalty Amount */}
        {leave.penalty_amount && leave.penalty_amount > 0 && (
          <div className="text-sm text-destructive">
            Penalty: ₹{leave.penalty_amount.toLocaleString('en-IN')}
          </div>
        )}

        {/* Cancel Button (only for pending leaves) */}
        {leave.status === 'pending' && onCancel && (
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The leave request will be permanently cancelled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancel(leave.id)}>
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
