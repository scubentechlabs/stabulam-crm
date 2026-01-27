import { useState, useMemo, useCallback } from 'react';
import type { SortDirection, SortConfig } from '@/components/ui/table-filters';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface UseTableFiltersOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  defaultSortKey?: keyof T;
  defaultSortDirection?: SortDirection;
  pageSize?: number;
  dateKey?: keyof T;
  enableDateFilter?: boolean;
}

export function useTableFilters<T extends Record<string, any>>({
  data,
  searchKeys,
  defaultSortKey,
  defaultSortDirection = 'desc',
  pageSize = 10,
  dateKey,
  enableDateFilter = false,
}: UseTableFiltersOptions<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSortKey || null,
    direction: defaultSortKey ? defaultSortDirection : null,
  });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { key: key as keyof T, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      return { key: key as keyof T, direction: 'asc' };
    });
  }, []);

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  }, []);

  const clearDateRange = useCallback(() => {
    setDateRange({ from: null, to: null });
    setCurrentPage(1);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchValue('');
    setStatusFilter('all');
    setDateRange({ from: null, to: null });
    setCurrentPage(1);
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchLower);
          }
          // Handle nested profile name
          if (key === 'profiles' && item.profiles?.full_name) {
            return item.profiles.full_name.toLowerCase().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((item) => {
        // Handle different status field names
        const status = item.status || item.is_active;
        if (typeof status === 'boolean') {
          return statusFilter === 'active' ? status : !status;
        }
        return status === statusFilter;
      });
    }

    // Apply date range filter
    if (enableDateFilter && dateKey && dateRange.from && dateRange.to) {
      result = result.filter((item) => {
        const itemDate = item[dateKey];
        if (!itemDate) return false;
        
        const date = new Date(itemDate);
        if (isNaN(date.getTime())) return false;
        
        // Set time to start/end of day for proper comparison
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        
        return date >= fromDate && date <= toDate;
      });
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];

        // Handle nested profile name
        if (sortConfig.key === 'profiles') {
          aValue = a.profiles?.full_name || '';
          bValue = b.profiles?.full_name || '';
        }

        // Handle dates
        if (typeof aValue === 'string' && (aValue.includes('-') || aValue.includes('/'))) {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return sortConfig.direction === 'asc'
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle strings
        const strA = String(aValue || '').toLowerCase();
        const strB = String(bValue || '').toLowerCase();
        return sortConfig.direction === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchValue, statusFilter, sortConfig, searchKeys, enableDateFilter, dateKey, dateRange]);

  // Pagination calculations
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Ensure current page is valid
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  if (validCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(validCurrentPage);
  }

  const hasDateFilter = dateRange.from !== null && dateRange.to !== null;
  const hasActiveFilters = searchValue.trim() !== '' || statusFilter !== 'all' || hasDateFilter;

  return {
    searchValue,
    setSearchValue: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusChange,
    sortConfig,
    handleSort,
    filteredData: filteredAndSortedData,
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex: Math.min(endIndex, totalItems),
    // Date range filter
    dateRange,
    setDateRange: handleDateRangeChange,
    clearDateRange,
    hasDateFilter,
    // Reset all
    hasActiveFilters,
    resetAllFilters,
  };
}
