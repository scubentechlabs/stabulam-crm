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
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Fetch team members for assignment (works for all authenticated users via shoot_assignments join)
  const fetchTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingTeam(true);
      
      // For admins, use the full profiles list
      if (isAdmin) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, is_active')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error) throw error;
        setTeamMembers(profiles || []);
      } else {
        // For employees, fetch via shoot_assignments which has public SELECT
        // First get unique user_ids from shoot_assignments
        const { data: assignments, error: assignError } = await supabase
          .from('shoot_assignments')
          .select('user_id');

        if (assignError) throw assignError;

        // Get unique user IDs including current user
        const userIds = [...new Set([...(assignments?.map(a => a.user_id) || []), user.id])];
        
        // Employees can only see their own profile, so we'll use what we can get
        // The workaround is to make this data available through a different mechanism
        // For now, just show current user for non-admins
        const { data: ownProfile } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', user.id)
          .single();

        setTeamMembers(ownProfile ? [ownProfile] : []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoadingTeam(false);
    }
  }, [user, isAdmin]);

  const fetchUsers = useCallback(async () => {
    if (!user || !isAdmin) {
      setIsLoading(false);
      return;
    }

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
    fetchTeamMembers();
  }, [fetchUsers, fetchTeamMembers]);

  const createUser = async (data: CreateUserData) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      // Use edge function to create user without affecting current session
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          mobile: data.mobile,
          department: data.department,
          monthly_salary: data.monthly_salary,
          work_start_time: data.work_start_time,
          work_end_time: data.work_end_time,
          role: data.role,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });

      await fetchUsers();
      return { error: null, user: result?.user };
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
    teamMembers,
    isLoading,
    isLoadingTeam,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserActive,
    refreshUsers: fetchUsers,
  };
}
