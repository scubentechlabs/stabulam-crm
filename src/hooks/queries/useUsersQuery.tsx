import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  department: string | null;
  monthly_salary: number | null;
  work_start_time: string | null;
  work_end_time: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends UserProfile {
  role: AppRole;
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  mobile?: string;
  department?: string;
  monthly_salary?: number;
  work_start_time?: string;
  work_end_time?: string;
  role?: AppRole;
}

interface UpdateUserData {
  full_name?: string;
  mobile?: string;
  department?: string;
  monthly_salary?: number;
  work_start_time?: string;
  work_end_time?: string;
  is_active?: boolean;
}

// Fetch all users (admin only)
async function fetchUsers(): Promise<UserWithRole[]> {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.from('user_roles').select('user_id, role'),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]));

  return (profilesRes.data || []).map(profile => ({
    ...profile,
    role: roleMap.get(profile.user_id) || 'employee',
  }));
}

// Fetch team members (for assignment dropdowns)
async function fetchTeamMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, is_active, avatar_url, email')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useUsersQuery() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for all users (admin only)
  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: fetchUsers,
    enabled: !!user && isAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for team members (all authenticated users)
  const teamMembersQuery = useQuery({
    queryKey: queryKeys.teamMembers.list(),
    queryFn: fetchTeamMembers,
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes - team doesn't change often
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: data,
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result?.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers.all });
      toast({ title: 'Success', description: 'Employee created successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee',
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers.all });
      toast({ title: 'Success', description: 'Employee updated successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive',
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast({ title: 'Success', description: 'User role updated successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  const users = usersQuery.data || [];
  const teamMembers = teamMembersQuery.data || [];

  return {
    users,
    activeUsers: users.filter(u => u.is_active !== false),
    inactiveUsers: users.filter(u => u.is_active === false),
    adminUsers: users.filter(u => u.role === 'admin'),
    employeeUsers: users.filter(u => u.role === 'employee'),
    teamMembers,
    isLoading: usersQuery.isLoading,
    isLoadingTeam: teamMembersQuery.isLoading,
    createUser: createUserMutation.mutateAsync,
    updateUser: (userId: string, data: UpdateUserData) => 
      updateUserMutation.mutateAsync({ userId, data }),
    updateUserRole: (userId: string, role: AppRole) => 
      updateRoleMutation.mutateAsync({ userId, role }),
    toggleUserActive: (userId: string, isActive: boolean) => 
      updateUserMutation.mutateAsync({ userId, data: { is_active: isActive } }),
    refreshUsers: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers.all });
    },
  };
}
