import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Briefcase, Clock, Loader2, Wallet } from 'lucide-react';
import { useLeaves } from '@/hooks/useLeaves';
import { useExtraWork } from '@/hooks/useExtraWork';
import { useAttendanceRegularization } from '@/hooks/useAttendanceRegularization';
import { LeaveApprovalTable } from '@/components/leaves/LeaveApprovalTable';
import { ExtraWorkApprovalTable } from '@/components/extra-work/ExtraWorkApprovalTable';
import { RegularizationApprovalTable } from '@/components/attendance/RegularizationApprovalTable';
import { LeaveBalanceManager } from '@/components/leaves/LeaveBalanceManager';

export default function AdminApprovals() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { pendingLeaves, isLoading: leavesLoading, updateLeaveStatus } = useLeaves();
  const { pendingRequests: pendingExtraWork, isLoading: extraWorkLoading, updateExtraWorkStatus } = useExtraWork();
  const { pendingRegularizations, isLoading: regularizationsLoading, updateRegularizationStatus } = useAttendanceRegularization();

  const isLoading = leavesLoading || extraWorkLoading || regularizationsLoading;

  const handleApproveLeave = async (leaveId: string, comments?: string, penalty?: number) => {
    setIsProcessing(true);
    await updateLeaveStatus(leaveId, 'approved', comments, penalty);
    setIsProcessing(false);
  };

  const handleRejectLeave = async (leaveId: string, comments?: string) => {
    setIsProcessing(true);
    await updateLeaveStatus(leaveId, 'rejected', comments);
    setIsProcessing(false);
  };

  const handleApproveExtraWork = async (extraWorkId: string, comments?: string, adjustedCompensation?: number) => {
    setIsProcessing(true);
    await updateExtraWorkStatus(extraWorkId, 'approved', comments, adjustedCompensation);
    setIsProcessing(false);
  };

  const handleRejectExtraWork = async (extraWorkId: string, comments?: string) => {
    setIsProcessing(true);
    await updateExtraWorkStatus(extraWorkId, 'rejected', comments);
    setIsProcessing(false);
  };

  const handleApproveRegularization = async (regularizationId: string, comments?: string) => {
    setIsProcessing(true);
    await updateRegularizationStatus(regularizationId, 'approved', comments);
    setIsProcessing(false);
  };

  const handleRejectRegularization = async (regularizationId: string, comments?: string) => {
    setIsProcessing(true);
    await updateRegularizationStatus(regularizationId, 'rejected', comments);
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPending = pendingLeaves.length + pendingExtraWork.length + pendingRegularizations.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Approval Center</h1>
        <p className="page-description">
          Review and approve leave and extra work requests
          {totalPending > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {totalPending} pending
            </span>
          )}
        </p>
      </div>

      <Tabs defaultValue="leaves">
        <TabsList className="flex-wrap">
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="h-4 w-4" />
            Leaves ({pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="extra-work" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Extra Work ({pendingExtraWork.length})
          </TabsTrigger>
          <TabsTrigger value="regularizations" className="gap-2">
            <Clock className="h-4 w-4" />
            Regularizations ({pendingRegularizations.length})
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-2">
            <Wallet className="h-4 w-4" />
            Leave Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Review and approve leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveApprovalTable
                leaves={pendingLeaves}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra-work" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Extra Work Requests</CardTitle>
              <CardDescription>Review and approve overtime claims</CardDescription>
            </CardHeader>
            <CardContent>
              <ExtraWorkApprovalTable
                extraWorkList={pendingExtraWork}
                onApprove={handleApproveExtraWork}
                onReject={handleRejectExtraWork}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regularizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Regularization Requests</CardTitle>
              <CardDescription>Review and approve attendance corrections</CardDescription>
            </CardHeader>
            <CardContent>
              <RegularizationApprovalTable
                regularizations={pendingRegularizations}
                onApprove={handleApproveRegularization}
                onReject={handleRejectRegularization}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <LeaveBalanceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
