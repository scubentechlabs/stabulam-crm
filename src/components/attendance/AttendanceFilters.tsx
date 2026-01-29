import { User, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker, type DateRange } from '@/components/reports/DateRangePicker';

interface Employee {
  value: string;
  label: string;
}

interface AttendanceFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  employees: Employee[];
  onReset?: () => void;
}

export function AttendanceFilters({
  dateRange,
  onDateRangeChange,
  selectedEmployee,
  onEmployeeChange,
  employees,
  onReset,
}: AttendanceFiltersProps) {
  const hasActiveFilters = selectedEmployee !== 'all';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Date Range Picker */}
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        className="w-full sm:w-auto"
      />

      {/* Employee Filter */}
      <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
        <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select Employee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.value} value={employee.value}>
              {employee.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Filters */}
      {hasActiveFilters && onReset && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
