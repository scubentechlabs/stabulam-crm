import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceStatus } from '@/components/attendance/AttendanceStatus';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { AttendanceExportDialog } from '@/components/attendance/AttendanceExportDialog';
import { ClockInCard } from '@/components/attendance/ClockInCard';
import { ClockOutCard } from '@/components/attendance/ClockOutCard';
import { RegularizationRequestForm } from '@/components/attendance/RegularizationRequestForm';
import { RegularizationCard } from '@/components/attendance/RegularizationCard';
import { TodPanel } from '@/components/tasks/TodPanel';
import { EodPanel } from '@/components/tasks/EodPanel';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { useAttendance } from '@/hooks/useAttendance';
import { useTasks } from '@/hooks/useTasks';
import { useAttendanceRegularization } from '@/hooks/useAttendanceRegularization';
import { Loader2, Clock, AlertTriangle, CheckCircle2, Calendar, Download, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type AttendanceStep = 'clock-in' | 'tod' | 'working' | 'eod' | 'clock-out' | 'complete';

export default function Attendance() {
  const { todayAttendance, isLoading, refetch } = useAttendance();
  const { addTask, urgentTasks, todTasks, refetch: refetchTasks } = useTasks(todayAttendance?.id);
  const { regularizations, isLoading: regularizationsLoading } = useAttendanceRegularization();
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

  const handleAddUrgentTask = async (title: string, description: string | null): Promise<boolean> => {
    const result = await addTask(title, description, 'urgent_tod', todayAttendance?.id);
    if (result) {
      refetchTasks();
    }
    return !!result;
  };

  if (isLoading || regularizationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Track your daily clock-in and clock-out</p>
        </div>
        <div className="flex gap-2">
          <AttendanceExportDialog
            trigger={
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            }
          />
          <RegularizationRequestForm
            trigger={
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Request Correction
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="regularizations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Corrections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-6">

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
              <TabsTrigger value="urgent">Urgent Tasks</TabsTrigger>
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
            
            <TabsContent value="urgent" className="mt-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Urgent Tasks
                  </CardTitle>
                  <TaskForm 
                    taskType="urgent_tod"
                    onSubmit={handleAddUrgentTask}
                    buttonText="Add Urgent"
                    buttonVariant="outline"
                  />
                </CardHeader>
                <CardContent>
                  <TaskList 
                    tasks={urgentTasks} 
                    emptyMessage="No urgent tasks added"
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
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-12">
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
      )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AttendanceCalendar />
        </TabsContent>

        <TabsContent value="regularizations" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Attendance Corrections</h2>
                <p className="text-sm text-muted-foreground">
                  Your submitted regularization requests
                </p>
              </div>
              <RegularizationRequestForm />
            </div>

            {regularizations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No regularization requests yet</p>
                    <p className="text-sm mt-1">
                      Request a correction if you missed clocking in/out
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {regularizations.map((reg) => (
                  <RegularizationCard key={reg.id} regularization={reg} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
