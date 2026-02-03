import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, FileText, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDateIST, formatTimeIST } from '@/lib/utils';
import type { WorkCalendarTask } from '@/hooks/useWorkCalendarTasks';

interface TaskDayDetailProps {
  selectedDate: Date | null;
  tasks: WorkCalendarTask[];
  newTaskIds?: Set<string>;
  isAdmin: boolean;
  onEditTask?: (task: WorkCalendarTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

const taskTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  tod: { label: 'TOD', color: 'text-blue-600', bgColor: 'bg-blue-500' },
  utod: { label: 'UTOD', color: 'text-red-600', bgColor: 'bg-red-500' },
  eod: { label: 'EOD', color: 'text-green-600', bgColor: 'bg-green-500' },
};

export function TaskDayDetail({ 
  selectedDate, 
  tasks, 
  newTaskIds = new Set(),
  isAdmin, 
  onEditTask,
  onDeleteTask 
}: TaskDayDetailProps) {
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">Select a date</p>
            <p className="text-sm">Click on a date to view tasks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use IST format for both calendar dates and database timestamps for consistency
  const dateKey = formatDateIST(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasks.filter(task => {
    const taskDateStr = task.submitted_at
      ? formatDateIST(task.submitted_at, 'yyyy-MM-dd')
      : formatDateIST(task.created_at, 'yyyy-MM-dd');
    return taskDateStr === dateKey;
  });

  const todTasks = dayTasks.filter(t => t.task_type === 'tod');
  const utodTasks = dayTasks.filter(t => t.task_type === 'utod' || t.task_type === 'urgent_tod');
  // EOD tab shows all completed tasks regardless of task_type
  const eodTasks = dayTasks.filter(t => t.status === 'completed');

  const renderTaskList = (taskList: WorkCalendarTask[], emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            isNew={newTaskIds.has(task.id)}
            isAdmin={isAdmin}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          <Badge variant="secondary">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({dayTasks.length})</TabsTrigger>
            <TabsTrigger value="tod">TOD ({todTasks.length})</TabsTrigger>
            <TabsTrigger value="utod">UTOD ({utodTasks.length})</TabsTrigger>
            <TabsTrigger value="eod">EOD ({eodTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderTaskList(dayTasks, 'No tasks for this day')}
          </TabsContent>
          <TabsContent value="tod" className="mt-4">
            {renderTaskList(todTasks, 'No TOD tasks')}
          </TabsContent>
          <TabsContent value="utod" className="mt-4">
            {renderTaskList(utodTasks, 'No UTOD tasks')}
          </TabsContent>
          <TabsContent value="eod" className="mt-4">
            {renderTaskList(eodTasks, 'No EOD tasks')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: WorkCalendarTask;
  isNew?: boolean;
  isAdmin: boolean;
  onEdit?: (task: WorkCalendarTask) => void;
  onDelete?: (taskId: string) => void;
}

function TaskItem({ task, isNew = false, isAdmin, onEdit, onDelete }: TaskItemProps) {
  // Normalize urgent_tod (legacy) to utod for display
  const normalizedType = task.task_type === 'urgent_tod' ? 'utod' : task.task_type;
  const config = taskTypeConfig[normalizedType] || taskTypeConfig.tod;
  const isCompleted = task.status === 'completed';

  return (
    <Card className={cn(
      'transition-all',
      isCompleted && 'opacity-75',
      isNew && 'animate-fade-in ring-2 ring-primary/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
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
                
                <Badge className={cn('text-xs text-white', config.bgColor)}>
                  {config.label}
                </Badge>
                
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
                <span>
                  Created: {formatTimeIST(task.created_at)}
                </span>
                {task.completed_at && (
                  <span className="text-green-600">
                    Completed: {formatTimeIST(task.completed_at)}
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

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
