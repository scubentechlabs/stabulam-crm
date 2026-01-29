import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Plus, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useExtraWork } from '@/hooks/useExtraWork';
import { useAttendance } from '@/hooks/useAttendance';
import { ExtraWorkRequestForm } from '@/components/extra-work/ExtraWorkRequestForm';
import { ExtraWorkTable } from '@/components/extra-work/ExtraWorkTable';

export default function ExtraWork() {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    pendingRequests, 
    approvedRequests, 
    rejectedRequests,
    isLoading, 
    createExtraWork 
  } = useExtraWork();

  const { todayAttendance } = useAttendance();

  // Check if user has clocked out today (can only submit extra work after clock-out)
  const hasClockedOutToday = todayAttendance?.clock_out_time != null;
  const hasClockedInToday = todayAttendance?.clock_in_time != null;

  const handleSubmit = async (data: Parameters<typeof createExtraWork>[0]) => {
    setIsSubmitting(true);
    const result = await createExtraWork({
      ...data,
      attendance_id: todayAttendance?.id,
    });
    setIsSubmitting(false);
    if (!result.error) {
      setShowNewRequest(false);
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Extra Work</h1>
          <p className="page-description">Log overtime hours and track compensation</p>
        </div>
        <Button 
          onClick={() => setShowNewRequest(true)}
          disabled={!hasClockedOutToday}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Extra Work
        </Button>
      </div>

      {/* Clock-out Warning */}
      {!hasClockedOutToday && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {hasClockedInToday 
              ? "You can only log extra work after clocking out for the day."
              : "You need to clock in and complete your shift before logging extra work."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra Work Requests Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Extra Work Requests</CardTitle>
          <CardDescription>History of all your overtime claims</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ExtraWorkTable 
                extraWorkList={pendingRequests}
                emptyMessage="No pending extra work requests"
              />
            </TabsContent>

            <TabsContent value="approved">
              <ExtraWorkTable 
                extraWorkList={approvedRequests}
                emptyMessage="No approved extra work requests"
              />
            </TabsContent>

            <TabsContent value="rejected">
              <ExtraWorkTable 
                extraWorkList={rejectedRequests}
                emptyMessage="No rejected extra work requests"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Extra Work</DialogTitle>
            <DialogDescription>
              Submit your overtime hours for approval. Only approved requests will be added to your salary.
            </DialogDescription>
          </DialogHeader>
          <ExtraWorkRequestForm
            onSubmit={handleSubmit}
            onCancel={() => setShowNewRequest(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
