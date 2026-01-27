import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, Check, X, Eye, MoreHorizontal, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import type { RegularizationWithProfile } from '@/hooks/useAttendanceRegularization';

interface RegularizationApprovalTableProps {
  regularizations: RegularizationWithProfile[];
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, comments?: string) => Promise<void>;
  isProcessing: boolean;
  emptyMessage?: string;
}

export function RegularizationApprovalTable({ 
  regularizations, 
  onApprove, 
  onReject, 
  isProcessing,
  emptyMessage = 'No pending regularization requests'
}: RegularizationApprovalTableProps) {
  const [selectedRegularization, setSelectedRegularization] = useState<RegularizationWithProfile | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'approve' | 'reject' | 'bulk-approve' | 'bulk-reject' | null>(null);
  const [comments, setComments] = useState('');
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
  } = useBulkSelection(regularizations);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'a', ctrlKey: true, action: toggleAll, description: 'Select all' },
    { key: 'Enter', action: () => selectedCount > 0 && setDialogType('bulk-approve'), description: 'Approve selected' },
    { key: 'Delete', action: () => selectedCount > 0 && setDialogType('bulk-reject'), description: 'Reject selected' },
    { key: 'Backspace', action: () => selectedCount > 0 && setDialogType('bulk-reject'), description: 'Reject selected' },
    { key: 'Escape', action: clearSelection, description: 'Clear selection' },
  ], [toggleAll, selectedCount, clearSelection]);

  useKeyboardShortcuts(shortcuts, dialogType === null);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  };

  const openDialog = (regularization: RegularizationWithProfile, type: 'view' | 'approve' | 'reject') => {
    setSelectedRegularization(regularization);
    setDialogType(type);
    setComments('');
  };

  const closeDialog = () => {
    setSelectedRegularization(null);
    setDialogType(null);
    setComments('');
  };

  const handleApprove = async () => {
    if (selectedRegularization) {
      await onApprove(selectedRegularization.id, comments || undefined);
      closeDialog();
    }
  };

  const handleReject = async () => {
    if (selectedRegularization) {
      await onReject(selectedRegularization.id, comments || undefined);
      closeDialog();
    }
  };

  const handleBulkApprove = async () => {
    setBulkProcessing(true);
    for (const item of selectedItems) {
      await onApprove(item.id, comments || undefined);
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

  if (regularizations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regularizations.map((reg) => {
              const employeeName = reg.profiles?.full_name || 'Unknown Employee';
              const initials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase();

              return (
                <TableRow key={reg.id} data-state={isSelected(reg.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected(reg.id)}
                      onCheckedChange={() => toggleItem(reg.id)}
                      aria-label={`Select ${employeeName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(reg.request_date), 'PP')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-green-500" />
                      <span>{formatTime(reg.requested_clock_in)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-red-500" />
                      <span>{formatTime(reg.requested_clock_out)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {reg.reason}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openDialog(reg, 'approve')}
                        disabled={isProcessing}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDialog(reg, 'reject')}
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
                          <DropdownMenuItem onClick={() => openDialog(reg, 'view')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDialog(reg, 'approve')}>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDialog(reg, 'reject')}
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={dialogType === 'view'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regularization Details</DialogTitle>
            <DialogDescription>
              {selectedRegularization && `${selectedRegularization.profiles?.full_name} - ${format(new Date(selectedRegularization.request_date), 'EEEE, MMMM dd, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRegularization && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clock-in</p>
                    <p className="font-medium">{formatTime(selectedRegularization.requested_clock_in)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clock-out</p>
                    <p className="font-medium">{formatTime(selectedRegularization.requested_clock_out)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p>{selectedRegularization.reason}</p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Submitted {format(new Date(selectedRegularization.created_at), 'MMM dd, yyyy \'at\' hh:mm a')}
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
            <DialogTitle>Approve Regularization</DialogTitle>
            <DialogDescription>
              Approve {selectedRegularization?.profiles?.full_name}'s attendance correction request
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
            <DialogTitle>Reject Regularization</DialogTitle>
            <DialogDescription>
              Reject {selectedRegularization?.profiles?.full_name}'s attendance correction request
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
            <DialogTitle>Approve {selectedCount} Regularization Requests</DialogTitle>
            <DialogDescription>
              This will approve all selected attendance correction requests.
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
            <DialogTitle>Reject {selectedCount} Regularization Requests</DialogTitle>
            <DialogDescription>
              This will reject all selected attendance correction requests.
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
