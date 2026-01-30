import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Calendar,
  ExternalLink,
  MoreVertical,
  Check
} from 'lucide-react';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type EditingStatus = Database['public']['Enums']['editing_status'];

interface EditingListViewProps {
  shoots: ShootWithAssignments[];
  onShootClick: (shoot: ShootWithAssignments) => void;
  onEditingStatusChange?: (shootId: string, editingStatus: EditingStatus) => void;
}

const editingStatusConfig: Record<EditingStatus, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  not_started: { 
    label: 'Not Started', 
    icon: Clock, 
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  editing: { 
    label: 'Editing', 
    icon: PlayCircle, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  internal_review: { 
    label: 'Internal Review', 
    icon: Eye, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-700'
  },
  sent_to_client: { 
    label: 'Sent to Client', 
    icon: Send, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-700'
  },
  revisions_round: { 
    label: 'Revisions Round', 
    icon: RotateCcw, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-700'
  },
  final_delivered: { 
    label: 'Final Delivered', 
    icon: CheckCircle2, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-700'
  },
};

const statusOrder: EditingStatus[] = ['not_started', 'editing', 'internal_review', 'sent_to_client', 'revisions_round', 'final_delivered'];

export function EditingListView({ shoots, onShootClick, onEditingStatusChange }: EditingListViewProps) {
  const [activeStatus, setActiveStatus] = useState<EditingStatus>('not_started');

  // Only show shoots that have been "Given by Editor" (status === 'given_by_editor')
  const editorAssignedShoots = shoots.filter(shoot => shoot.status === 'given_by_editor');

  const getShootsByStatus = (status: EditingStatus) => {
    return editorAssignedShoots.filter(shoot => (shoot.editing_status || 'not_started') === status);
  };

  const getStatusCount = (status: EditingStatus) => {
    return getShootsByStatus(status).length;
  };

  const ActiveStatusIcon = editingStatusConfig[activeStatus].icon;

  return (
    <div className="space-y-6">
      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusOrder.map((status) => {
          const config = editingStatusConfig[status];
          const Icon = config.icon;
          const count = getStatusCount(status);
          const isActive = activeStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                "hover:shadow-md hover:scale-[1.02]",
                isActive 
                  ? `${config.bgColor} ${config.borderColor} shadow-sm` 
                  : "bg-card border-border hover:border-muted-foreground/30"
              )}
            >
              <div className="flex flex-col gap-2">
                <div className={cn(
                  "p-2 rounded-lg w-fit transition-colors",
                  isActive ? config.bgColor : "bg-muted/50 group-hover:bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? config.color : "text-muted-foreground group-hover:text-foreground"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-2xl font-bold transition-colors",
                    isActive ? config.color : "text-foreground"
                  )}>
                    {count}
                  </p>
                  <p className={cn(
                    "text-xs font-medium truncate transition-colors",
                    isActive ? config.color : "text-muted-foreground"
                  )}>
                    {config.label}
                  </p>
                </div>
              </div>
              {isActive && (
                <div className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full",
                  config.color.replace('text-', 'bg-')
                )} />
              )}
            </button>
          );
        })}
      </div>

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
                    <TableHead>Deadline</TableHead>
                    <TableHead>Drive Link</TableHead>
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
                            <Calendar className="h-4 w-4 text-muted-foreground" />
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Change Editing Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {statusOrder.map((statusKey) => {
                                  const statusItem = editingStatusConfig[statusKey];
                                  const Icon = statusItem.icon;
                                  const isActive = currentEditingStatus === statusKey;
                                  
                                  return (
                                    <DropdownMenuItem
                                      key={statusKey}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditingStatusChange?.(shoot.id, statusKey);
                                      }}
                                      className={isActive ? 'bg-accent' : ''}
                                    >
                                      <Icon className="h-4 w-4 mr-2" />
                                      {statusItem.label}
                                      {isActive && <Check className="h-3 w-3 ml-auto text-primary" />}
                                    </DropdownMenuItem>
                                  );
                                })}
                                <DropdownMenuSeparator />
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
