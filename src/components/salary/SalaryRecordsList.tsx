import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Check, 
  Clock,
  User,
  Download,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';
import { useSalaryCalculator } from '@/hooks/useSalaryCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SalaryRecordsList() {
  const { salaryRecords, isLoadingSalaryRecords, profiles, finalizeSalary } = useSalaryCalculator();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  const getProfileName = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    return profile?.full_name || 'Unknown';
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleDownloadPDF = async (recordId: string, employeeName: string) => {
    try {
      setDownloadingId(recordId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to download salary slips',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-salary-pdf', {
        body: { salaryRecordId: recordId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate PDF');
      }

      // The response is HTML - open in new window for printing/saving
      const htmlContent = response.data;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          // Auto-trigger print dialog
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }

      toast({
        title: 'PDF Generated',
        description: `Salary slip for ${employeeName} is ready. Use Print → Save as PDF.`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate salary PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmailSalary = async (recordId: string, employeeName: string) => {
    try {
      setEmailingId(recordId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to send emails',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('send-salary-email', {
        body: { salaryRecordId: recordId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: response.data?.message || `Salary slip sent to ${employeeName}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send salary email',
        variant: 'destructive',
      });
    } finally {
      setEmailingId(null);
    }
  };

  const handleSendAllEmails = async () => {
    if (!salaryRecords || salaryRecords.length === 0) return;
    
    try {
      setIsSendingAll(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to send emails',
          variant: 'destructive',
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const record of salaryRecords) {
        try {
          const response = await supabase.functions.invoke('send-salary-email', {
            body: { salaryRecordId: record.id },
          });

          if (response.error) {
            failCount++;
          } else {
            successCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (failCount === 0) {
        toast({
          title: 'All Emails Sent',
          description: `Successfully sent ${successCount} salary slip${successCount > 1 ? 's' : ''} to employees`,
        });
      } else {
        toast({
          title: 'Emails Partially Sent',
          description: `Sent ${successCount} email${successCount > 1 ? 's' : ''}, ${failCount} failed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to send bulk emails',
        variant: 'destructive',
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  if (isLoadingSalaryRecords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!salaryRecords || salaryRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No salary records yet</p>
            <p className="text-sm">Generate salaries to see records here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </div>
        <Button
          onClick={handleSendAllEmails}
          disabled={isSendingAll || !salaryRecords || salaryRecords.length === 0}
          size="sm"
        >
          {isSendingAll ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Email All ({salaryRecords?.length || 0})
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {salaryRecords.map(record => (
          <div 
            key={record.id} 
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{getProfileName(record.user_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.period_start), 'MMM d')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex items-center gap-2 md:gap-4">
                <div className="hidden sm:block">
                  <p className="font-semibold text-lg">{formatCurrency(record.net_salary)}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {formatCurrency(record.base_salary)}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEmailSalary(record.id, getProfileName(record.user_id))}
                  disabled={emailingId === record.id}
                  title="Email Salary Slip"
                >
                  {emailingId === record.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadPDF(record.id, getProfileName(record.user_id))}
                  disabled={downloadingId === record.id}
                  title="Download PDF"
                >
                  {downloadingId === record.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                
                {record.is_finalized ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="h-3 w-3 mr-1" />
                    Finalized
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => finalizeSalary(record.id)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Finalize
                  </Button>
                )}
              </div>
            </div>

            {/* Quick deduction summary */}
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 text-xs">
              {record.late_deductions !== null && record.late_deductions > 0 && (
                <Badge variant="secondary">Late: -{formatCurrency(record.late_deductions)}</Badge>
              )}
              {record.leave_deductions !== null && record.leave_deductions > 0 && (
                <Badge variant="secondary">Leave: -{formatCurrency(record.leave_deductions)}</Badge>
              )}
              {record.tod_penalties !== null && record.tod_penalties > 0 && (
                <Badge variant="secondary">TOD: -{formatCurrency(record.tod_penalties)}</Badge>
              )}
              {record.eod_penalties !== null && record.eod_penalties > 0 && (
                <Badge variant="secondary">EOD: -{formatCurrency(record.eod_penalties)}</Badge>
              )}
              {record.extra_work_additions !== null && record.extra_work_additions > 0 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Extra: +{formatCurrency(record.extra_work_additions)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
