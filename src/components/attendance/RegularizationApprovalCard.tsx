import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, User, Calendar, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { RegularizationWithProfile } from '@/hooks/useAttendanceRegularization';

interface RegularizationApprovalCardProps {
  regularization: RegularizationWithProfile;
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, comments?: string) => Promise<void>;
  isProcessing: boolean;
}

export function RegularizationApprovalCard({
  regularization,
  onApprove,
  onReject,
  isProcessing,
}: RegularizationApprovalCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [comments, setComments] = useState('');

  const employeeName = regularization.profiles?.full_name || 'Unknown Employee';
  const initials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleApprove = async () => {
    await onApprove(regularization.id, comments || undefined);
    setShowActions(false);
    setComments('');
  };

  const handleReject = async () => {
    await onReject(regularization.id, comments || undefined);
    setShowActions(false);
    setComments('');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{employeeName}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(regularization.request_date), 'EEEE, MMM dd, yyyy')}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Requested Times */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Requested Clock-in</p>
              <p className="font-medium">{formatTime(regularization.requested_clock_in)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Requested Clock-out</p>
              <p className="font-medium">{formatTime(regularization.requested_clock_out)}</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reason
          </p>
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
            {regularization.reason}
          </p>
        </div>

        {/* Submitted Time */}
        <p className="text-xs text-muted-foreground">
          Submitted {format(new Date(regularization.created_at), 'MMM dd, yyyy \'at\' hh:mm a')}
        </p>

        {/* Action Buttons */}
        <Collapsible open={showActions} onOpenChange={setShowActions}>
          <div className="flex gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={isProcessing}>
                Review Request
              </Button>
            </CollapsibleTrigger>
            <Button
              size="icon"
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>

          <CollapsibleContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Admin Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments for the employee..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
