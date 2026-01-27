import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];

export interface Shoot {
  id: string;
  event_name: string;
  brand_name: string;
  shoot_date: string;
  shoot_time: string;
  location: string;
  location_coordinates: { lat: number; lng: number } | null;
  brief: string | null;
  notes: string | null;
  status: ShootStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShootWithAssignments extends Shoot {
  assignments: ShootAssignment[];
}

export interface ShootAssignment {
  id: string;
  shoot_id: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface CreateShootData {
  event_name: string;
  brand_name: string;
  shoot_date: string;
  shoot_time: string;
  location: string;
  location_coordinates?: { lat: number; lng: number } | null;
  brief?: string;
  notes?: string;
  assigned_user_ids?: string[];
}

interface UpdateShootData {
  event_name?: string;
  brand_name?: string;
  shoot_date?: string;
  shoot_time?: string;
  location?: string;
  location_coordinates?: { lat: number; lng: number } | null;
  brief?: string;
  notes?: string;
  status?: ShootStatus;
}

export function useShoots() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [shoots, setShoots] = useState<ShootWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShoots = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch all shoots (RLS allows all authenticated users to view)
      const { data: shootsData, error: shootsError } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: true });

      if (shootsError) throw shootsError;

      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('shoot_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      // Fetch profiles for assigned users
      const userIds = [...new Set(assignmentsData?.map(a => a.user_id) || [])];
      let profilesMap: Map<string, { full_name: string; email: string; avatar_url: string | null }> = new Map();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            profilesMap.set(p.user_id, {
              full_name: p.full_name,
              email: p.email,
              avatar_url: p.avatar_url,
            });
          });
        }
      }

      // Combine shoots with their assignments
      const shootsWithAssignments: ShootWithAssignments[] = (shootsData || []).map(shoot => {
        const shootAssignments = (assignmentsData || [])
          .filter(a => a.shoot_id === shoot.id)
          .map(a => ({
            ...a,
            profile: profilesMap.get(a.user_id),
          }));

        return {
          ...shoot,
          status: shoot.status || 'pending',
          location_coordinates: shoot.location_coordinates as { lat: number; lng: number } | null,
          assignments: shootAssignments,
        };
      });

      setShoots(shootsWithAssignments);
    } catch (error) {
      console.error('Error fetching shoots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch shoots',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchShoots();
  }, [fetchShoots]);

  const createShoot = async (data: CreateShootData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: shootData, error: shootError } = await supabase
        .from('shoots')
        .insert({
          event_name: data.event_name,
          brand_name: data.brand_name,
          shoot_date: data.shoot_date,
          shoot_time: data.shoot_time,
          location: data.location,
          location_coordinates: data.location_coordinates || null,
          brief: data.brief || null,
          notes: data.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (shootError) throw shootError;

      // Add assignments if provided
      if (data.assigned_user_ids && data.assigned_user_ids.length > 0) {
        const assignmentInserts = data.assigned_user_ids.map(userId => ({
          shoot_id: shootData.id,
          user_id: userId,
        }));

        const { error: assignmentError } = await supabase
          .from('shoot_assignments')
          .insert(assignmentInserts);

        if (assignmentError) {
          console.error('Error creating assignments:', assignmentError);
        }
      }

      toast({
        title: 'Success',
        description: 'Shoot created successfully',
      });

      await fetchShoots();
      return { error: null, shoot: shootData };
    } catch (error) {
      console.error('Error creating shoot:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shoot',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateShoot = async (shootId: string, data: UpdateShootData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('shoots')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shootId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shoot updated successfully',
      });

      await fetchShoots();
      return { error: null };
    } catch (error) {
      console.error('Error updating shoot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update shoot',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateShootStatus = async (shootId: string, status: ShootStatus) => {
    return updateShoot(shootId, { status });
  };

  const addAssignment = async (shootId: string, userId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('shoot_assignments')
        .insert({ shoot_id: shootId, user_id: userId });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member assigned',
      });

      await fetchShoots();
      return { error: null };
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign team member',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('shoot_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member removed',
      });

      await fetchShoots();
      return { error: null };
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteShoot = async (shootId: string) => {
    if (!user || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('shoots')
        .delete()
        .eq('id', shootId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shoot deleted',
      });

      await fetchShoots();
      return { error: null };
    } catch (error) {
      console.error('Error deleting shoot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shoot',
        variant: 'destructive',
      });
      return { error };
    }
  };

  // Filter shoots for current user
  const myAssignedShoots = shoots.filter(shoot =>
    shoot.assignments.some(a => a.user_id === user?.id)
  );

  // Upcoming shoots (date >= today)
  const today = new Date().toISOString().split('T')[0];
  const upcomingShoots = shoots.filter(shoot => shoot.shoot_date >= today);
  const pastShoots = shoots.filter(shoot => shoot.shoot_date < today);

  // Shoots by status
  const pendingShoots = shoots.filter(s => s.status === 'pending');
  const inProgressShoots = shoots.filter(s => s.status === 'in_progress');
  const completedShoots = shoots.filter(s => s.status === 'completed');

  return {
    shoots,
    myAssignedShoots,
    upcomingShoots,
    pastShoots,
    pendingShoots,
    inProgressShoots,
    completedShoots,
    isLoading,
    createShoot,
    updateShoot,
    updateShootStatus,
    addAssignment,
    removeAssignment,
    deleteShoot,
    refreshShoots: fetchShoots,
  };
}
