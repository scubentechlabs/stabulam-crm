import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useAttendanceExport } from '@/hooks/useAttendanceExport';

interface AttendanceExportDialogProps {
  userId?: string; // For admin exporting specific user
  trigger?: React.ReactNode;
}

export function AttendanceExportDialog({ userId, trigger }: AttendanceExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const { exportAttendance, isExporting } = useAttendanceExport();

  const handleExport = async () => {
    await exportAttendance({
      startDate,
      endDate,
      format: exportFormat,
      userId,
    });
    setOpen(false);
  };

  const presetRanges = [
    {
      label: 'This Month',
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    },
    {
      label: 'Last Month',
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    },
    {
      label: 'Last 3 Months',
      start: startOfMonth(subMonths(new Date(), 3)),
      end: endOfMonth(new Date()),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
          <DialogDescription>
            Choose a date range and format to export attendance data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Preset Ranges */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate(preset.start);
                    setEndDate(preset.end);
                  }}
                  className={cn(
                    format(startDate, 'yyyy-MM-dd') === format(preset.start, 'yyyy-MM-dd') &&
                    format(endDate, 'yyyy-MM-dd') === format(preset.end, 'yyyy-MM-dd')
                      ? 'border-primary bg-primary/10'
                      : ''
                  )}
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
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > new Date() || date > endDate}
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
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date > new Date() || date < startDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as 'csv' | 'pdf')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="csv"
                  id="csv"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="csv"
                  className={cn(
                    'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                  )}
                >
                  <FileSpreadsheet className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">CSV</span>
                  <span className="text-xs text-muted-foreground">Spreadsheet</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="pdf"
                  id="pdf"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="pdf"
                  className={cn(
                    'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                  )}
                >
                  <FileText className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">Print-ready</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
