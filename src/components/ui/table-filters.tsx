import { useState } from 'react';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
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
}: TableFiltersProps) {
  const hasActiveFilters = searchValue || (statusFilter && statusFilter !== 'all');

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

      {additionalFilters}

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
