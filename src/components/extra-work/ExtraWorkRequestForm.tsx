import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { EXTRA_WORK_TIERS } from '@/hooks/useExtraWork';

const extraWorkFormSchema = z.object({
  hours: z.enum(['1', '2', '3', '4'] as const, {
    required_error: 'Please select the hours worked',
  }),
  task_description: z.string()
    .min(20, 'Please provide a detailed description (at least 20 characters)')
    .max(1000, 'Description must be less than 1000 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type ExtraWorkFormValues = z.infer<typeof extraWorkFormSchema>;

interface ExtraWorkRequestFormProps {
  onSubmit: (data: {
    hours: 1 | 2 | 3 | 4;
    task_description: string;
    notes?: string;
  }) => Promise<{ error: unknown }>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ExtraWorkRequestForm({ onSubmit, onCancel, isSubmitting }: ExtraWorkRequestFormProps) {
  const form = useForm<ExtraWorkFormValues>({
    resolver: zodResolver(extraWorkFormSchema),
    defaultValues: {
      hours: '1',
      task_description: '',
      notes: '',
    },
  });

  const selectedHours = form.watch('hours');
  const compensation = EXTRA_WORK_TIERS[Number(selectedHours) as keyof typeof EXTRA_WORK_TIERS];

  const handleSubmit = async (values: ExtraWorkFormValues) => {
    const result = await onSubmit({
      hours: Number(values.hours) as 1 | 2 | 3 | 4,
      task_description: values.task_description,
      notes: values.notes,
    });

    if (!result.error) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Hours Selection */}
        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Worked</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  {([1, 2, 3, 4] as const).map((hour) => (
                    <div key={hour}>
                      <RadioGroupItem
                        value={String(hour)}
                        id={`hour-${hour}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`hour-${hour}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{hour} Hour{hour > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span className="font-semibold">{EXTRA_WORK_TIERS[hour]}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Compensation Display */}
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Compensation Amount</span>
            <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
              <IndianRupee className="h-4 w-4" />
              <span>{compensation}</span>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <FormField
          control={form.control}
          name="task_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe in detail what tasks you completed during the extra hours..."
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be specific about what you accomplished
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional context or justification..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
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
