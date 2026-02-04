import { useState, useMemo, useCallback } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video,
  Calendar as CalendarIcon,
  Search,
  X,
  Filter
} from 'lucide-react';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { EditingTableRow } from './EditingTableRow';

type EditingStatus = Database['public']['Enums']['editing_status'];

interface EditingListViewProps {
  shoots: ShootWithAssignments[];
  onShootClick: (shoot: ShootWithAssignments) => void;
  onEditingStatusChange?: (shootId: string, editingStatus: EditingStatus) => void;
}

const statusLabels: Record<EditingStatus, string> = {
  not_started: 'Not Started',
  editing: 'Editing',
  internal_review: 'Internal Review',
  sent_to_client: 'Sent to Client',
  revisions_round: 'Revisions Round',
  final_delivered: 'Final Delivered',
};

const statusOrder: EditingStatus[] = ['not_started', 'editing', 'internal_review', 'sent_to_client', 'revisions_round', 'final_delivered'];

export function EditingListView({ shoots, onShootClick, onEditingStatusChange }: EditingListViewProps) {
  // Only show shoots that have been "Given by Editor" (status === 'given_by_editor')
  const editorAssignedShoots = useMemo(() => 
    shoots.filter(shoot => shoot.status === 'given_by_editor'),
    [shoots]
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<EditingStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Apply filters to shoots
  const filteredShoots = useMemo(() => {
    return editorAssignedShoots.filter(shoot => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          shoot.event_name.toLowerCase().includes(query) ||
          shoot.brand_name.toLowerCase().includes(query) ||
          shoot.location.toLowerCase().includes(query) ||
          shoot.assigned_editor?.full_name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Stage filter
      if (stageFilter !== 'all') {
        const shootStatus = shoot.editing_status || 'not_started';
        if (shootStatus !== stageFilter) return false;
      }

      // Date range filter
      if (dateRange?.from) {
        const shootDate = parseISO(shoot.shoot_date);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(shootDate, { start: from, end: to })) return false;
      }

      return true;
    });
  }, [editorAssignedShoots, searchQuery, stageFilter, dateRange]);


  // CRITICAL: Handle status change with memoized callback
  // This ensures each row receives a stable function reference
  const handleStatusChange = useCallback((shootId: string, newStatus: EditingStatus) => {
    // Find the shoot being changed for better logging
    const targetShoot = editorAssignedShoots.find(s => s.id === shootId);
    console.log('[EditingListView] handleStatusChange called:', {
      shootId,
      shootName: targetShoot?.event_name,
      newStatus,
      totalShoots: editorAssignedShoots.length,
    });
    
    const newStatusLabel = statusLabels[newStatus];
    
    // CRITICAL: Call the parent handler with ONLY this specific shootId
    // The shootId is passed directly from the row component
    if (onEditingStatusChange) {
      onEditingStatusChange(shootId, newStatus);
    }
    
    // Show success toast with shoot name for clarity
    toast({
      title: "Status Updated",
      description: `"${targetShoot?.event_name}" changed to "${newStatusLabel}"`,
    });
  }, [editorAssignedShoots, onEditingStatusChange]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || stageFilter !== 'all' || dateRange?.from;

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search event, brand, editor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "justify-start text-left font-normal min-w-[200px]",
                  !dateRange?.from && "text-muted-foreground"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as EditingStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Stages</SelectItem>
                {statusOrder.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Single Table with All Shoots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            All Editing Projects
            <Badge variant="secondary" className="ml-2">
              {filteredShoots.length} shoots
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredShoots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No shoots found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event / Brand</TableHead>
                    <TableHead>Shoot Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Editor</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Drive Link</TableHead>
                    <TableHead>Requirements / Instructions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShoots.map((shoot) => (
                    <EditingTableRow
                      key={shoot.id}
                      shoot={shoot}
                      onShootClick={onShootClick}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
