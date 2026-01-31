import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Users, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useUsers, type UserWithRole } from '@/hooks/useUsers';

const shootFormSchema = z.object({
  event_name: z.string().min(1, 'Event name is required').max(100),
  brand_name: z.string().min(1, 'Brand name is required').max(100),
  shoot_date: z.date({ required_error: 'Shoot date is required' }),
  shoot_time: z.string().min(1, 'Shoot time is required'),
  location: z.string().min(1, 'Location is required').max(200),
  brief: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
  assigned_user_ids: z.array(z.string()).optional(),
});

type ShootFormValues = z.infer<typeof shootFormSchema>;

interface ShootFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    event_name: string;
    brand_name: string;
    shoot_date: string;
    shoot_time: string;
    location: string;
    brief?: string;
    notes?: string;
    assigned_user_ids?: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ShootForm({ open, onOpenChange, onSubmit, isSubmitting }: ShootFormProps) {
  const { teamMembers, isLoadingTeam } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const form = useForm<ShootFormValues>({
    resolver: zodResolver(shootFormSchema),
    defaultValues: {
      event_name: '',
      brand_name: '',
      shoot_time: '10:00',
      location: '',
      brief: '',
      notes: '',
      assigned_user_ids: [],
    },
  });

  const handleSubmit = async (values: ShootFormValues) => {
    await onSubmit({
      event_name: values.event_name,
      brand_name: values.brand_name,
      shoot_date: format(values.shoot_date, 'yyyy-MM-dd'),
      shoot_time: values.shoot_time,
      location: values.location,
      brief: values.brief,
      notes: values.notes,
      assigned_user_ids: selectedUsers,
    });
    form.reset();
    setSelectedUsers([]);
    onOpenChange(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shoot</DialogTitle>
          <DialogDescription>
            Schedule a new photo or video shoot and assign team members.
          </DialogDescription>
        </DialogHeader>

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
                    <Popover modal={true}>
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
                      <PopoverContent 
                        className="w-auto p-0 z-[9999]" 
                        align="start"
                        sideOffset={4}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
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

            {/* Team Assignment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <FormLabel>Assign Team Members</FormLabel>
              </div>
              
              {isLoadingTeam ? (
                <div className="text-sm text-muted-foreground">Loading team...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-3">
                  {teamMembers.map((member) => (
                    <label
                      key={member.user_id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(member.user_id)}
                        onCheckedChange={() => toggleUserSelection(member.user_id)}
                      />
                      <span className="text-sm truncate">{member.full_name}</span>
                    </label>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No team members available
                    </p>
                  )}
                </div>
              )}
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Shoot
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
