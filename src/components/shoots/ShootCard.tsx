import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Users, MoreVertical, CheckCircle, Play, Trash2, CircleDashed, Pencil, Eye, Send, RotateCcw, PackageCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeOnlyIST } from '@/lib/utils';
import { EditorAssignmentDialog } from './EditorAssignmentDialog';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];
type EditingStatus = Database['public']['Enums']['editing_status'];

interface ShootCardProps {
  shoot: ShootWithAssignments;
  onStatusChange?: (shootId: string, status: ShootStatus) => void;
  onEditingStatusChange?: (shootId: string, editingStatus: EditingStatus) => void;
  onEditorAssignment?: (shootId: string, data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }) => Promise<{ error: unknown | null }>;
  onDelete?: (shootId: string) => void;
  onClick?: () => void;
}

const statusConfig: Record<ShootStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: CircleDashed },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30', icon: Play },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-600 border-green-500/30', icon: CheckCircle },
  given_by_editor: { label: 'Given By Editor', className: 'bg-purple-500/15 text-purple-600 border-purple-500/30', icon: PackageCheck },
};

const editingStatusConfig: Record<EditingStatus, { label: string; icon: React.ElementType }> = {
  not_started: { label: 'Not Started', icon: CircleDashed },
  editing: { label: 'Editing', icon: Pencil },
  internal_review: { label: 'Internal Review', icon: Eye },
  sent_to_client: { label: 'Sent to Client', icon: Send },
  revisions_round: { label: 'Revisions Round', icon: RotateCcw },
  final_delivered: { label: 'Final Delivered', icon: PackageCheck },
};

export function ShootCard({ shoot, onStatusChange, onEditingStatusChange, onEditorAssignment, onDelete, onClick }: ShootCardProps) {
  const { isAdmin, user } = useAuth();
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [isSubmittingEditor, setIsSubmittingEditor] = useState(false);
  
  const status = shoot.status || 'pending';
  const config = statusConfig[status];
  const editingStatus = shoot.editing_status || 'not_started';
  
  const isOwner = shoot.created_by === user?.id;
  const canModify = isAdmin || isOwner;
  
  const formatTime = (time: string) => formatTimeOnlyIST(time);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleGivenByEditorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditorDialog(true);
  };

  const handleEditorAssignmentSubmit = async (data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }): Promise<{ error: unknown | null }> => {
    if (!onEditorAssignment) return { error: null };
    setIsSubmittingEditor(true);
    const result = await onEditorAssignment(shoot.id, data);
    setIsSubmittingEditor(false);
    if (!result.error) {
      setShowEditorDialog(false);
    }
    return result;
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">{shoot.event_name}</h3>
                <Badge variant="outline" className={config.className}>{config.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{shoot.brand_name}</p>
            </div>
            
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(shoot.id, 'pending');
                    }}
                    className={status === 'pending' ? 'bg-accent' : ''}
                  >
                    <CircleDashed className="h-4 w-4 mr-2" />
                    Pending Shoot
                    {status === 'pending' && <CheckCircle className="h-3 w-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(shoot.id, 'completed');
                    }}
                    className={status === 'completed' ? 'bg-accent' : ''}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed Shoot
                    {status === 'completed' && <CheckCircle className="h-3 w-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleGivenByEditorClick}
                    className={status === 'given_by_editor' ? 'bg-accent' : ''}
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Given By Editor
                    {status === 'given_by_editor' && <CheckCircle className="h-3 w-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editing Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover">
                      {(Object.keys(editingStatusConfig) as EditingStatus[]).map((statusKey) => {
                        const statusItem = editingStatusConfig[statusKey];
                        const Icon = statusItem.icon;
                        const isActive = editingStatus === statusKey;
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
                            {isActive && <CheckCircle className="h-3 w-3 ml-auto text-primary" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(shoot.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{format(parseISO(shoot.shoot_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatTime(shoot.shoot_time)}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{shoot.location}</span>
          </div>

          {shoot.brief && (
            <p className="text-sm text-muted-foreground line-clamp-2 pt-1 border-t">
              {shoot.brief}
            </p>
          )}

          {/* Team Members */}
          {shoot.assignments.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {shoot.assignments.slice(0, 4).map((assignment) => (
                  <Avatar key={assignment.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {assignment.profile?.full_name ? getInitials(assignment.profile.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {shoot.assignments.length > 4 && (
                  <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{shoot.assignments.length - 4}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {shoot.assignments.length} assigned
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Assignment Dialog - Rendered outside Card to avoid event issues */}
      <EditorAssignmentDialog
        open={showEditorDialog}
        onOpenChange={setShowEditorDialog}
        shootId={shoot.id}
        shootName={shoot.event_name}
        onSubmit={handleEditorAssignmentSubmit}
        isSubmitting={isSubmittingEditor}
      />
    </>
  );
}
