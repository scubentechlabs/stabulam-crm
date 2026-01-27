import { format } from 'date-fns';
import { Calendar, Clock, X, Eye, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import type { LeaveWithProfile } from '@/hooks/useLeaves';

interface LeaveTableProps {
  leaves: LeaveWithProfile[];
  onCancel?: (id: string) => void;
  showEmployeeName?: boolean;
  emptyMessage?: string;
}

export function LeaveTable({ leaves, onCancel, showEmployeeName, emptyMessage = 'No leave requests' }: LeaveTableProps) {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [viewLeave, setViewLeave] = useState<LeaveWithProfile | null>(null);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

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

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showEmployeeName && <TableHead>Employee</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-center">Advance Notice</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave.id}>
                {showEmployeeName && (
                  <TableCell className="font-medium">
                    {leave.profiles?.full_name || 'Unknown'}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="whitespace-nowrap">{formatDateRange(leave)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getLeaveTypeLabel(leave)}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {leave.reason || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {leave.has_advance_notice ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Yes</Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(leave.status)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => setViewLeave(leave)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {leave.status === 'pending' && onCancel && (
                        <DropdownMenuItem 
                          onClick={() => setCancelId(leave.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Request
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The leave request will be permanently cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (cancelId && onCancel) {
                onCancel(cancelId);
                setCancelId(null);
              }
            }}>
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewLeave} onOpenChange={(open) => !open && setViewLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              {viewLeave && formatDateRange(viewLeave)}
            </DialogDescription>
          </DialogHeader>
          {viewLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getLeaveTypeLabel(viewLeave)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(viewLeave.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Advance Notice</p>
                  <p className="font-medium">{viewLeave.has_advance_notice ? 'Yes (48+ hours)' : 'No'}</p>
                </div>
                {viewLeave.penalty_amount && viewLeave.penalty_amount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Penalty</p>
                    <p className="font-medium text-destructive">₹{viewLeave.penalty_amount.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              
              {viewLeave.reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p>{viewLeave.reason}</p>
                </div>
              )}
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Work Delegation</p>
                <p className="text-sm">{viewLeave.delegation_notes}</p>
              </div>
              
              {viewLeave.admin_comments && (
                <div className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comments</p>
                  <p className="text-sm">{viewLeave.admin_comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
