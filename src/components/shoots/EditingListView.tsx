import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CircleDashed,
  Pencil,
  Eye,
  Send,
  RotateCcw,
  PackageCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';

type EditingStatus = Database['public']['Enums']['editing_status'];

interface EditingListViewProps {
  shoots: ShootWithAssignments[];
  onEditingStatusChange: (shootId: string, status: EditingStatus) => void;
  onShootClick: (shoot: ShootWithAssignments) => void;
}

const editingStatusConfig: Record<
  EditingStatus,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  not_started: {
    label: 'Not Started',
    icon: CircleDashed,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  editing: {
    label: 'Editing',
    icon: Pencil,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  internal_review: {
    label: 'Internal Review',
    icon: Eye,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  sent_to_client: {
    label: 'Sent to Client',
    icon: Send,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  revisions_round: {
    label: 'Revisions Round',
    icon: RotateCcw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  final_delivered: {
    label: 'Final Delivered',
    icon: PackageCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
};

const allStatuses: EditingStatus[] = [
  'not_started',
  'editing',
  'internal_review',
  'sent_to_client',
  'revisions_round',
  'final_delivered',
];

export function EditingListView({
  shoots,
  onEditingStatusChange,
  onShootClick,
}: EditingListViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<EditingStatus | 'all'>('all');

  // Count shoots by editing status
  const statusCounts = useMemo(() => {
    const counts: Record<EditingStatus, number> = {
      not_started: 0,
      editing: 0,
      internal_review: 0,
      sent_to_client: 0,
      revisions_round: 0,
      final_delivered: 0,
    };
    shoots.forEach((shoot) => {
      const status = shoot.editing_status || 'not_started';
      counts[status]++;
    });
    return counts;
  }, [shoots]);

  // Filter shoots by selected status
  const filteredShoots = useMemo(() => {
    if (selectedStatus === 'all') return shoots;
    return shoots.filter((s) => (s.editing_status || 'not_started') === selectedStatus);
  }, [shoots, selectedStatus]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Status Cards Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {allStatuses.map((status) => {
          const config = editingStatusConfig[status];
          const Icon = config.icon;
          const isActive = selectedStatus === status;
          const count = statusCounts[status];

          return (
            <Card
              key={status}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                isActive ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/20'
              )}
              onClick={() => setSelectedStatus(isActive ? 'all' : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground truncate">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Filter Indicator */}
      {selectedStatus !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            Filtering: {editingStatusConfig[selectedStatus].label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setSelectedStatus('all')}>
            Clear filter
          </Button>
        </div>
      )}

      {/* Editing Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shoot</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Shoot Date</TableHead>
                <TableHead>Assigned Editor</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Drive Link</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShoots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No shoots found for this filter
                  </TableCell>
                </TableRow>
              ) : (
                filteredShoots.map((shoot) => {
                  const currentStatus = shoot.editing_status || 'not_started';
                  const config = editingStatusConfig[currentStatus];

                  // Find assigned editor from assignments (use first one or dedicated editor)
                  const editorAssignment = shoot.assignments.find(
                    (a) => a.user_id === shoot.assigned_editor_id
                  ) || shoot.assignments[0];

                  return (
                    <TableRow
                      key={shoot.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onShootClick(shoot)}
                    >
                      <TableCell className="font-medium">{shoot.event_name}</TableCell>
                      <TableCell>{shoot.brand_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(parseISO(shoot.shoot_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editorAssignment?.profile ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={editorAssignment.profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(editorAssignment.profile.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {editorAssignment.profile.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {editorAssignment.profile.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
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
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(shoot.editor_drive_link!, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Open
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={currentStatus}
                          onValueChange={(value) =>
                            onEditingStatusChange(shoot.id, value as EditingStatus)
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allStatuses.map((status) => {
                              const statusConfig = editingStatusConfig[status];
                              const StatusIcon = statusConfig.icon;
                              return (
                                <SelectItem key={status} value={status}>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                                    <span>{statusConfig.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
