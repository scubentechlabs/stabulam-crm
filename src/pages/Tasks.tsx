import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

export default function Tasks() {
  const { user } = useAuth();
  const { todayAttendance } = useAttendance();
  const { addTask, addMultipleTasks, isLoading, refetch } = useTasks(todayAttendance?.id);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historicalTasks, setHistoricalTasks] = useState<Task[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch tasks for selected date (including tasks without attendance_id)
  useEffect(() => {
    async function fetchTasksForDate() {
      if (!user) return;
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
      
      if (isToday) {
        // For today, we'll fetch all tasks for today regardless of attendance_id
        setIsLoadingHistory(true);
        try {
          // Get start and end of day in UTC (accounting for IST)
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .or(`created_at.gte.${startOfDay.toISOString()},submitted_at.gte.${startOfDay.toISOString()}`)
            .order('created_at', { ascending: true });

          // Filter to only include tasks from today
          const todayTasks = (tasks || []).filter(task => {
            const taskDate = task.submitted_at 
              ? format(new Date(task.submitted_at), 'yyyy-MM-dd')
              : format(new Date(task.created_at), 'yyyy-MM-dd');
            return taskDate === dateStr;
          });
          
          setHistoricalTasks(todayTasks);
        } catch (error) {
          console.error('Error fetching today tasks:', error);
        } finally {
          setIsLoadingHistory(false);
        }
        return;
      }

      // For historical dates
      setIsLoadingHistory(true);
      try {
        // Fetch tasks by date (using submitted_at or created_at)
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        // Filter tasks for the selected date
        const filteredTasks = (tasks || []).filter(task => {
          const taskDate = task.submitted_at 
            ? format(new Date(task.submitted_at), 'yyyy-MM-dd')
            : format(new Date(task.created_at), 'yyyy-MM-dd');
          return taskDate === dateStr;
        });
        
        setHistoricalTasks(filteredTasks);
      } catch (error) {
        console.error('Error fetching historical tasks:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchTasksForDate();
  }, [selectedDate, user]);

  const handleAddTask = async (title: string, description: string | null): Promise<boolean> => {
    const result = await addTask(title, description, 'tod', todayAttendance?.id);
    return !!result;
  };

  const handleBulkAddTod = async (titles: string[]): Promise<boolean> => {
    return await addMultipleTasks(titles, 'tod', todayAttendance?.id);
  };

  const handleAddUtodTask = async (title: string, description: string | null): Promise<boolean> => {
    const result = await addTask(title, description, 'utod', todayAttendance?.id);
    return !!result;
  };

  const handleBulkAddUtod = async (titles: string[]): Promise<boolean> => {
    return await addMultipleTasks(titles, 'utod', todayAttendance?.id);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  // Use historicalTasks for all dates now (includes today's tasks fetched by date)
  const displayTasks = historicalTasks;
  const todTasksFiltered = displayTasks.filter(t => t.task_type === 'tod');
  const utodTasksFiltered = displayTasks.filter(t => t.task_type === 'utod' || t.task_type === 'urgent_tod');
  const eodTasksFiltered = displayTasks.filter(t => t.status === 'completed');
  const completedCount = displayTasks.filter(t => t.status === 'completed').length;
  const pendingCount = displayTasks.filter(t => t.status === 'pending').length;

  const canAddTasks = todayAttendance?.clock_in_time && !todayAttendance?.clock_out_time;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <p className="page-description">Manage your daily tasks and track progress</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              disabled={(date) => date > new Date()}
            />
          </CardContent>
        </Card>

        {/* Tasks Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {isToday ? "Today's Tasks" : `Tasks for ${format(selectedDate, 'MMMM d, yyyy')}`}
                </CardTitle>
                <CardDescription>
                  {displayTasks.length} total tasks
                </CardDescription>
              </div>
              
              {isToday && canAddTasks && (
                <div className="flex gap-2">
                  <TaskForm 
                    taskType="tod"
                    onSubmit={handleAddTask}
                    onBulkSubmit={handleBulkAddTod}
                    buttonText="Add TOD"
                    buttonVariant="outline"
                  />
                  <TaskForm 
                    taskType="utod"
                    onSubmit={handleAddUtodTask}
                    onBulkSubmit={handleBulkAddUtod}
                    buttonText="Add UTOD"
                    buttonVariant="default"
                  />
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {completedCount} Completed
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingCount} Pending
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {(isLoading || isLoadingHistory) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isToday ? (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({displayTasks.length})</TabsTrigger>
                  <TabsTrigger value="tod">TOD ({todTasksFiltered.length})</TabsTrigger>
                  <TabsTrigger value="utod">UTOD ({utodTasksFiltered.length})</TabsTrigger>
                  <TabsTrigger value="eod">EOD ({eodTasksFiltered.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <TaskList tasks={displayTasks} showType emptyMessage="No tasks for today" />
                </TabsContent>
                
                <TabsContent value="tod" className="mt-4">
                  <TaskList tasks={todTasksFiltered} emptyMessage="No TOD tasks added" />
                </TabsContent>
                
                <TabsContent value="utod" className="mt-4">
                  <TaskList tasks={utodTasksFiltered} emptyMessage="No UTOD tasks added" />
                </TabsContent>

                <TabsContent value="eod" className="mt-4">
                  <TaskList tasks={eodTasksFiltered} showType emptyMessage="No completed tasks yet" />
                </TabsContent>
              </Tabs>
            ) : (
              <TaskList 
                tasks={displayTasks} 
                showType 
                emptyMessage={`No tasks recorded for ${format(selectedDate, 'MMMM d, yyyy')}`}
              />
            )}

            {/* Warning for no clock-in */}
            {isToday && !todayAttendance?.clock_in_time && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-400 mt-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  You need to clock in first before adding tasks.
                </p>
                <Button variant="outline" size="sm" asChild className="ml-auto">
                  <a href="/attendance">Go to Attendance</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
