import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/hooks/useTableFilters';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface TableFiltersProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  additionalFilters?: React.ReactNode;
  resultCount?: number;
  // Date range props
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onClearDateRange?: () => void;
  showDateFilter?: boolean;
  // Reset all
  hasActiveFilters?: boolean;
  onResetAll?: () => void;
}

export function TableFilters({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  additionalFilters,
  resultCount,
  dateRange,
  onDateRangeChange,
  onClearDateRange,
  showDateFilter = false,
  hasActiveFilters = false,
  onResetAll,
}: TableFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {statusOptions && onStatusFilterChange && (
        <Select value={statusFilter || 'all'} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showDateFilter && onDateRangeChange && (
        <TableDateRangePicker
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          onClear={onClearDateRange}
        />
      )}

      {additionalFilters}

      {hasActiveFilters && onResetAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetAll}
          className="h-10 px-3 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}

      {hasActiveFilters && resultCount !== undefined && (
        <div className="flex items-center">
          <Badge variant="secondary" className="whitespace-nowrap">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}

interface TableDateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClear?: () => void;
}

function TableDateRangePicker({ dateRange, onDateRangeChange, onClear }: TableDateRangePickerProps) {
  const hasDateRange = dateRange?.from && dateRange?.to;

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
    } else if (range?.from) {
      onDateRangeChange({ from: range.from, to: range.from });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full sm:w-auto justify-start text-left font-normal',
            !hasDateRange && 'text-muted-foreground'
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {hasDateRange ? (
            <span className="truncate">
              {format(dateRange.from!, 'MMM d')} - {format(dateRange.to!, 'MMM d, yyyy')}
            </span>
          ) : (
            <span>Date Range</span>
          )}
          {hasDateRange && onClear && (
            <X
              className="ml-2 h-4 w-4 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
        <Calendar
          mode="range"
          selected={hasDateRange ? { from: dateRange.from!, to: dateRange.to! } : undefined}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={(date) => date > new Date()}
          className="pointer-events-auto"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-3 h-8 data-[state=open]:bg-accent ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      {isActive && currentDirection === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : isActive && currentDirection === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (showEllipsisStart) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (showEllipsisEnd) {
      pages.push('ellipsis');
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {endIndex} of {totalItems} entries
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <div className="hidden sm:flex items-center gap-1">
          {getVisiblePages().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>
        
        <span className="sm:hidden text-sm text-muted-foreground px-2">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
