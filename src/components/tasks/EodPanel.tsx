import { useState } from 'react';
import { ClipboardCheck, Send, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface TaskUpdate {
  id: string;
  status: TaskStatus;
  pending_reason?: string;
}

interface EodPanelProps {
  attendanceId: string;
  onComplete: () => void;
}

export function EodPanel({ attendanceId, onComplete }: EodPanelProps) {
  const { allTasks, completeAllEod, isSubmitting } = useTasks(attendanceId);
  const { updateEodStatus } = useAttendance();
  
  const [taskUpdates, setTaskUpdates] = useState<Record<string, TaskUpdate>>({});

  const getTaskUpdate = (taskId: string): TaskUpdate => {
    return taskUpdates[taskId] || { id: taskId, status: 'pending' };
  };

  const toggleTaskComplete = (taskId: string) => {
    const current = getTaskUpdate(taskId);
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...current,
        id: taskId,
        status: current.status === 'completed' ? 'pending' : 'completed',
        pending_reason: current.status === 'completed' ? current.pending_reason : undefined,
      },
    }));
  };

  const setPendingReason = (taskId: string, reason: string) => {
    const current = getTaskUpdate(taskId);
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...current,
        id: taskId,
        pending_reason: reason,
      },
    }));
  };

  const isValid = () => {
    return allTasks.every(task => {
      const update = getTaskUpdate(task.id);
      if (update.status === 'pending') {
        return update.pending_reason && update.pending_reason.trim().length > 0;
      }
      return true;
    });
  };

  const handleSubmitEod = async () => {
    const updates = allTasks.map(task => getTaskUpdate(task.id));
    const success = await completeAllEod(updates);
    
    if (success) {
      await updateEodStatus(true);
      onComplete();
    }
  };

  const completedCount = Object.values(taskUpdates).filter(u => u.status === 'completed').length;
  const pendingCount = allTasks.length - completedCount;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          End of Day (EOD) Report
        </CardTitle>
        <CardDescription>
          Mark each task as completed or pending. Pending tasks require a reason.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount} Completed
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {pendingCount} Pending
          </Badge>
        </div>

        <div className="space-y-3">
          {allTasks.map(task => {
            const update = getTaskUpdate(task.id);
            const isCompleted = update.status === 'completed';
            const needsReason = !isCompleted && !update.pending_reason?.trim();

            return (
              <div 
                key={task.id}
                className={cn(
                  'border rounded-lg p-4 transition-all',
                  isCompleted ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : '',
                  needsReason ? 'border-amber-300 dark:border-amber-700' : ''
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={isCompleted}
                    onCheckedChange={() => toggleTaskComplete(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={`task-${task.id}`}
                        className={cn(
                          'font-medium cursor-pointer',
                          isCompleted && 'line-through text-muted-foreground'
                        )}
                      >
                        {task.title}
                      </Label>
                      <Badge variant={task.task_type === 'urgent_tod' ? 'destructive' : 'secondary'} className="text-xs">
                        {task.task_type === 'urgent_tod' ? 'Urgent' : 'TOD'}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}

                    {!isCompleted && (
                      <div className="space-y-1">
                        <Label className="text-xs text-amber-600">
                          Reason for pending *
                        </Label>
                        <Input
                          placeholder="Why is this task pending?"
                          value={update.pending_reason || ''}
                          onChange={(e) => setPendingReason(task.id, e.target.value)}
                          className={cn(
                            needsReason && 'border-amber-400 focus-visible:ring-amber-400'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tasks to report. You can clock out directly.
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmitEod}
          disabled={!isValid() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Submit EOD & Proceed to Clock Out
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
