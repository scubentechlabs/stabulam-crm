import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays, addDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, isSundayHoliday } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LeaveType = Database['public']['Enums']['leave_type'];

const leaveFormSchema = z.object({
  leave_type: z.enum(['half_day', 'full_day', 'multiple_days'] as const),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  half_day_period: z.enum(['morning', 'afternoon']).optional(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  delegation_notes: z.string()
    .min(10, 'Please provide detailed delegation notes (at least 10 characters)')
    .max(1000, 'Delegation notes must be less than 1000 characters'),
}).refine((data) => {
  if (data.leave_type === 'half_day' && !data.half_day_period) {
    return false;
  }
  return true;
}, {
  message: 'Please select morning or afternoon for half-day leave',
  path: ['half_day_period'],
}).refine((data) => {
  return data.end_date >= data.start_date;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

interface LeaveRequestFormProps {
  onSubmit: (data: {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    half_day_period?: string | null;
    reason?: string;
    delegation_notes: string;
  }) => Promise<{ error: unknown }>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function LeaveRequestForm({ onSubmit, onCancel, isSubmitting }: LeaveRequestFormProps) {
  const [hasAdvanceNotice, setHasAdvanceNotice] = useState(false); // Default to false since today is < 48 hours

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leave_type: 'full_day',
      start_date: new Date(), // Default to today
      end_date: new Date(),
      delegation_notes: '',
      reason: '',
    },
  });
  
  // Check advance notice on initial load
  useEffect(() => {
    checkAdvanceNotice(new Date());
  }, []);

  const leaveType = form.watch('leave_type');
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  // Calculate advance notice when start date changes
  const checkAdvanceNotice = (date: Date) => {
    const now = new Date();
    const hoursDifference = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    setHasAdvanceNotice(hoursDifference >= 48);
  };

  // Calculate number of working days (excluding Sundays)
  const getDaysCount = () => {
    if (!startDate || !endDate) return 0;
    if (leaveType === 'half_day') return 0.5;
    
    // For multiple days, count only working days (exclude Sundays)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const workingDays = days.filter(day => !isSundayHoliday(day));
    return workingDays.length;
  };

  const handleSubmit = async (values: LeaveFormValues) => {
    const result = await onSubmit({
      leave_type: values.leave_type,
      start_date: format(values.start_date, 'yyyy-MM-dd'),
      end_date: format(values.end_date, 'yyyy-MM-dd'),
      half_day_period: values.half_day_period || null,
      reason: values.reason,
      delegation_notes: values.delegation_notes,
    });

    if (!result.error) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Leave Type */}
        <FormField
          control={form.control}
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset end date to start date for non-multiple days
                    if (value !== 'multiple_days') {
                      form.setValue('end_date', form.getValues('start_date'));
                    }
                  }}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="half_day"
                      id="half_day"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="half_day"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-sm font-medium">Half Day</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="full_day"
                      id="full_day"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="full_day"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-sm font-medium">Full Day</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="multiple_days"
                      id="multiple_days"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="multiple_days"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-sm font-medium">Multiple Days</span>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Half Day Period */}
        {leaveType === 'half_day' && (
          <FormField
            control={form.control}
            name="half_day_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select morning or afternoon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="morning">Morning (First Half)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (Second Half)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Start Date */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                {leaveType === 'multiple_days' ? 'Start Date' : 'Date'}
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      if (date) {
                        checkAdvanceNotice(date);
                        if (leaveType !== 'multiple_days') {
                          form.setValue('end_date', date);
                        }
                      }
                    }}
                    disabled={(date) => startOfDay(date) < startOfDay(new Date()) || isSundayHoliday(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date (only for multiple days) */}
        {leaveType === 'multiple_days' && (
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => startOfDay(date) < startOfDay(startDate) || isSundayHoliday(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Days Summary */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">
            Total Working Days: <span className="text-primary">{getDaysCount()}</span>
            <span className="text-xs text-muted-foreground ml-2">(Sundays excluded)</span>
          </p>
        </div>

        {/* Advance Notice Warning */}
        {!hasAdvanceNotice && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>No Advance Notice:</strong> Leave requests without 48-hour advance notice may incur a penalty of ₹250 plus salary deduction.
            </AlertDescription>
          </Alert>
        )}

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief reason for leave..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Delegation Notes */}
        <FormField
          control={form.control}
          name="delegation_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Delegation Notes *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Who will handle your tasks? Provide detailed handover notes..."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain who will cover your responsibilities during your absence
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
