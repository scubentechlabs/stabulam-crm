import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, IndianRupee, Check, X, Eye, MoreHorizontal, Briefcase } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExtraWorkWithProfile } from '@/hooks/useExtraWork';

interface ExtraWorkApprovalTableProps {
  extraWorkList: ExtraWorkWithProfile[];
  onApprove: (id: string, comments?: string, adjustedCompensation?: number) => void;
  onReject: (id: string, comments?: string) => void;
  isProcessing: boolean;
  emptyMessage?: string;
}

export function ExtraWorkApprovalTable({ 
  extraWorkList, 
  onApprove, 
  onReject, 
  isProcessing,
  emptyMessage = 'No pending extra work requests'
}: ExtraWorkApprovalTableProps) {
  const [selectedExtraWork, setSelectedExtraWork] = useState<ExtraWorkWithProfile | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [adjustedCompensation, setAdjustedCompensation] = useState(0);

  const openDialog = (extraWork: ExtraWorkWithProfile, type: 'view' | 'approve' | 'reject') => {
    setSelectedExtraWork(extraWork);
    setDialogType(type);
    setComments('');
    setAdjustedCompensation(extraWork.compensation_amount || 0);
  };

  const closeDialog = () => {
    setSelectedExtraWork(null);
    setDialogType(null);
    setComments('');
  };

  const handleApprove = () => {
    if (selectedExtraWork) {
      const compensation = adjustedCompensation !== selectedExtraWork.compensation_amount 
        ? adjustedCompensation 
        : undefined;
      onApprove(selectedExtraWork.id, comments || undefined, compensation);
      closeDialog();
    }
  };

  const handleReject = () => {
    if (selectedExtraWork) {
      onReject(selectedExtraWork.id, comments || undefined);
      closeDialog();
    }
  };

  if (extraWorkList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
        <p className="text-sm mt-1">All caught up! 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Hours</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Compensation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extraWorkList.map((ew) => (
              <TableRow key={ew.id}>
                <TableCell className="font-medium">
                  {ew.profiles?.full_name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(ew.work_date), 'PP')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{ew.hours} hr{ew.hours > 1 ? 's' : ''}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {ew.task_description}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600 font-semibold flex items-center justify-end gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {ew.compensation_amount?.toLocaleString('en-IN') || 0}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => openDialog(ew, 'approve')}
                      disabled={isProcessing}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDialog(ew, 'reject')}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => openDialog(ew, 'view')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDialog(ew, 'approve')}>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDialog(ew, 'reject')}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={dialogType === 'view'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extra Work Details</DialogTitle>
            <DialogDescription>
              {selectedExtraWork && `${selectedExtraWork.profiles?.full_name} - ${format(new Date(selectedExtraWork.work_date), 'PPP')}`}
            </DialogDescription>
          </DialogHeader>
          {selectedExtraWork && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-medium">{selectedExtraWork.hours} hour{selectedExtraWork.hours > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compensation</p>
                  <p className="font-medium text-green-600">₹{selectedExtraWork.compensation_amount?.toLocaleString('en-IN') || 0}</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Task Description</p>
                <p className="text-sm">{selectedExtraWork.task_description}</p>
              </div>
              
              {selectedExtraWork.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{selectedExtraWork.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Close</Button>
            <Button variant="destructive" onClick={() => setDialogType('reject')}>Reject</Button>
            <Button onClick={() => setDialogType('approve')}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialogType === 'approve'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Extra Work</DialogTitle>
            <DialogDescription>
              Approve {selectedExtraWork?.profiles?.full_name}'s extra work for {selectedExtraWork?.hours} hour{selectedExtraWork?.hours && selectedExtraWork.hours > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation Amount (₹)</Label>
              <Input
                id="compensation"
                type="number"
                value={adjustedCompensation}
                onChange={(e) => setAdjustedCompensation(Number(e.target.value))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Default: ₹{selectedExtraWork?.compensation_amount} for {selectedExtraWork?.hours} hour{selectedExtraWork?.hours && selectedExtraWork.hours > 1 ? 's' : ''}
              </p>
            </div>
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
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogType === 'reject'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Extra Work</DialogTitle>
            <DialogDescription>
              Reject {selectedExtraWork?.profiles?.full_name}'s extra work request
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
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
