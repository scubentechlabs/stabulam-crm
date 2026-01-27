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
import { Calendar, Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLeaves } from '@/hooks/useLeaves';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { LeaveCard } from '@/components/leaves/LeaveCard';
import { LeaveBalanceCard } from '@/components/leaves/LeaveBalanceCard';

export default function Leaves() {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    pendingLeaves, 
    approvedLeaves, 
    rejectedLeaves, 
    isLoading, 
    createLeave, 
    cancelLeave 
  } = useLeaves();

  const handleSubmit = async (data: Parameters<typeof createLeave>[0]) => {
    setIsSubmitting(true);
    const result = await createLeave(data);
    setIsSubmitting(false);
    if (!result.error) {
      setShowNewRequest(false);
    }
    return result;
  };

  const handleCancel = async (leaveId: string) => {
    await cancelLeave(leaveId);
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
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-description">Apply for and track your leave requests</p>
        </div>
        <Button onClick={() => setShowNewRequest(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <LeaveBalanceCard />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingLeaves.length}</p>
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
                <p className="text-2xl font-bold">{approvedLeaves.length}</p>
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
                <p className="text-2xl font-bold">{rejectedLeaves.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Requests</CardTitle>
          <CardDescription>History of all your leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedLeaves.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending leave requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingLeaves.map((leave) => (
                    <LeaveCard key={leave.id} leave={leave} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No approved leave requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {approvedLeaves.map((leave) => (
                    <LeaveCard key={leave.id} leave={leave} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejectedLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No rejected leave requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {rejectedLeaves.map((leave) => (
                    <LeaveCard key={leave.id} leave={leave} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
            <DialogDescription>
              Submit a leave request for approval. Requests with less than 48 hours notice may incur a penalty.
            </DialogDescription>
          </DialogHeader>
          <LeaveRequestForm
            onSubmit={handleSubmit}
            onCancel={() => setShowNewRequest(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
