import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Briefcase, Loader2 } from 'lucide-react';
import { useLeaves } from '@/hooks/useLeaves';
import { LeaveApprovalCard } from '@/components/leaves/LeaveApprovalCard';

export default function AdminApprovals() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { pendingLeaves, isLoading, updateLeaveStatus } = useLeaves();

  const handleApprove = async (leaveId: string, comments?: string, penalty?: number) => {
    setIsProcessing(true);
    await updateLeaveStatus(leaveId, 'approved', comments, penalty);
    setIsProcessing(false);
  };

  const handleReject = async (leaveId: string, comments?: string) => {
    setIsProcessing(true);
    await updateLeaveStatus(leaveId, 'rejected', comments);
    setIsProcessing(false);
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
      <div className="page-header">
        <h1 className="page-title">Approval Center</h1>
        <p className="page-description">Review and approve leave and extra work requests</p>
      </div>

      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="h-4 w-4" />
            Leave Requests ({pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="extra-work" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Extra Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-6">
          {pendingLeaves.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>Review and approve leave applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending leave requests</p>
                  <p className="text-sm mt-1">All caught up! 🎉</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Pending Leave Requests ({pendingLeaves.length})
                </h2>
              </div>
              <div className="grid gap-4">
                {pendingLeaves.map((leave) => (
                  <LeaveApprovalCard
                    key={leave.id}
                    leave={leave}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isProcessing={isProcessing}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="extra-work" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Extra Work Requests</CardTitle>
              <CardDescription>Review and approve overtime claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending extra work requests</p>
                <p className="text-sm mt-1">Extra work module coming next!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
