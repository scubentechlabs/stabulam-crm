import { CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  showType?: boolean;
}

export function TaskList({ tasks, emptyMessage = 'No tasks yet', showType = false }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} showType={showType} />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  showType?: boolean;
}

function TaskItem({ task, showType }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isUtod = task.task_type === 'utod' || task.task_type === 'urgent_tod';
  const isEod = task.task_type === 'eod';

  const getTaskLabel = () => {
    if (isUtod) return 'UTOD';
    if (isEod) return 'EOD';
    return 'TOD';
  };

  const getBadgeVariant = () => {
    if (isUtod) return 'destructive';
    if (isEod) return 'default';
    return 'secondary';
  };

  return (
    <Card className={cn(
      'transition-all',
      isCompleted && 'opacity-75'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 p-1.5 rounded-full',
            isCompleted 
              ? 'bg-green-500/10 text-green-600' 
              : 'bg-muted text-muted-foreground'
          )}>
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn(
                'font-medium',
                isCompleted && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h4>
              
              {showType && (
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {getTaskLabel()}
                </Badge>
              )}
              
              {task.is_edited && (
                <Badge variant="outline" className="text-xs">
                  Edited
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {task.submitted_at && (
                <span>
                  Added: {format(new Date(task.submitted_at), 'hh:mm a')}
                </span>
              )}
              {task.completed_at && (
                <span className="text-green-600">
                  Completed: {format(new Date(task.completed_at), 'hh:mm a')}
                </span>
              )}
            </div>

            {task.pending_reason && (
              <div className="mt-2 flex items-start gap-1.5 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{task.pending_reason}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
