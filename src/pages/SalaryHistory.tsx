import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Loader2,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type SalaryRecord = Database['public']['Tables']['salary_records']['Row'];

export default function SalaryHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: salaryRecords, isLoading } = useQuery({
    queryKey: ['my-salary-records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false });
      if (error) throw error;
      return data as SalaryRecord[];
    },
    enabled: !!user,
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleDownloadPDF = async (recordId: string, periodStart: string, periodEnd: string) => {
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
        description: `Salary slip for ${format(new Date(periodStart), 'MMM yyyy')} is ready. Use Print → Save as PDF.`,
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

  // Calculate totals for summary
  const totalEarned = salaryRecords?.reduce((sum, r) => sum + r.net_salary, 0) || 0;
  const totalDeductions = salaryRecords?.reduce((sum, r) => 
    sum + (r.late_deductions || 0) + (r.leave_deductions || 0) + (r.leave_penalties || 0) + 
    (r.tod_penalties || 0) + (r.eod_penalties || 0), 0) || 0;
  const totalExtras = salaryRecords?.reduce((sum, r) => sum + (r.extra_work_additions || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Salary History</h1>
          <p className="page-description">View your salary records and download slips</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Salary History</h1>
        <p className="page-description">View your salary records and download slips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarned)}</div>
            <p className="text-xs text-muted-foreground">
              Across {salaryRecords?.length || 0} pay periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">
              Late, leave & report penalties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extra Work Bonus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalExtras)}</div>
            <p className="text-xs text-muted-foreground">
              Additional compensation earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>Your salary slips from previous pay periods</CardDescription>
        </CardHeader>
        <CardContent>
          {!salaryRecords || salaryRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No salary records yet</p>
              <p className="text-sm">Your salary slips will appear here once generated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salaryRecords.map(record => (
                <div 
                  key={record.id} 
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(record.period_start), 'MMMM yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.period_start), 'MMM d')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(record.net_salary)}</p>
                        <p className="text-xs text-muted-foreground">
                          Base: {formatCurrency(record.base_salary)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(record.id, record.period_start, record.period_end)}
                          disabled={downloadingId === record.id}
                        >
                          {downloadingId === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download
                        </Button>
                        
                        {record.is_finalized && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Finalized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deduction/Addition Summary */}
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
                    {(record.late_deductions || 0) === 0 && 
                     (record.leave_deductions || 0) === 0 && 
                     (record.tod_penalties || 0) === 0 && 
                     (record.eod_penalties || 0) === 0 && 
                     (record.extra_work_additions || 0) === 0 && (
                      <span className="text-muted-foreground">No deductions or additions</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
