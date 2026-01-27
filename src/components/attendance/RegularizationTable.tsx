import { format } from 'date-fns';
import { Clock, Calendar, Eye, MoreHorizontal, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { TableFilters, SortableHeader, TablePagination } from '@/components/ui/table-filters';
import { useTableFilters } from '@/hooks/useTableFilters';
import type { Regularization } from '@/hooks/useAttendanceRegularization';

interface RegularizationTableProps {
  regularizations: Regularization[];
  emptyMessage?: string;
  showFilters?: boolean;
}

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export function RegularizationTable({ 
  regularizations, 
  emptyMessage = 'No regularization requests',
  showFilters = true,
}: RegularizationTableProps) {
  const [viewRegularization, setViewRegularization] = useState<Regularization | null>(null);

  const {
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    sortConfig,
    handleSort,
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    dateRange,
    setDateRange,
    clearDateRange,
    hasActiveFilters,
    resetAllFilters,
  } = useTableFilters({
    data: regularizations,
    searchKeys: ['reason'] as (keyof Regularization)[],
    defaultSortKey: 'request_date',
    defaultSortDirection: 'desc',
    pageSize: 10,
    dateKey: 'request_date',
    enableDateFilter: true,
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
    <>
      {showFilters && (
        <TableFilters
          searchPlaceholder="Search by reason..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          resultCount={totalItems}
          showDateFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClearDateRange={clearDateRange}
          hasActiveFilters={hasActiveFilters}
          onResetAll={resetAllFilters}
        />
      )}

      {totalItems === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{searchValue || statusFilter !== 'all' ? 'No matching results' : emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    label="Date"
                    sortKey="request_date"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                    className="justify-center"
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((reg) => (
                <TableRow key={reg.id}>
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
                  <TableCell className="text-center">
                    {getStatusBadge(reg.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setViewRegularization(reg)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewRegularization} onOpenChange={(open) => !open && setViewRegularization(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regularization Details</DialogTitle>
            <DialogDescription>
              {viewRegularization && format(new Date(viewRegularization.request_date), 'EEEE, MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          {viewRegularization && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clock-in</p>
                    <p className="font-medium">{formatTime(viewRegularization.requested_clock_in)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clock-out</p>
                    <p className="font-medium">{formatTime(viewRegularization.requested_clock_out)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {getStatusBadge(viewRegularization.status)}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p>{viewRegularization.reason}</p>
              </div>
              
              {viewRegularization.admin_comments && (
                <div className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response</p>
                  <p className="text-sm">{viewRegularization.admin_comments}</p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Submitted {format(new Date(viewRegularization.created_at), 'MMM dd, yyyy \'at\' hh:mm a')}
                {viewRegularization.processed_at && (
                  <span className="ml-2">
                    • Processed {format(new Date(viewRegularization.processed_at), 'MMM dd, yyyy \'at\' hh:mm a')}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
