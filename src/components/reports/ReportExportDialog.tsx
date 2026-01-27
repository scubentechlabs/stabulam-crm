import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportExportDialogProps {
  trigger?: React.ReactNode;
}

type ReportType = 'attendance' | 'tasks' | 'leaves';

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'tasks', label: 'Task Completion Report' },
  { value: 'leaves', label: 'Leave Analysis Report' },
];

const presetRanges = [
  { label: 'This Month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Last Month', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Last 3 Months', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) }) },
  { label: 'Last 6 Months', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 5)), end: endOfMonth(new Date()) }) },
];

export function ReportExportDialog({ trigger }: ReportExportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [isExporting, setIsExporting] = useState(false);

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const { start, end } = preset.getValue();
    setStartDate(start);
    setEndDate(end);
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select a date range',
        variant: 'destructive',
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: 'Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('generate-report-pdf', {
        body: {
          reportType,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      });

      if (error) throw error;

      if (data?.html) {
        // Open HTML in new window for printing/saving as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          
          // Trigger print dialog after content loads
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        }

        toast({
          title: 'Report Generated',
          description: 'Use your browser\'s print dialog to save as PDF',
        });
        setOpen(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Report as PDF
          </DialogTitle>
          <DialogDescription>
            Select a report type and date range to generate a PDF export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset Date Ranges */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date > new Date() || (startDate && date < startDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selected Range Display */}
          {startDate && endDate && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Generating <strong>{reportOptions.find(r => r.value === reportType)?.label}</strong>
              </p>
              <p className="text-muted-foreground">
                From <strong>{format(startDate, 'dd MMM yyyy')}</strong> to <strong>{format(endDate, 'dd MMM yyyy')}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
