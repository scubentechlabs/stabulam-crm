import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, subDays } from 'date-fns';
import { CalendarIcon, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAttendanceRegularization } from '@/hooks/useAttendanceRegularization';

const formSchema = z.object({
  request_date: z.date({
    required_error: 'Please select a date',
  }),
  requested_clock_in: z.string().min(1, 'Clock-in time is required'),
  requested_clock_out: z.string().min(1, 'Clock-out time is required'),
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)').max(500, 'Reason must be less than 500 characters'),
}).refine((data) => {
  const clockIn = data.requested_clock_in;
  const clockOut = data.requested_clock_out;
  return clockIn < clockOut;
}, {
  message: 'Clock-out time must be after clock-in time',
  path: ['requested_clock_out'],
});

type FormValues = z.infer<typeof formSchema>;

interface RegularizationRequestFormProps {
  trigger?: React.ReactNode;
}

export function RegularizationRequestForm({ trigger }: RegularizationRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRegularization } = useAttendanceRegularization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requested_clock_in: '09:00',
      requested_clock_out: '18:00',
      reason: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const result = await createRegularization({
      request_date: format(values.request_date, 'yyyy-MM-dd'),
      requested_clock_in: values.requested_clock_in,
      requested_clock_out: values.requested_clock_out,
      reason: values.reason,
    });

    if (!result.error) {
      form.reset();
      setOpen(false);
    }
    setIsSubmitting(false);
  };

  // Only allow dates in the past 30 days
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Request Regularization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Attendance Regularization</DialogTitle>
          <DialogDescription>
            Submit a request to correct your attendance for a missed clock-in/out.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="request_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
                        disabled={(date) =>
                          date > today || date < thirtyDaysAgo
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the date you need to regularize (last 30 days only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requested_clock_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock-in Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requested_clock_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock-out Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you need this regularization (e.g., forgot to clock in, system issue, etc.)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed explanation for your request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
