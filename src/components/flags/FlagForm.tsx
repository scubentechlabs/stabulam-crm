import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/useUsers';
import { useFlags, CreateFlagData } from '@/hooks/useFlags';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';

const flagFormSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
});

type FlagFormValues = z.infer<typeof flagFormSchema>;

interface FlagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployeeId?: string;
}

export function FlagForm({ open, onOpenChange, preselectedEmployeeId }: FlagFormProps) {
  const { users, isLoading: usersLoading } = useUsers();
  const { createFlag, isCreating } = useFlags();

  const activeEmployees = users.filter((u) => u.is_active);

  const form = useForm<FlagFormValues>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: {
      employee_id: preselectedEmployeeId || '',
      title: '',
      description: '',
    },
  });

  const onSubmit = (values: FlagFormValues) => {
    createFlag(values as CreateFlagData, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  const selectedEmployee = activeEmployees.find(
    (e) => e.user_id === form.watch('employee_id')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10">
              <Flag className="h-4 w-4 text-destructive" />
            </div>
            Issue New Flag
          </DialogTitle>
          <DialogDescription>
            Create a permanent flag record for an employee. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 pr-4" scrollbarClassName="w-2" thumbClassName="bg-muted-foreground/30">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Employee</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!!preselectedEmployeeId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usersLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            activeEmployees.map((employee) => (
                              <SelectItem key={employee.user_id} value={employee.user_id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={employee.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {employee.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{employee.full_name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedEmployee && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedEmployee.avatar_url || ''} />
                        <AvatarFallback>
                          {selectedEmployee.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedEmployee.full_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flag Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Late arrival without notice"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed explanation of the incident, violation, or notice..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    This flag will be permanently attached to the employee's profile and cannot be deleted or edited.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Flag
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
