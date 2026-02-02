import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flag,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Flag as FlagType } from '@/hooks/useFlags';
import { cn } from '@/lib/utils';

interface FlagTableProps {
  flags: FlagType[];
  isLoading: boolean;
  onViewDetails: (flag: FlagType) => void;
  showEmployee?: boolean;
}

const PAGE_SIZE = 10;

export function FlagTable({
  flags,
  isLoading,
  onViewDetails,
  showEmployee = true,
}: FlagTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(flags.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedFlags = flags.slice(startIndex, startIndex + PAGE_SIZE);

  const statusColors = {
    open: 'bg-destructive/10 text-destructive border-destructive/20',
    acknowledged: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Flag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No flags found</h3>
        <p className="text-sm text-muted-foreground">
          No flags match your current filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Flag Details</TableHead>
              {showEmployee && <TableHead>Employee</TableHead>}
              <TableHead>Issued By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Replies</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlags.map((flag) => (
              <TableRow
                key={flag.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewDetails(flag)}
              >
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 shrink-0">
                      <Flag className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]">
                        {flag.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {showEmployee && (
                  <TableCell>
                    {flag.employee_profile && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={flag.employee_profile.avatar_url || ''}
                          />
                          <AvatarFallback className="text-xs">
                            {flag.employee_profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {flag.employee_profile.full_name}
                        </span>
                      </div>
                    )}
                  </TableCell>
                )}

                <TableCell>
                  <span className="text-sm">
                    {flag.issuer_profile?.full_name || 'Unknown'}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(flag.created_at), 'dd MMM yyyy')}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('capitalize', statusColors[flag.status])}
                  >
                    {flag.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  {(flag.replies_count || 0) > 0 ? (
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{flag.replies_count}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(flag);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{' '}
            {Math.min(startIndex + PAGE_SIZE, flags.length)} of {flags.length}{' '}
            flags
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
