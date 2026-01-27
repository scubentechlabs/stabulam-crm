import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

export function useUsers() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      setIsLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        role: roleMap.get(profile.user_id) || 'employee',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: CreateUserData) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      // Create auth user via edge function would be ideal, but for now we'll create via signup
      // Note: In production, this should use a server-side function
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          mobile: data.mobile || null,
          department: data.department || null,
          monthly_salary: data.monthly_salary || 0,
          work_start_time: data.work_start_time || '09:00:00',
          work_end_time: data.work_end_time || '18:00:00',
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Update role if different from default
      if (data.role && data.role !== 'employee') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Role update error:', roleError);
        }
      }

      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });

      await fetchUsers();
      return { error: null, user: authData.user };
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create employee',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateUser = async (userId: string, data: UpdateUserData) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          mobile: data.mobile,
          department: data.department,
          monthly_salary: data.monthly_salary,
          work_start_time: data.work_start_time,
          work_end_time: data.work_end_time,
          is_active: data.is_active,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });

      await fetchUsers();
      return { error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateUserRole = async (userId: string, role: AppRole) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      await fetchUsers();
      return { error: null };
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    return updateUser(userId, { is_active: isActive });
  };

  const activeUsers = users.filter(u => u.is_active !== false);
  const inactiveUsers = users.filter(u => u.is_active === false);
  const adminUsers = users.filter(u => u.role === 'admin');
  const employeeUsers = users.filter(u => u.role === 'employee');

  return {
    users,
    activeUsers,
    inactiveUsers,
    adminUsers,
    employeeUsers,
    isLoading,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserActive,
    refreshUsers: fetchUsers,
  };
}
