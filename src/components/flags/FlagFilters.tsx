import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/useUsers';
import type { FlagFilters as FlagFiltersType } from '@/hooks/useFlags';
import {
  Search,
  Calendar as CalendarIcon,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlagFiltersProps {
  filters: FlagFiltersType;
  onFiltersChange: (filters: FlagFiltersType) => void;
}

export function FlagFilters({ filters, onFiltersChange }: FlagFiltersProps) {
  const { users } = useUsers();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const activeEmployees = users.filter((u) => u.is_active);

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchInput });
  };

  const handleReset = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.employeeId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.search;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Employee Filter */}
        <Select
          value={filters.employeeId || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              employeeId: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {activeEmployees.map((employee) => (
              <SelectItem key={employee.user_id} value={employee.user_id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={employee.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {employee.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[120px]">
                    {employee.full_name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? undefined : (value as 'open' | 'acknowledged'),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !filters.dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom
                ? format(filters.dateFrom, 'dd MMM yyyy')
                : 'From Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) =>
                onFiltersChange({ ...filters, dateFrom: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !filters.dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo
                ? format(filters.dateTo, 'dd MMM yyyy')
                : 'To Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Active filters:
          </span>

          {filters.search && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ ...filters, search: undefined });
              }}
            >
              Search: {filters.search}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}

          {filters.employeeId && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                onFiltersChange({ ...filters, employeeId: undefined })
              }
            >
              Employee:{' '}
              {activeEmployees.find((e) => e.user_id === filters.employeeId)
                ?.full_name || 'Unknown'}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}

          {filters.status && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() =>
                onFiltersChange({ ...filters, status: undefined })
              }
            >
              Status: {filters.status}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}

          {filters.dateFrom && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                onFiltersChange({ ...filters, dateFrom: undefined })
              }
            >
              From: {format(filters.dateFrom, 'dd MMM')}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}

          {filters.dateTo && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                onFiltersChange({ ...filters, dateTo: undefined })
              }
            >
              To: {format(filters.dateTo, 'dd MMM')}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
