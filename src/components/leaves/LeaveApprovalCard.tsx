import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, MessageSquare, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LeaveWithProfile } from '@/hooks/useLeaves';

interface LeaveApprovalCardProps {
  leave: LeaveWithProfile;
  onApprove: (id: string, comments?: string, penalty?: number) => void;
  onReject: (id: string, comments?: string) => void;
  isProcessing: boolean;
}

export function LeaveApprovalCard({ leave, onApprove, onReject, isProcessing }: LeaveApprovalCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [penalty, setPenalty] = useState(leave.has_advance_notice ? 0 : 250);

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

  const handleApprove = () => {
    onApprove(leave.id, comments || undefined, penalty);
    setShowApproveDialog(false);
    setComments('');
  };

  const handleReject = () => {
    onReject(leave.id, comments || undefined);
    setShowRejectDialog(false);
    setComments('');
  };

  return (
    <>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {leave.profiles && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{leave.profiles.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateRange()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getLeaveTypeBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Advance Notice Status */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={leave.has_advance_notice ? 'text-green-600' : 'text-destructive font-medium'}>
              {leave.has_advance_notice ? '✓ 48+ hours advance notice' : '⚠ No advance notice - Penalty recommended: ₹250'}
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

          {/* Monthly Salary Info */}
          {leave.profiles?.monthly_salary && (
            <div className="text-xs text-muted-foreground">
              Employee Salary: ₹{leave.profiles.monthly_salary.toLocaleString('en-IN')}/month
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            className="flex-1"
            onClick={() => setShowApproveDialog(true)}
            disabled={isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </CardFooter>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Approve {leave.profiles?.full_name}'s leave request for {formatDateRange()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!leave.has_advance_notice && (
              <div className="space-y-2">
                <Label htmlFor="penalty">Penalty Amount (₹)</Label>
                <Input
                  id="penalty"
                  type="number"
                  value={penalty}
                  onChange={(e) => setPenalty(Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: ₹250 for leaves without 48-hour notice
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="approve-comments">Comments (Optional)</Label>
              <Textarea
                id="approve-comments"
                placeholder="Add any comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Reject {leave.profiles?.full_name}'s leave request for {formatDateRange()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comments">Reason for Rejection</Label>
              <Textarea
                id="reject-comments"
                placeholder="Provide a reason for rejection..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
