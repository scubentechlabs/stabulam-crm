import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Users, FileText, StickyNote, X, UserPlus, Pencil, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { formatTimeOnlyIST, cn } from '@/lib/utils';
import { ShootEditForm } from './ShootEditForm';
import { EditorAssignmentDialog } from './EditorAssignmentDialog';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];

interface ShootDetailDialogProps {
  shoot: ShootWithAssignments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (shootId: string, status: ShootStatus) => void;
  onEditorAssignment?: (shootId: string, data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }) => Promise<{ error: unknown | null }>;
  onAddAssignment?: (shootId: string, userId: string) => void;
  onRemoveAssignment?: (assignmentId: string) => void;
  onUpdateShoot?: (shootId: string, data: {
    event_name?: string;
    brand_name?: string;
    shoot_date?: string;
    shoot_time?: string;
    location?: string;
    brief?: string;
    notes?: string;
  }) => Promise<{ error: unknown | null }>;
}

const statusConfig: Record<ShootStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; menuBg: string; menuText: string }> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary',
    menuBg: 'bg-red-600 hover:bg-red-700',
    menuText: 'text-white'
  },
  in_progress: { 
    label: 'In Progress', 
    variant: 'default',
    menuBg: 'bg-blue-600 hover:bg-blue-700',
    menuText: 'text-white'
  },
  completed: { 
    label: 'Completed', 
    variant: 'outline',
    menuBg: 'bg-yellow-500 hover:bg-yellow-600',
    menuText: 'text-black'
  },
  given_by_editor: { 
    label: 'Given By Editor', 
    variant: 'outline',
    menuBg: 'bg-green-600 hover:bg-green-700',
    menuText: 'text-white'
  },
};

export function ShootDetailDialog({
  shoot,
  open,
  onOpenChange,
  onStatusChange,
  onEditorAssignment,
  onAddAssignment,
  onRemoveAssignment,
  onUpdateShoot,
}: ShootDetailDialogProps) {
  const { isAdmin, user } = useAuth();
  const { activeUsers } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [isSubmittingEditor, setIsSubmittingEditor] = useState(false);

  if (!shoot) return null;

  const status = shoot.status || 'pending';
  const config = statusConfig[status];
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

  const assignedUserIds = shoot.assignments.map(a => a.user_id);
  const availableUsers = activeUsers.filter(u => !assignedUserIds.includes(u.user_id));

  const handleSaveEdit = async (data: {
    event_name: string;
    brand_name: string;
    shoot_date: string;
    shoot_time: string;
    location: string;
    brief?: string;
    notes?: string;
  }) => {
    if (!onUpdateShoot) return;
    setIsSubmitting(true);
    const { error } = await onUpdateShoot(shoot.id, data);
    setIsSubmitting(false);
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
    }
    onOpenChange(newOpen);
  };

  const handleStatusChange = (newStatus: ShootStatus) => {
    if (newStatus === 'given_by_editor') {
      // Open editor assignment dialog instead of direct status change
      setShowEditorDialog(true);
    } else {
      onStatusChange?.(shoot.id, newStatus);
    }
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {isEditing ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit Shoot</DialogTitle>
              </DialogHeader>
              <ShootEditForm
                shoot={shoot}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmitting}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{shoot.event_name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{shoot.brand_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canModify && onUpdateShoot && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canModify ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-[150px] justify-between">
                            {config.label}
                            <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange('pending')}
                            className="p-1 focus:bg-transparent"
                          >
                            <span className={cn(
                              "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                              statusConfig.pending.menuBg,
                              statusConfig.pending.menuText
                            )}>
                              Pending
                              {status === 'pending' && <CheckCircle className="h-3.5 w-3.5 ml-2" />}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange('completed')}
                            className="p-1 focus:bg-transparent"
                          >
                            <span className={cn(
                              "w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                              statusConfig.completed.menuBg,
                              statusConfig.completed.menuText
                            )}>
                              Completed
                              {status === 'completed' && <CheckCircle className="h-3.5 w-3.5 ml-2" />}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange('given_by_editor')}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant={config.variant}>{config.label}</Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Date & Time */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(shoot.shoot_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(shoot.shoot_time)}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{shoot.location}</span>
                </div>

                <Separator />

                {/* Brief */}
                {shoot.brief && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Brief</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{shoot.brief}</p>
                  </div>
                )}

                {/* Notes */}
                {shoot.notes && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      <span>Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{shoot.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Team Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Team ({shoot.assignments.length})</span>
                    </div>
                    
                    {canModify && availableUsers.length > 0 && (
                      <Select onValueChange={(userId) => onAddAssignment?.(shoot.id, userId)}>
                        <SelectTrigger className="w-[160px] h-8">
                          <UserPlus className="h-4 w-4 mr-2" />
                          <span className="text-xs">Add Member</span>
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map(user => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2 pl-6">
                    {shoot.assignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No team members assigned</p>
                    ) : (
                      shoot.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {assignment.profile?.full_name ? getInitials(assignment.profile.full_name) : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{assignment.profile?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{assignment.profile?.email}</p>
                            </div>
                          </div>
                          
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              onClick={() => onRemoveAssignment?.(assignment.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Assignment Dialog */}
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