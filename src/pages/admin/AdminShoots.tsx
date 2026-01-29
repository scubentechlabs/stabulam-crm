import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Camera,
  Calendar,
  Filter,
  CheckCircle,
  Play,
  Trash2,
  RefreshCw,
  Search,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useShoots, type ShootWithAssignments } from '@/hooks/useShoots';
import { ShootDetailDialog } from '@/components/shoots/ShootDetailDialog';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];

const statusConfig: Record<ShootStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  given_by_editor: { label: 'Given By Editor', variant: 'outline' },
};

export default function AdminShoots() {
  const {
    shoots,
    isLoading,
    updateShoot,
    updateShootStatus,
    deleteShoot,
    addAssignment,
    removeAssignment,
    refreshShoots,
  } = useShoots();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShootStatus | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<ShootWithAssignments | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Get unique months from shoots for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    shoots.forEach(shoot => {
      const monthKey = format(parseISO(shoot.shoot_date), 'yyyy-MM');
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [shoots]);

  // Filter shoots
  const filteredShoots = useMemo(() => {
    return shoots.filter(shoot => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        shoot.event_name.toLowerCase().includes(searchLower) ||
        shoot.brand_name.toLowerCase().includes(searchLower) ||
        shoot.location.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || shoot.status === statusFilter;

      // Month filter
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const [year, month] = monthFilter.split('-').map(Number);
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        const shootDate = parseISO(shoot.shoot_date);
        matchesMonth = isWithinInterval(shootDate, { start: monthStart, end: monthEnd });
      }

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [shoots, searchQuery, statusFilter, monthFilter]);

  // Selection helpers
  const allSelected = filteredShoots.length > 0 && filteredShoots.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShoots.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Bulk operations
  const handleBulkStatusChange = async (status: ShootStatus) => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateShootStatus(id, status);
    }
    setSelectedIds(new Set());
    setIsBulkProcessing(false);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteShoot(id);
    }
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
    setIsBulkProcessing(false);
  };

  const handleShootClick = (shoot: ShootWithAssignments) => {
    setSelectedShoot(shoot);
    setShowDetail(true);
  };

  // Stats
  const stats = {
    total: shoots.length,
    pending: shoots.filter(s => s.status === 'pending').length,
    inProgress: shoots.filter(s => s.status === 'in_progress').length,
    completed: shoots.filter(s => s.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Shoots Management</h1>
        <p className="page-description">View and manage all shoots</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Shoots</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">All Shoots</CardTitle>
              <Badge variant="secondary">{filteredShoots.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshShoots}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by event, brand, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ShootStatus | 'all')}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {someSelected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={isBulkProcessing}>
                    {isBulkProcessing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : null}
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('pending')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('in_progress')}>
                    <Play className="h-4 w-4 mr-2" />
                    Set In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Set Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Shoots Table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Event</th>
                  <th className="p-3 text-left text-sm font-medium hidden md:table-cell">Brand</th>
                  <th className="p-3 text-left text-sm font-medium">Date</th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">Location</th>
                  <th className="p-3 text-left text-sm font-medium hidden md:table-cell">Team</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredShoots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No shoots found</p>
                    </td>
                  </tr>
                ) : (
                  filteredShoots.map(shoot => (
                    <tr
                      key={shoot.id}
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleShootClick(shoot)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(shoot.id)}
                          onCheckedChange={() => toggleSelect(shoot.id)}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{shoot.event_name}</span>
                        <span className="md:hidden block text-xs text-muted-foreground">
                          {shoot.brand_name}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {shoot.brand_name}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(parseISO(shoot.shoot_date), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {shoot.shoot_time}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {shoot.location}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{shoot.assignments.length}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusConfig[shoot.status || 'pending'].variant}>
                          {statusConfig[shoot.status || 'pending'].label}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Shoot(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected shoots and their assignments will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <ShootDetailDialog
        shoot={selectedShoot}
        open={showDetail}
        onOpenChange={setShowDetail}
        onStatusChange={updateShootStatus}
        onAddAssignment={addAssignment}
        onRemoveAssignment={removeAssignment}
        onUpdateShoot={updateShoot}
      />
    </div>
  );
}
