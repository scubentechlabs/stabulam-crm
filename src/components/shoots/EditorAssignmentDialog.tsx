import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Link2, FileText, User, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EditorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shootId: string;
  shootName: string;
  onSubmit: (data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }) => Promise<{ error: unknown | null }>;
  isSubmitting?: boolean;
}

export function EditorAssignmentDialog({
  open,
  onOpenChange,
  shootId,
  shootName,
  onSubmit,
  isSubmitting = false,
}: EditorAssignmentDialogProps) {
  // Use teamMembers (available to all authenticated users) instead of activeUsers (admin-only)
  const { teamMembers, isLoadingTeam } = useUsers();
  const [driveLink, setDriveLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEditor, setSelectedEditor] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!driveLink.trim()) {
      newErrors.driveLink = 'Drive link is required';
    } else if (!driveLink.startsWith('http')) {
      newErrors.driveLink = 'Please enter a valid URL';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!selectedEditor) {
      newErrors.selectedEditor = 'Please select an editor';
    }
    
    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    await onSubmit({
      editor_drive_link: driveLink,
      editor_description: description,
      assigned_editor_id: selectedEditor,
      editor_deadline: deadline!.toISOString().split('T')[0],
    });
    
    // Reset form
    setDriveLink('');
    setDescription('');
    setSelectedEditor('');
    setDeadline(undefined);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setDriveLink('');
      setDescription('');
      setSelectedEditor('');
      setDeadline(undefined);
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Assign to Editor
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Assign "{shootName}" to an editor with requirements
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drive Link */}
          <div className="space-y-2">
            <Label htmlFor="driveLink" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Drive Link <span className="text-destructive">*</span>
            </Label>
            <Input
              id="driveLink"
              placeholder="https://drive.google.com/..."
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              className={errors.driveLink ? 'border-destructive' : ''}
            />
            {errors.driveLink && (
              <p className="text-xs text-destructive">{errors.driveLink}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requirements / Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter detailed requirements for the editor..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Video Editor Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assign Video Editor <span className="text-destructive">*</span>
            </Label>
            {isLoadingTeam ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading editors...
              </div>
            ) : (
              <Select value={selectedEditor} onValueChange={setSelectedEditor}>
                <SelectTrigger className={errors.selectedEditor ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select an editor" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                  {teamMembers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">No editors available</div>
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.selectedEditor && (
              <p className="text-xs text-destructive">{errors.selectedEditor}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Deadline <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground",
                    errors.deadline && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Select deadline date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.deadline && (
              <p className="text-xs text-destructive">{errors.deadline}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Assign to Editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
