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
  Lock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SalaryRecordsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Fetch salary records
  const { data: salaryRecords, isLoading } = useQuery({
    queryKey: ['salary-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for names
  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-salary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (error) throw error;
      return data;
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('salary_records')
        .update({ is_finalized: true })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast({
        title: 'Salary Finalized',
        description: 'The salary record has been locked.',
      });
    },
  });

  const getProfileName = (userId: string) => {
    return profiles?.find(p => p.user_id === userId)?.full_name || 'Unknown';
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleDownloadPDF = async (recordId: string, employeeName: string) => {
    try {
      setDownloadingId(recordId);
      
      const response = await supabase.functions.invoke('generate-salary-pdf', {
        body: { salaryRecordId: recordId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate PDF');
      }

      const htmlContent = response.data;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
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
          description: `Successfully sent ${successCount} salary slip${successCount > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: 'Emails Partially Sent',
          description: `Sent ${successCount}, ${failCount} failed`,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!salaryRecords || salaryRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No salary records yet</p>
            <p className="text-sm">Generate salaries from the Calculate tab</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>Previously generated salary slips</CardDescription>
        </div>
        <Button
          onClick={handleSendAllEmails}
          disabled={isSendingAll || salaryRecords.length === 0}
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
              Email All ({salaryRecords.length})
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{getProfileName(record.user_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {record.month_year || `${format(new Date(record.period_start), 'MMM d')} - ${format(new Date(record.period_end), 'MMM d, yyyy')}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="font-semibold text-lg">{formatCurrency(record.net_salary)}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {formatCurrency(record.base_salary)}
                  </p>
                </div>
                
                <Button
                  size="icon"
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
                  size="icon"
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
                    <Lock className="h-3 w-3 mr-1" />
                    Finalized
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => finalizeMutation.mutate(record.id)}
                    disabled={finalizeMutation.isPending}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Finalize
                  </Button>
                )}
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 text-xs">
              {record.included_overtime && record.overtime_amount && record.overtime_amount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Overtime: +{formatCurrency(record.overtime_amount)}
                </Badge>
              )}
              {record.included_bonus && record.bonus_amount && record.bonus_amount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Bonus: +{formatCurrency(record.bonus_amount)}
                </Badge>
              )}
              {record.included_late && record.late_deductions && record.late_deductions > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  Late: -{formatCurrency(record.late_deductions)}
                </Badge>
              )}
              {record.included_custom_deduction && record.custom_deduction_amount && record.custom_deduction_amount > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Deduction: -{formatCurrency(record.custom_deduction_amount)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
