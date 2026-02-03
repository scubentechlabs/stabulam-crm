import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceStatus } from '@/components/attendance/AttendanceStatus';
import { ClockInCard } from '@/components/attendance/ClockInCard';
import { ClockOutCard } from '@/components/attendance/ClockOutCard';
import { TodPanel } from '@/components/tasks/TodPanel';
import { EodPanel } from '@/components/tasks/EodPanel';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { useAttendance } from '@/hooks/useAttendance';
import { useTasks } from '@/hooks/useTasks';
import { Loader2, Clock, AlertTriangle, CheckCircle2, ClipboardCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type AttendanceStep = 'clock-in' | 'tod' | 'working' | 'eod' | 'clock-out' | 'complete';

export default function Attendance() {
  const { todayAttendance, isLoading, refetch } = useAttendance();
  const { addTask, utodTasks, todTasks, refetch: refetchTasks } = useTasks(todayAttendance?.id);
  const [currentStep, setCurrentStep] = useState<AttendanceStep>('clock-in');
  const [showEod, setShowEod] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!todayAttendance) {
      setCurrentStep('clock-in');
    } else if (!todayAttendance.clock_in_time) {
      setCurrentStep('clock-in');
    } else if (!todayAttendance.tod_submitted) {
      setCurrentStep('tod');
    } else if (!todayAttendance.clock_out_time) {
      setCurrentStep(showEod ? 'eod' : 'working');
    } else {
      setCurrentStep('complete');
    }
  }, [todayAttendance, isLoading, showEod]);

  const handleClockInComplete = () => {
    refetch();
    setCurrentStep('tod');
  };

  const handleTodComplete = () => {
    refetch();
    setCurrentStep('working');
  };

  const handleRequestEod = () => {
    setShowEod(true);
    setCurrentStep('eod');
  };

  const handleEodComplete = () => {
    refetch();
    setShowEod(false);
    setCurrentStep('clock-out');
  };

  const handleClockOutComplete = () => {
    refetch();
    setCurrentStep('complete');
  };

  const handleAddUtodTask = async (title: string, description: string | null): Promise<boolean> => {
    const result = await addTask(title, description, 'utod', todayAttendance?.id);
    if (result) {
      refetchTasks();
    }
    return !!result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-description">Track your daily clock-in and clock-out</p>
      </div>

      {/* Status Bar - Always visible when clocked in */}
      {todayAttendance?.clock_in_time && (
        <AttendanceStatus
          clockInTime={todayAttendance.clock_in_time}
          clockOutTime={todayAttendance.clock_out_time}
          isLate={todayAttendance.is_late}
          lateMinutes={todayAttendance.late_minutes}
          todSubmitted={todayAttendance.tod_submitted}
          eodSubmitted={todayAttendance.eod_submitted}
        />
      )}

      {/* Main Content based on step */}
      {currentStep === 'clock-in' && (
        <ClockInCard onClockInComplete={handleClockInComplete} />
      )}

      {currentStep === 'tod' && todayAttendance && (
        <TodPanel 
          attendanceId={todayAttendance.id} 
          onComplete={handleTodComplete}
        />
      )}

      {currentStep === 'working' && todayAttendance && (
        <div className="space-y-6">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
              <TabsTrigger value="tasks">Today's Tasks</TabsTrigger>
              <TabsTrigger value="utod">UTOD Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tasks for Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList 
                    tasks={todTasks} 
                    emptyMessage="No tasks added yet"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="utod" className="mt-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    UTOD (Urgent Task of the Day)
                  </CardTitle>
                  <TaskForm 
                    taskType="utod"
                    onSubmit={handleAddUtodTask}
                    buttonText="Add UTOD"
                    buttonVariant="outline"
                  />
                </CardHeader>
                <CardContent>
                  <TaskList 
                    tasks={utodTasks} 
                    emptyMessage="No UTOD tasks added"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Clock Out Section */}
          <ClockOutCard
            eodCompleted={todayAttendance.eod_submitted || false}
            onRequestEod={handleRequestEod}
            onClockOutComplete={handleClockOutComplete}
          />
        </div>
      )}

      {currentStep === 'eod' && todayAttendance && (
        <EodPanel 
          attendanceId={todayAttendance.id}
          onComplete={handleEodComplete}
        />
      )}

      {currentStep === 'clock-out' && todayAttendance && (
        <ClockOutCard
          eodCompleted={true}
          onRequestEod={handleRequestEod}
          onClockOutComplete={handleClockOutComplete}
        />
      )}

      {currentStep === 'complete' && (
        <div className="space-y-6">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Day Complete!</h3>
              <p className="text-muted-foreground">
                You have successfully completed your attendance for today.
              </p>
              {todayAttendance?.clock_out_time && (
                <Alert className="mt-4 text-left">
                  <AlertTitle>Extra Work Available</AlertTitle>
                  <AlertDescription>
                    If you worked beyond your shift, you can log extra work hours from the Extra Work page.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* EOD Summary Tabs */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                EOD Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {todTasks.filter(t => t.status === 'completed').length + utodTasks.filter(t => t.status === 'completed').length} Completed
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {todTasks.filter(t => t.status === 'pending').length + utodTasks.filter(t => t.status === 'pending').length} Pending
                </Badge>
              </div>

              <Tabs defaultValue="completed" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="completed">
                    Completed ({todTasks.filter(t => t.status === 'completed').length + utodTasks.filter(t => t.status === 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({todTasks.filter(t => t.status === 'pending').length + utodTasks.filter(t => t.status === 'pending').length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="completed" className="mt-4">
                  <TaskList 
                    tasks={[...todTasks, ...utodTasks].filter(t => t.status === 'completed')} 
                    showType
                    emptyMessage="No tasks completed today"
                  />
                </TabsContent>
                
                <TabsContent value="pending" className="mt-4">
                  {[...todTasks, ...utodTasks].filter(t => t.status === 'pending').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-green-500 opacity-50" />
                      <p>All tasks completed!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...todTasks, ...utodTasks].filter(t => t.status === 'pending').map(task => (
                        <Card key={task.id} className="border-amber-200 dark:border-amber-800">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <Badge variant={task.task_type === 'utod' || task.task_type === 'urgent_tod' ? 'destructive' : 'secondary'} className="text-xs">
                                    {task.task_type === 'utod' || task.task_type === 'urgent_tod' ? 'UTOD' : 'TOD'}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                )}
                                {task.pending_reason && (
                                  <div className="mt-2 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span><strong>Reason:</strong> {task.pending_reason}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
