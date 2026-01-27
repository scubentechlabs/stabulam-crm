import { useState, useMemo, useCallback } from 'react';
import type { SortDirection, SortConfig } from '@/components/ui/table-filters';

interface UseTableFiltersOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  defaultSortKey?: keyof T;
  defaultSortDirection?: SortDirection;
}

export function useTableFilters<T extends Record<string, any>>({
  data,
  searchKeys,
  defaultSortKey,
  defaultSortDirection = 'desc',
}: UseTableFiltersOptions<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
  }, [data, searchValue, statusFilter, sortConfig, searchKeys]);

  return {
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    sortConfig,
    handleSort,
    filteredData: filteredAndSortedData,
  };
}
