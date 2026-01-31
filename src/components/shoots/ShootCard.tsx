import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, Users, MoreVertical, CheckCircle, Play, Trash2, CircleDashed, PackageCheck } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeOnlyIST } from '@/lib/utils';
import { EditorAssignmentDialog } from './EditorAssignmentDialog';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];

interface ShootCardProps {
  shoot: ShootWithAssignments;
  onStatusChange?: (shootId: string, status: ShootStatus) => void;
  onEditorAssignment?: (shootId: string, data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }) => Promise<{ error: unknown | null }>;
  onDelete?: (shootId: string) => void;
  onClick?: () => void;
}

const statusConfig: Record<ShootStatus, { label: string; className: string; icon: React.ElementType; menuBg: string; menuText: string }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-red-500/15 text-red-600 border-red-500/30', 
    icon: CircleDashed,
    menuBg: 'bg-red-600 hover:bg-red-700',
    menuText: 'text-white'
  },
  in_progress: { 
    label: 'In Progress', 
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/30', 
    icon: Play,
    menuBg: 'bg-blue-600 hover:bg-blue-700',
    menuText: 'text-white'
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30', 
    icon: CheckCircle,
    menuBg: 'bg-yellow-500 hover:bg-yellow-600',
    menuText: 'text-black'
  },
  given_by_editor: { 
    label: 'Given By Editor', 
    className: 'bg-green-500/15 text-green-600 border-green-500/30', 
    icon: PackageCheck,
    menuBg: 'bg-green-600 hover:bg-green-700',
    menuText: 'text-white'
  },
};


export function ShootCard({ shoot, onStatusChange, onEditorAssignment, onDelete, onClick }: ShootCardProps) {
  const { isAdmin, user } = useAuth();
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [isSubmittingEditor, setIsSubmittingEditor] = useState(false);
  
  const status = shoot.status || 'pending';
  const config = statusConfig[status];
  
  const isOwner = shoot.created_by === user?.id;
  const isAssigned = shoot.assignments.some(a => a.user_id === user?.id);
  const canModify = isAdmin || isOwner || isAssigned;
  
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
                <DropdownMenuContent align="end" className="bg-popover w-48 p-1">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(shoot.id, 'pending');
                    }}
                    className="p-1 focus:bg-transparent"
                  >
                    <span className={cn(
                      "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                      statusConfig.pending.menuBg,
                      statusConfig.pending.menuText
                    )}>
                      Pending Shoot
                      {status === 'pending' && <CheckCircle className="h-3.5 w-3.5 ml-2" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(shoot.id, 'completed');
                    }}
                    className="p-1 focus:bg-transparent"
                  >
                    <span className={cn(
                      "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                      statusConfig.completed.menuBg,
                      statusConfig.completed.menuText
                    )}>
                      Completed Shoot
                      {status === 'completed' && <CheckCircle className="h-3.5 w-3.5 ml-2" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleGivenByEditorClick}
                    className="p-1 focus:bg-transparent"
                  >
                    <span className={cn(
                      "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                      statusConfig.given_by_editor.menuBg,
                      statusConfig.given_by_editor.menuText
                    )}>
                      Given By Editor
                      {status === 'given_by_editor' && <CheckCircle className="h-3.5 w-3.5 ml-2" />}
                    </span>
                  </DropdownMenuItem>
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
