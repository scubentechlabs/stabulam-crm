import { format } from 'date-fns';
import { Clock, IndianRupee, Eye, MoreHorizontal, Briefcase } from 'lucide-react';
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
import type { ExtraWorkWithProfile } from '@/hooks/useExtraWork';

interface ExtraWorkTableProps {
  extraWorkList: ExtraWorkWithProfile[];
  showEmployeeName?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
}

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export function ExtraWorkTable({ 
  extraWorkList, 
  showEmployeeName, 
  emptyMessage = 'No extra work requests',
  showFilters = true,
}: ExtraWorkTableProps) {
  const [viewExtraWork, setViewExtraWork] = useState<ExtraWorkWithProfile | null>(null);

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
  } = useTableFilters({
    data: extraWorkList,
    searchKeys: ['task_description', 'notes', 'profiles'] as (keyof ExtraWorkWithProfile)[],
    defaultSortKey: 'work_date',
    defaultSortDirection: 'desc',
    pageSize: 10,
    dateKey: 'work_date',
    enableDateFilter: true,
  });

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

  return (
    <>
      {showFilters && (
        <TableFilters
          searchPlaceholder="Search by task description..."
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
        />
      )}

      {totalItems === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{searchValue || statusFilter !== 'all' ? 'No matching results' : emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showEmployeeName && (
                  <TableHead>
                    <SortableHeader
                      label="Employee"
                      sortKey="profiles"
                      currentSortKey={sortConfig.key as string}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableHead>
                )}
                <TableHead>
                  <SortableHeader
                    label="Date"
                    sortKey="work_date"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader
                    label="Hours"
                    sortKey="hours"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                    className="justify-center"
                  />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    label="Compensation"
                    sortKey="compensation_amount"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </TableHead>
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
              {paginatedData.map((ew) => (
                <TableRow key={ew.id}>
                  {showEmployeeName && (
                    <TableCell className="font-medium">
                      {ew.profiles?.full_name || 'Unknown'}
                    </TableCell>
                  )}
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
                  <TableCell className="text-center">
                    {getStatusBadge(ew.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setViewExtraWork(ew)}>
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
      <Dialog open={!!viewExtraWork} onOpenChange={(open) => !open && setViewExtraWork(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extra Work Details</DialogTitle>
            <DialogDescription>
              {viewExtraWork && format(new Date(viewExtraWork.work_date), 'PPP')}
            </DialogDescription>
          </DialogHeader>
          {viewExtraWork && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-medium">{viewExtraWork.hours} hour{viewExtraWork.hours > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compensation</p>
                  <p className="font-medium text-green-600">₹{viewExtraWork.compensation_amount?.toLocaleString('en-IN') || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(viewExtraWork.status)}
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Task Description</p>
                <p className="text-sm">{viewExtraWork.task_description}</p>
              </div>
              
              {viewExtraWork.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{viewExtraWork.notes}</p>
                </div>
              )}
              
              {viewExtraWork.admin_comments && (
                <div className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comments</p>
                  <p className="text-sm">{viewExtraWork.admin_comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
