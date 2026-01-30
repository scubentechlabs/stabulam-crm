import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { UserWithRole } from '@/hooks/useUsers';

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobile: z.string()
    .regex(/^(\+?\d{1,4}[\s-]?)?\d{10}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  department: z.string().optional(),
  monthly_salary: z.coerce.number().min(0, 'Salary must be positive'),
  work_start_time: z.string(),
  work_end_time: z.string(),
  is_active: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserFormProps {
  user: UserWithRole;
  onSubmit: (data: EditUserFormValues) => Promise<{ error: unknown }>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function EditUserForm({ user, onSubmit, onCancel, isSubmitting }: EditUserFormProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: user.full_name,
      mobile: user.mobile || '',
      department: user.department || '',
      monthly_salary: user.monthly_salary || 0,
      work_start_time: user.work_start_time?.slice(0, 5) || '09:00',
      work_end_time: user.work_end_time?.slice(0, 5) || '18:00',
      is_active: user.is_active !== false,
    },
  });

  const handleSubmit = async (values: EditUserFormValues) => {
    const result = await onSubmit({
      ...values,
      work_start_time: `${values.work_start_time}:00`,
      work_end_time: `${values.work_end_time}:00`,
    });
    if (!result.error) {
      onCancel();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Full Name */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email (readonly) */}
        <FormItem>
          <FormLabel>Email</FormLabel>
          <Input value={user.email} disabled className="bg-muted" />
          <FormDescription>Email cannot be changed</FormDescription>
        </FormItem>

        <div className="grid grid-cols-2 gap-4">
          {/* Mobile */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+91 9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Marketing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Monthly Salary */}
        <FormField
          control={form.control}
          name="monthly_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Salary (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50000" {...field} />
              </FormControl>
              <FormDescription>
                Used for salary calculations and deductions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Work Start Time */}
          <FormField
            control={form.control}
            name="work_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>Late arrivals calculated from this</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Work End Time */}
          <FormField
            control={form.control}
            name="work_end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Active Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive employees cannot log in or access the system
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
