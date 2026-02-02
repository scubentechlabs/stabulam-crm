import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  is_recurring: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HolidayFormData {
  name: string;
  date: Date;
  description?: string;
  is_recurring?: boolean;
}

export function useHolidays() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all holidays
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });

  // Add holiday
  const addHolidayMutation = useMutation({
    mutationFn: async (formData: HolidayFormData) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          name: formData.name,
          date: format(formData.date, 'yyyy-MM-dd'),
          description: formData.description || null,
          is_recurring: formData.is_recurring || false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({
        title: 'Holiday Added',
        description: 'The holiday has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add holiday.',
        variant: 'destructive',
      });
    },
  });

  // Update holiday
  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, ...formData }: HolidayFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('holidays')
        .update({
          name: formData.name,
          date: format(formData.date, 'yyyy-MM-dd'),
          description: formData.description || null,
          is_recurring: formData.is_recurring || false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({
        title: 'Holiday Updated',
        description: 'The holiday has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update holiday.',
        variant: 'destructive',
      });
    },
  });

  // Delete holiday
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({
        title: 'Holiday Deleted',
        description: 'The holiday has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete holiday.',
        variant: 'destructive',
      });
    },
  });

  // Check if a specific date is a custom holiday
  const isCustomHoliday = (date: Date): Holiday | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const monthDay = format(date, 'MM-dd');
    
    return holidays.find(holiday => {
      if (holiday.is_recurring) {
        // For recurring holidays, match month and day
        return holiday.date.slice(5) === monthDay;
      }
      return holiday.date === dateStr;
    });
  };

  // Check if a date is any kind of holiday (Sunday or custom)
  const isHoliday = (date: Date): { isHoliday: boolean; reason?: string } => {
    // Check Sunday first
    if (date.getDay() === 0) {
      return { isHoliday: true, reason: 'Sunday' };
    }
    
    // Check custom holidays
    const customHoliday = isCustomHoliday(date);
    if (customHoliday) {
      return { isHoliday: true, reason: customHoliday.name };
    }
    
    return { isHoliday: false };
  };

  // Get holidays for a specific month/year (for calendar display)
  const getHolidaysForMonth = (year: number, month: number): Holiday[] => {
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holiday.is_recurring) {
        return holidayDate.getMonth() === month;
      }
      return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
    });
  };

  return {
    holidays,
    isLoading,
    addHoliday: addHolidayMutation.mutate,
    updateHoliday: updateHolidayMutation.mutate,
    deleteHoliday: deleteHolidayMutation.mutate,
    isAdding: addHolidayMutation.isPending,
    isUpdating: updateHolidayMutation.isPending,
    isDeleting: deleteHolidayMutation.isPending,
    isCustomHoliday,
    isHoliday,
    getHolidaysForMonth,
  };
}
