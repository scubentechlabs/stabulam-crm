import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  PlayCircle, 
  Clock, 
  Eye, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Video,
  MapPin,
  Calendar as CalendarIcon,
  ExternalLink,
  MoreVertical,
  Check,
  Search,
  X,
  Filter
} from 'lucide-react';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

type EditingStatus = Database['public']['Enums']['editing_status'];

interface EditingListViewProps {
  shoots: ShootWithAssignments[];
  onShootClick: (shoot: ShootWithAssignments) => void;
  onEditingStatusChange?: (shootId: string, editingStatus: EditingStatus) => void;
}

const editingStatusConfig: Record<EditingStatus, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; pillBg: string; pillText: string }> = {
  not_started: { 
    label: 'Not Started', 
    icon: Clock, 
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-200 dark:border-gray-700',
    pillBg: 'bg-red-700 hover:bg-red-800',
    pillText: 'text-white'
  },
  editing: { 
    label: 'Editing', 
    icon: PlayCircle, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-700',
    pillBg: 'bg-emerald-600 hover:bg-emerald-700',
    pillText: 'text-white'
  },
  internal_review: { 
    label: 'Internal Review', 
    icon: Eye, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-700',
    pillBg: 'bg-blue-600 hover:bg-blue-700',
    pillText: 'text-white'
  },
  sent_to_client: { 
    label: 'Sent to Client', 
    icon: Send, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-700',
    pillBg: 'bg-purple-600 hover:bg-purple-700',
    pillText: 'text-white'
  },
  revisions_round: { 
    label: 'Revisions Round', 
    icon: RotateCcw, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-700',
    pillBg: 'bg-red-700 hover:bg-red-800',
    pillText: 'text-white'
  },
  final_delivered: { 
    label: 'Final Delivered', 
    icon: CheckCircle2, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-700',
    pillBg: 'bg-emerald-600 hover:bg-emerald-700',
    pillText: 'text-white'
  },
};

const statusOrder: EditingStatus[] = ['not_started', 'editing', 'internal_review', 'sent_to_client', 'revisions_round', 'final_delivered'];

export function EditingListView({ shoots, onShootClick, onEditingStatusChange }: EditingListViewProps) {
  // Only show shoots that have been "Given by Editor" (status === 'given_by_editor')
  const editorAssignedShoots = shoots.filter(shoot => shoot.status === 'given_by_editor');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<EditingStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Find the first status with at least one shoot, or default to 'not_started'
  const getDefaultStatus = (): EditingStatus => {
    for (const status of statusOrder) {
      if (editorAssignedShoots.some(shoot => (shoot.editing_status || 'not_started') === status)) {
        return status;
      }
    }
    return 'not_started';
  };

  const [activeStatus, setActiveStatus] = useState<EditingStatus>(() => getDefaultStatus());

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

  const getShootsByStatus = (status: EditingStatus) => {
    return filteredShoots.filter(shoot => (shoot.editing_status || 'not_started') === status);
  };

  const getStatusCount = (status: EditingStatus) => {
    return getShootsByStatus(status).length;
  };

  // Handle status change and switch to the new status tab
  const handleStatusChange = (shootId: string, newStatus: EditingStatus) => {
    // Find the shoot being changed for better logging
    const targetShoot = editorAssignedShoots.find(s => s.id === shootId);
    console.log('[EditingListView] Changing status:', {
      shootId,
      shootName: targetShoot?.event_name,
      newStatus,
    });
    
    const newStatusLabel = editingStatusConfig[newStatus].label;
    // Call the parent handler with ONLY this specific shootId
    onEditingStatusChange?.(shootId, newStatus);
    // Switch to the new status tab so user sees the shoot in its new location
    setActiveStatus(newStatus);
    // Show success toast with shoot name for clarity
    toast({
      title: "Status Updated",
      description: `"${targetShoot?.event_name}" changed to "${newStatusLabel}"`,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || stageFilter !== 'all' || dateRange?.from;

  const ActiveStatusIcon = editingStatusConfig[activeStatus].icon;

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
                    {editingStatusConfig[status].label}
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

      {/* Active Status Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ActiveStatusIcon className={cn("h-5 w-5", editingStatusConfig[activeStatus].color)} />
            {editingStatusConfig[activeStatus].label}
            <Badge variant="secondary" className="ml-2">
              {getStatusCount(activeStatus)} shoots
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getShootsByStatus(activeStatus).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No shoots in "{editingStatusConfig[activeStatus].label}" status</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={handleResetFilters} className="mt-2">
                  Clear filters to see all shoots
                </Button>
              )}
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
                  {getShootsByStatus(activeStatus).map((shoot) => {
                    const currentEditingStatus = shoot.editing_status || 'not_started';
                    
                    return (
                      <TableRow 
                        key={shoot.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onShootClick(shoot)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{shoot.event_name}</p>
                            <p className="text-sm text-muted-foreground">{shoot.brand_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(shoot.shoot_date), 'MMM d, yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{shoot.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shoot.assigned_editor ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={shoot.assigned_editor.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {shoot.assigned_editor.full_name?.charAt(0) || 'E'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">
                                {shoot.assigned_editor.full_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-auto p-0 hover:bg-transparent focus-visible:ring-0"
                              >
                                {(() => {
                                  const statusConfig = editingStatusConfig[currentEditingStatus];
                                  const StatusIcon = statusConfig.icon;
                                  return (
                                    <Badge className={cn(
                                      "flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                      statusConfig.pillBg,
                                      statusConfig.pillText
                                    )}>
                                      <StatusIcon className="h-3 w-3" />
                                      {statusConfig.label}
                                    </Badge>
                                  );
                                })()}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-popover z-50">
                              <DropdownMenuLabel>Change Editing Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {statusOrder.map((statusKey) => {
                                const statusItem = editingStatusConfig[statusKey];
                                const isActive = currentEditingStatus === statusKey;
                                
                                return (
                                  <DropdownMenuItem
                                    key={statusKey}
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleStatusChange(shoot.id, statusKey);
                                    }}
                                    className="p-1 focus:bg-transparent"
                                  >
                                    <span className={cn(
                                      "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                                      statusItem.pillBg,
                                      statusItem.pillText
                                    )}>
                                      {statusItem.label}
                                      {isActive && <Check className="h-3.5 w-3.5 ml-2" />}
                                    </span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          {shoot.editor_deadline ? (
                            <span className="text-sm">
                              {format(parseISO(shoot.editor_deadline), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shoot.editor_drive_link ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(shoot.editor_drive_link!, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shoot.editor_description ? (
                            <p className="text-sm truncate max-w-[200px]" title={shoot.editor_description}>
                              {shoot.editor_description}
                            </p>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-popover z-50">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onShootClick(shoot);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
