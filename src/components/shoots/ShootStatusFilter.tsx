import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShootStatusFilter as StatusFilterType } from './ShootStatusCards';

interface ShootStatusFilterProps {
  value: StatusFilterType;
  onChange: (value: StatusFilterType) => void;
}

export function ShootStatusFilter({ value, onChange }: ShootStatusFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatusFilterType)}>
      <SelectTrigger className="w-[180px]">
        <Filter className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent className="bg-popover">
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="pending">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Pending
          </span>
        </SelectItem>
        <SelectItem value="completed">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Completed
          </span>
        </SelectItem>
        <SelectItem value="given_by_editor">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Given By Editor
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
