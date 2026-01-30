import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, User, FileText, Check, X } from 'lucide-react';
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
import type { ExtraWorkWithProfile } from '@/hooks/useExtraWork';

interface ExtraWorkApprovalCardProps {
  extraWork: ExtraWorkWithProfile;
  onApprove: (id: string, comments?: string, adjustedCompensation?: number) => void;
  onReject: (id: string, comments?: string) => void;
  isProcessing: boolean;
}

export function ExtraWorkApprovalCard({ 
  extraWork, 
  onApprove, 
  onReject, 
  isProcessing 
}: ExtraWorkApprovalCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [adjustedCompensation, setAdjustedCompensation] = useState(extraWork.compensation_amount || 0);

  const handleApprove = () => {
    const compensation = adjustedCompensation !== extraWork.compensation_amount 
      ? adjustedCompensation 
      : undefined;
    onApprove(extraWork.id, comments || undefined, compensation);
    setShowApproveDialog(false);
    setComments('');
  };

  const handleReject = () => {
    onReject(extraWork.id, comments || undefined);
    setShowRejectDialog(false);
    setComments('');
  };

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {extraWork.profiles && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{extraWork.profiles.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{extraWork.hours} Hour{extraWork.hours > 1 ? 's' : ''}</span>
                </div>
                <div className="text-muted-foreground">
                  {format(new Date(extraWork.work_date), 'PPP')}
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {extraWork.hours} hr{extraWork.hours > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Task Description */}
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Task Description</p>
                <p className="text-sm">{extraWork.task_description}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {extraWork.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes: </span>
              <span>{extraWork.notes}</span>
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
            <DialogTitle>Approve Extra Work</DialogTitle>
            <DialogDescription>
              Approve {extraWork.profiles?.full_name}'s extra work request for {extraWork.hours} hour{extraWork.hours > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <DialogTitle>Reject Extra Work</DialogTitle>
            <DialogDescription>
              Reject {extraWork.profiles?.full_name}'s extra work request
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
