import { CheckCircle2, Clock, AlertCircle, FileText, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_by?: string | null;
};

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  showType?: boolean;
  alwaysShowType?: boolean;
}

export function TaskList({ tasks, emptyMessage = 'No tasks yet', showType = false, alwaysShowType = false }: TaskListProps) {
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
        <TaskItem key={task.id} task={task} showType={showType || alwaysShowType} />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  showType?: boolean;
}

function TaskItem({ task, showType }: TaskItemProps) {
  const [assignerName, setAssignerName] = useState<string | null>(null);
  const isCompleted = task.status === 'completed';
  const isUtod = task.task_type === 'utod' || task.task_type === 'urgent_tod';
  const isEod = task.task_type === 'eod';
  const isTod = task.task_type === 'tod';

  // Fetch assigner name if task was assigned by someone else
  useEffect(() => {
    async function fetchAssignerName() {
      if (task.assigned_by) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', task.assigned_by)
          .single();
        
        if (data) {
          setAssignerName(data.full_name);
        }
      }
    }
    fetchAssignerName();
  }, [task.assigned_by]);

  const getTaskLabel = () => {
    if (isUtod) return 'UTOD';
    if (isEod) return 'EOD';
    return 'TOD';
  };

  const getBadgeColor = () => {
    if (isUtod) return 'bg-red-500 hover:bg-red-500 text-white';
    if (isEod) return 'bg-green-500 hover:bg-green-500 text-white';
    return 'bg-blue-500 hover:bg-blue-500 text-white'; // TOD = blue
  };

  return (
    <Card className={cn(
      'transition-all',
      isCompleted && 'bg-muted/30'
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
              
              {(showType || isCompleted) && (
                <Badge className={cn('text-xs', getBadgeColor())}>
                  {getTaskLabel()}
                </Badge>
              )}
              
              {task.is_edited && (
                <Badge variant="outline" className="text-xs">
                  Edited
                </Badge>
              )}
              
              {assignerName && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                  <UserCheck className="h-3 w-3" />
                  Assigned by {assignerName}
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
