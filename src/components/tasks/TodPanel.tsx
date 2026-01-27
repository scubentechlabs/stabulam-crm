import { useState } from 'react';
import { ClipboardList, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';

interface TodPanelProps {
  attendanceId: string;
  onComplete: () => void;
}

export function TodPanel({ attendanceId, onComplete }: TodPanelProps) {
  const { todTasks, addTask, isSubmitting } = useTasks(attendanceId);
  const { updateTodStatus } = useAttendance();
  const [isSubmittingTod, setIsSubmittingTod] = useState(false);

  const handleAddTask = async (title: string, description: string | null): Promise<boolean> => {
    const result = await addTask(title, description, 'tod', attendanceId);
    return !!result;
  };

  const handleSubmitTod = async () => {
    if (todTasks.length === 0) return;

    setIsSubmittingTod(true);
    await updateTodStatus(true);
    setIsSubmittingTod(false);
    onComplete();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Task of the Day (TOD)
        </CardTitle>
        <CardDescription>
          Add your planned tasks for today. You can edit them once before final submission.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {todTasks.length} task{todTasks.length !== 1 ? 's' : ''} added
          </p>
          <TaskForm 
            taskType="tod" 
            onSubmit={handleAddTask}
            buttonText="Add Task"
          />
        </div>

        <TaskList 
          tasks={todTasks} 
          emptyMessage="No tasks added yet. Add at least one task to continue."
        />
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmitTod}
          disabled={todTasks.length === 0 || isSubmitting || isSubmittingTod}
        >
          {isSubmittingTod ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Submit TOD ({todTasks.length} task{todTasks.length !== 1 ? 's' : ''})
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
