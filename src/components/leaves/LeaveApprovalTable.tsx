import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, Check, X, Eye, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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
import type { LeaveWithProfile } from '@/hooks/useLeaves';

interface LeaveApprovalTableProps {
  leaves: LeaveWithProfile[];
  onApprove: (id: string, comments?: string, penalty?: number) => void;
  onReject: (id: string, comments?: string) => void;
  isProcessing: boolean;
  emptyMessage?: string;
}

export function LeaveApprovalTable({ 
  leaves, 
  onApprove, 
  onReject, 
  isProcessing,
  emptyMessage = 'No pending leave requests'
}: LeaveApprovalTableProps) {
  const [selectedLeave, setSelectedLeave] = useState<LeaveWithProfile | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'approve' | 'reject' | 'bulk-approve' | 'bulk-reject' | null>(null);
  const [comments, setComments] = useState('');
  const [penalty, setPenalty] = useState(0);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const {
    selectedCount,
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleItem,
    toggleAll,
    clearSelection,
  } = useBulkSelection(leaves);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'a', ctrlKey: true, action: toggleAll, description: 'Select all' },
    { key: 'Enter', action: () => selectedCount > 0 && setDialogType('bulk-approve'), description: 'Approve selected' },
    { key: 'Delete', action: () => selectedCount > 0 && setDialogType('bulk-reject'), description: 'Reject selected' },
    { key: 'Backspace', action: () => selectedCount > 0 && setDialogType('bulk-reject'), description: 'Reject selected' },
    { key: 'Escape', action: clearSelection, description: 'Clear selection' },
  ], [toggleAll, selectedCount, clearSelection]);

  useKeyboardShortcuts(shortcuts, dialogType === null);

  const getLeaveTypeLabel = (leave: LeaveWithProfile) => {
    switch (leave.leave_type) {
      case 'half_day':
        return `Half Day (${leave.half_day_period})`;
      case 'full_day':
        return 'Full Day';
      case 'multiple_days':
        return 'Multiple Days';
      default:
        return leave.leave_type;
    }
  };

  const formatDateRange = (leave: LeaveWithProfile) => {
    if (leave.leave_type === 'half_day' || leave.start_date === leave.end_date) {
      return format(new Date(leave.start_date), 'PP');
    }
    return `${format(new Date(leave.start_date), 'PP')} - ${format(new Date(leave.end_date), 'PP')}`;
  };

  const openDialog = (leave: LeaveWithProfile, type: 'view' | 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setDialogType(type);
    setComments('');
    setPenalty(leave.has_advance_notice ? 0 : 250);
  };

  const closeDialog = () => {
    setSelectedLeave(null);
    setDialogType(null);
    setComments('');
  };

  const handleApprove = () => {
    if (selectedLeave) {
      onApprove(selectedLeave.id, comments || undefined, penalty);
      closeDialog();
    }
  };

  const handleReject = () => {
    if (selectedLeave) {
      onReject(selectedLeave.id, comments || undefined);
      closeDialog();
    }
  };

  const handleBulkApprove = async () => {
    setBulkProcessing(true);
    for (const item of selectedItems) {
      const defaultPenalty = item.has_advance_notice ? 0 : 250;
      await onApprove(item.id, comments || undefined, defaultPenalty);
    }
    clearSelection();
    setBulkProcessing(false);
    closeDialog();
  };

  const handleBulkReject = async () => {
    setBulkProcessing(true);
    for (const item of selectedItems) {
      await onReject(item.id, comments || undefined);
    }
    clearSelection();
    setBulkProcessing(false);
    closeDialog();
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
        <p className="text-sm mt-1">All caught up! 🎉</p>
      </div>
    );
  }

  return (
    <>
      <BulkActionsBar
        selectedCount={selectedCount}
        onApproveAll={() => setDialogType('bulk-approve')}
        onRejectAll={() => setDialogType('bulk-reject')}
        onClearSelection={clearSelection}
        isProcessing={bulkProcessing}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className={isPartiallySelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Advance Notice</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave.id} data-state={isSelected(leave.id) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected(leave.id)}
                    onCheckedChange={() => toggleItem(leave.id)}
                    aria-label={`Select ${leave.profiles?.full_name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {leave.profiles?.full_name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="whitespace-nowrap">{formatDateRange(leave)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getLeaveTypeLabel(leave)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {leave.has_advance_notice ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Yes</Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">No</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {leave.reason || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => openDialog(leave, 'approve')}
                      disabled={isProcessing}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDialog(leave, 'reject')}
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
                        <DropdownMenuItem onClick={() => openDialog(leave, 'view')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDialog(leave, 'approve')}>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDialog(leave, 'reject')}
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
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              {selectedLeave && `${selectedLeave.profiles?.full_name} - ${formatDateRange(selectedLeave)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getLeaveTypeLabel(selectedLeave)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Advance Notice</p>
                  <p className="font-medium">{selectedLeave.has_advance_notice ? 'Yes (48+ hours)' : 'No'}</p>
                </div>
              </div>
              
              {selectedLeave.reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p>{selectedLeave.reason}</p>
                </div>
              )}
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Work Delegation</p>
                <p className="text-sm">{selectedLeave.delegation_notes}</p>
              </div>
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
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Approve {selectedLeave?.profiles?.full_name}'s leave request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLeave && !selectedLeave.has_advance_notice && (
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
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Reject {selectedLeave?.profiles?.full_name}'s leave request
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

      {/* Bulk Approve Dialog */}
      <Dialog open={dialogType === 'bulk-approve'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedCount} Leave Requests</DialogTitle>
            <DialogDescription>
              This will approve all selected leave requests. Default penalties will be applied for leaves without advance notice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-approve-comments">Comments (Optional)</Label>
              <Textarea
                id="bulk-approve-comments"
                placeholder="Add comments for all selected requests..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleBulkApprove} disabled={bulkProcessing}>
              {bulkProcessing ? 'Processing...' : `Approve ${selectedCount} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={dialogType === 'bulk-reject'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedCount} Leave Requests</DialogTitle>
            <DialogDescription>
              This will reject all selected leave requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-reject-comments">Reason for Rejection</Label>
              <Textarea
                id="bulk-reject-comments"
                placeholder="Provide a reason for rejecting all selected requests..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkReject} disabled={bulkProcessing}>
              {bulkProcessing ? 'Processing...' : `Reject ${selectedCount} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
