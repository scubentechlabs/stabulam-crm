import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
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
import type { ShootWithAssignments } from '@/hooks/useShoots';

const shootEditSchema = z.object({
  event_name: z.string().min(1, 'Event name is required').max(100),
  brand_name: z.string().min(1, 'Brand name is required').max(100),
  shoot_date: z.date({ required_error: 'Shoot date is required' }),
  shoot_time: z.string().min(1, 'Shoot time is required'),
  location: z.string().min(1, 'Location is required').max(200),
  brief: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});

type ShootEditValues = z.infer<typeof shootEditSchema>;

interface ShootEditFormProps {
  shoot: ShootWithAssignments;
  onSave: (data: {
    event_name: string;
    brand_name: string;
    shoot_date: string;
    shoot_time: string;
    location: string;
    brief?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ShootEditForm({ shoot, onSave, onCancel, isSubmitting }: ShootEditFormProps) {
  const form = useForm<ShootEditValues>({
    resolver: zodResolver(shootEditSchema),
    defaultValues: {
      event_name: shoot.event_name,
      brand_name: shoot.brand_name,
      shoot_date: parseISO(shoot.shoot_date),
      shoot_time: shoot.shoot_time,
      location: shoot.location,
      brief: shoot.brief || '',
      notes: shoot.notes || '',
    },
  });

  const handleSubmit = async (values: ShootEditValues) => {
    await onSave({
      event_name: values.event_name,
      brand_name: values.brand_name,
      shoot_date: format(values.shoot_date, 'yyyy-MM-dd'),
      shoot_time: values.shoot_time,
      location: values.location,
      brief: values.brief || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="event_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product Launch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shoot_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Shoot Date</FormLabel>
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
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shoot_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shoot Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Studio A, Mumbai" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brief"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brief / Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the shoot requirements, mood, style..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Equipment needed, special instructions..."
                  className="min-h-[60px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
