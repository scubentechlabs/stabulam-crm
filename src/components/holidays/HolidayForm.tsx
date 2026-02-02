import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useHolidays, Holiday } from '@/hooks/useHolidays';

const holidayFormSchema = z.object({
  name: z.string().min(1, 'Holiday name is required').max(100),
  date: z.date({
    required_error: 'Please select a date',
  }),
  description: z.string().max(500).optional(),
  is_recurring: z.boolean().default(false),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

interface HolidayFormProps {
  holiday?: Holiday;
  onSuccess?: () => void;
}

export function HolidayForm({ holiday, onSuccess }: HolidayFormProps) {
  const { addHoliday, updateHoliday, isAdding, isUpdating } = useHolidays();
  const isEditing = !!holiday;
  const isSubmitting = isAdding || isUpdating;

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: holiday?.name || '',
      date: holiday ? new Date(holiday.date) : undefined,
      description: holiday?.description || '',
      is_recurring: holiday?.is_recurring || false,
    },
  });

  const onSubmit = (data: HolidayFormValues) => {
    if (isEditing && holiday) {
      updateHoliday({
        id: holiday.id,
        name: data.name,
        date: data.date,
        description: data.description,
        is_recurring: data.is_recurring,
      }, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      addHoliday({
        name: data.name,
        date: data.date,
        description: data.description,
        is_recurring: data.is_recurring,
      }, {
        onSuccess: () => onSuccess?.(),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holiday Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Diwali, Christmas, Company Anniversary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
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
                    disabled={(date) => date.getDay() === 0} // Disable Sundays
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Sundays are automatically holidays and cannot be selected.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the holiday..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Annual Recurring</FormLabel>
                <FormDescription>
                  This holiday repeats every year on the same date.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Holiday' : 'Add Holiday'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
