import { memo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
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
  MapPin,
  Calendar as CalendarIcon,
  ExternalLink,
  MoreVertical,
  Check,
} from 'lucide-react';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type EditingStatus = Database['public']['Enums']['editing_status'];

interface EditingTableRowProps {
  shoot: ShootWithAssignments;
  onShootClick: (shoot: ShootWithAssignments) => void;
  onStatusChange: (shootId: string, newStatus: EditingStatus) => void;
}

const editingStatusConfig: Record<EditingStatus, { label: string; icon: React.ElementType; pillBg: string; pillText: string }> = {
  not_started: { 
    label: 'Not Started', 
    icon: Clock, 
    pillBg: 'bg-red-700 hover:bg-red-800',
    pillText: 'text-white'
  },
  editing: { 
    label: 'Editing', 
    icon: PlayCircle, 
    pillBg: 'bg-emerald-600 hover:bg-emerald-700',
    pillText: 'text-white'
  },
  internal_review: { 
    label: 'Internal Review', 
    icon: Eye, 
    pillBg: 'bg-blue-600 hover:bg-blue-700',
    pillText: 'text-white'
  },
  sent_to_client: { 
    label: 'Sent to Client', 
    icon: Send, 
    pillBg: 'bg-purple-600 hover:bg-purple-700',
    pillText: 'text-white'
  },
  revisions_round: { 
    label: 'Revisions Round', 
    icon: RotateCcw, 
    pillBg: 'bg-red-700 hover:bg-red-800',
    pillText: 'text-white'
  },
  final_delivered: { 
    label: 'Final Delivered', 
    icon: CheckCircle2, 
    pillBg: 'bg-emerald-600 hover:bg-emerald-700',
    pillText: 'text-white'
  },
};

const statusOrder: EditingStatus[] = ['not_started', 'editing', 'internal_review', 'sent_to_client', 'revisions_round', 'final_delivered'];

// CRITICAL: This component is memoized to ensure each row has its own isolated scope
// This prevents the closure bug where changing one row's status affects other rows
export const EditingTableRow = memo(function EditingTableRow({ 
  shoot, 
  onShootClick, 
  onStatusChange 
}: EditingTableRowProps) {
  // CRITICAL: Store the shoot.id in a local variable to ensure correct closure capture
  const shootId = shoot.id;
  const currentEditingStatus = shoot.editing_status || 'not_started';
  const statusConfig = editingStatusConfig[currentEditingStatus];
  const StatusIcon = statusConfig.icon;

  // CRITICAL: Use useCallback with shootId dependency to ensure stable closure
  const handleStatusSelect = useCallback((newStatus: EditingStatus) => {
    console.log('[EditingTableRow] Status change triggered:', {
      shootId,
      shootName: shoot.event_name,
      currentStatus: currentEditingStatus,
      newStatus,
    });
    onStatusChange(shootId, newStatus);
  }, [shootId, shoot.event_name, currentEditingStatus, onStatusChange]);

  const handleRowClick = useCallback(() => {
    onShootClick(shoot);
  }, [onShootClick, shoot]);

  const handleDriveLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (shoot.editor_drive_link) {
      window.open(shoot.editor_drive_link, '_blank');
    }
  }, [shoot.editor_drive_link]);

  const handleViewDetailsClick = useCallback((e: Event) => {
    e.stopPropagation();
    onShootClick(shoot);
  }, [onShootClick, shoot]);

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
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
              <Badge className={cn(
                "flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                statusConfig.pillBg,
                statusConfig.pillText
              )}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover z-50">
            <DropdownMenuLabel>Change Editing Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOrder.map((statusKey) => {
              const statusItem = editingStatusConfig[statusKey];
              const isActive = currentEditingStatus === statusKey;
              const ItemIcon = statusItem.icon;
              
              return (
                <DropdownMenuItem
                  key={statusKey}
                  onSelect={(e) => {
                    e.preventDefault();
                    // CRITICAL: Use the memoized callback with the correct shootId
                    handleStatusSelect(statusKey);
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
            onClick={handleDriveLinkClick}
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
              <DropdownMenuItem onSelect={handleViewDetailsClick}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});
