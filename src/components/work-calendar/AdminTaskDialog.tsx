import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { WorkCalendarTask } from '@/hooks/useWorkCalendarTasks';

interface User {
  user_id: string;
  full_name: string;
}

interface AdminTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  selectedDate?: Date | null;
  editingTask?: WorkCalendarTask | null;
  onSubmit: (data: {
    title: string;
    description: string | null;
    taskType: 'tod' | 'utod' | 'eod';
    assignedUserId: string;
    taskDate: Date;
  }) => Promise<boolean>;
  isSubmitting: boolean;
}

const taskTypes = [
  { value: 'tod', label: 'TOD (Task of the Day)', color: 'bg-blue-500' },
  { value: 'utod', label: 'UTOD (Urgent Task of the Day)', color: 'bg-red-500' },
  { value: 'eod', label: 'EOD (End of Day)', color: 'bg-green-500' },
];

export function AdminTaskDialog({
  open,
  onOpenChange,
  users,
  selectedDate,
  editingTask,
  onSubmit,
  isSubmitting,
}: AdminTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<'tod' | 'utod' | 'eod'>('tod');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [taskDate, setTaskDate] = useState<Date | undefined>(selectedDate || new Date());

  const isEditing = !!editingTask;

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setTaskType(editingTask.task_type as 'tod' | 'utod' | 'eod');
      setAssignedUserId(editingTask.user_id);
      setTaskDate(editingTask.submitted_at 
        ? new Date(editingTask.submitted_at) 
        : new Date(editingTask.created_at)
      );
    } else {
      setTitle('');
      setDescription('');
      setTaskType('tod');
      setAssignedUserId('');
      setTaskDate(selectedDate || new Date());
    }
  }, [editingTask, selectedDate, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !assignedUserId || !taskDate) return;

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      taskType,
      assignedUserId,
      taskDate,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the task details below.' 
              : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Task Type */}
          <div className="grid gap-2">
            <Label>Task Type *</Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', type.color)} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned User */}
          <div className="grid gap-2">
            <Label>Assign to Employee *</Label>
            <Select 
              value={assignedUserId} 
              onValueChange={setAssignedUserId}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Date */}
          <div className="grid gap-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !taskDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {taskDate ? format(taskDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={taskDate}
                  onSelect={setTaskDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim() || !assignedUserId || !taskDate || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Task' : 'Create Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
