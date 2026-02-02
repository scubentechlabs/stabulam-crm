import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ShootStatus = Database['public']['Enums']['shoot_status'];
type EditingStatus = Database['public']['Enums']['editing_status'];

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
  editing_status: EditingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Editor assignment fields
  editor_drive_link: string | null;
  editor_description: string | null;
  assigned_editor_id: string | null;
  editor_deadline: string | null;
}

export interface ShootWithAssignments extends Shoot {
  assignments: ShootAssignment[];
  assigned_editor?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
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
  editing_status?: EditingStatus;
}

export function useShoots() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [shoots, setShoots] = useState<ShootWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchShoots = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      // Only show loading on first fetch, never on background refreshes
      if (showLoading && !hasFetchedOnce) setIsLoading(true);

      // Fetch all shoots (RLS allows all authenticated users to view)
      const { data: shootsData, error: shootsError } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (shootsError) throw shootsError;

      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('shoot_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      // Fetch profiles for assigned users
      const userIds = [...new Set(assignmentsData?.map(a => a.user_id) || [])];
      
      // Also include editor ids for profile lookup
      const editorIds = [...new Set((shootsData || []).filter(s => s.assigned_editor_id).map(s => s.assigned_editor_id!))];
      const allUserIds = [...new Set([...userIds, ...editorIds])];
      
      let profilesMap: Map<string, { full_name: string; email: string; avatar_url: string | null }> = new Map();

      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', allUserIds);

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

      // Combine shoots with their assignments - use Map to prevent duplicates
      const shootsMap = new Map<string, ShootWithAssignments>();
      (shootsData || []).forEach(shoot => {
        const shootAssignments = (assignmentsData || [])
          .filter(a => a.shoot_id === shoot.id)
          .map(a => ({
            ...a,
            profile: profilesMap.get(a.user_id),
          }));

        shootsMap.set(shoot.id, {
          ...shoot,
          status: shoot.status || 'pending',
          editing_status: shoot.editing_status || 'not_started',
          location_coordinates: shoot.location_coordinates as { lat: number; lng: number } | null,
          assignments: shootAssignments,
          assigned_editor: shoot.assigned_editor_id ? profilesMap.get(shoot.assigned_editor_id) || null : null,
        });
      });

      // Merge with previous state to avoid a race where a freshly-created shoot
      // can momentarily fetch with 0 assignments before assignment rows are visible.
      // IMPORTANT: Only preserve assignments for *very new* shoots to avoid breaking
      // legitimate cases where a shoot truly has 0 members (e.g., after removals).
      setShoots(prev => {
        const prevMap = new Map(prev.map(s => [s.id, s]));
        const now = Date.now();

        return Array.from(shootsMap.values()).map((s) => {
          const prevShoot = prevMap.get(s.id);
          if (!prevShoot) return s;

          const createdAtMs = Number.isNaN(Date.parse(s.created_at)) ? 0 : Date.parse(s.created_at);
          const isVeryNew = createdAtMs > 0 && now - createdAtMs < 10_000;

          const shouldPreserveAssignments =
            isVeryNew &&
            (prevShoot.assignments?.length ?? 0) > 0 &&
            (s.assignments?.length ?? 0) === 0;

          const mergedAssignments = shouldPreserveAssignments ? prevShoot.assignments : s.assignments;
          const mergedEditor = s.assigned_editor ?? prevShoot.assigned_editor ?? null;

          return {
            ...prevShoot,
            ...s,
            assignments: mergedAssignments,
            assigned_editor: mergedEditor,
          };
        });
      });
    } catch (error) {
      console.error('Error fetching shoots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch shoots',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setHasFetchedOnce(true);
    }
  }, [user, toast, hasFetchedOnce]);

  // Debounced background refresh to avoid race conditions when multiple related realtime events fire
  // (e.g., creating a shoot triggers shoots insert event + assignments insert event).
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      fetchShoots(false);
    }, 300);
  }, [fetchShoots]);

  useEffect(() => {
    fetchShoots(true);

    // Subscribe to realtime changes for shoots - background refresh without loading state
    const shootsChannel = supabase
      .channel('shoots-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shoots' },
        () => {
          // Background sync - debounce to wait for related updates (e.g., assignments)
          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shoot_assignments' },
        () => {
          // Background sync - debounce to wait for related updates (e.g., shoots)
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(shootsChannel);
    };
  }, [fetchShoots, scheduleRefresh]);

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

      // Add assignments if provided and fetch their profiles for immediate display
      let createdAssignments: ShootAssignment[] = [];
      
      if (data.assigned_user_ids && data.assigned_user_ids.length > 0) {
        const assignmentInserts = data.assigned_user_ids.map(userId => ({
          shoot_id: shootData.id,
          user_id: userId,
        }));

        const { data: insertedAssignments, error: assignmentError } = await supabase
          .from('shoot_assignments')
          .insert(assignmentInserts)
          .select();

        if (assignmentError) {
          console.error('Error creating assignments:', assignmentError);
        } else {
          // Some policies can block RETURNING rows; fallback to fetching by shoot_id.
          let assignmentRows = insertedAssignments;
          if (!assignmentRows || assignmentRows.length === 0) {
            const { data: fetchedAssignments, error: fetchAssignmentsError } = await supabase
              .from('shoot_assignments')
              .select('*')
              .eq('shoot_id', shootData.id);
            if (fetchAssignmentsError) {
              console.error('Error fetching assignments after insert:', fetchAssignmentsError);
            }
            assignmentRows = fetchedAssignments ?? [];
          }

          // Fetch profiles for the assigned users
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', data.assigned_user_ids);

          const profilesMap = new Map<string, { full_name: string; email: string; avatar_url: string | null }>();
          profilesData?.forEach(p => {
            profilesMap.set(p.user_id, {
              full_name: p.full_name,
              email: p.email,
              avatar_url: p.avatar_url,
            });
          });

          createdAssignments = (assignmentRows || []).map(a => ({
            ...a,
            profile: profilesMap.get(a.user_id),
          }));
        }
      }

      console.debug('[useShoots] createShoot assignments', {
        shootId: shootData.id,
        assignedCount: data.assigned_user_ids?.length ?? 0,
        createdAssignmentsCount: createdAssignments.length,
      });

      toast({
        title: 'Success',
        description: 'Shoot created successfully',
      });

      // Optimistically add the shoot with assignments so the UI shows team members immediately.
      const newShoot: ShootWithAssignments = {
        ...shootData,
        status: shootData.status || 'pending',
        editing_status: shootData.editing_status || 'not_started',
        location_coordinates: shootData.location_coordinates as { lat: number; lng: number } | null,
        assignments: createdAssignments,
        assigned_editor: null,
      };

      setShoots(prev => {
        const shootsMap = new Map(prev.map(s => [s.id, s]));
        shootsMap.set(newShoot.id, newShoot);
        return Array.from(shootsMap.values()).sort((a, b) => {
          const dateCompare = a.shoot_date.localeCompare(b.shoot_date);
          if (dateCompare !== 0) return dateCompare;
          return b.created_at.localeCompare(a.created_at);
        });
      });

      // Background refresh (debounced) to reconcile with backend state.
      scheduleRefresh();

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
      // Optimistically update local state first
      setShoots(prev => prev.map(shoot => 
        shoot.id === shootId 
          ? { ...shoot, ...data, updated_at: new Date().toISOString() }
          : shoot
      ));

      const { error } = await supabase
        .from('shoots')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shootId);

      if (error) {
        // Revert on error by refetching (without loading state)
        await fetchShoots(false);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Shoot updated successfully',
      });

      // No need to refetch - realtime subscription will handle sync
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

  const updateEditingStatus = async (shootId: string, editingStatus: EditingStatus) => {
    return updateShoot(shootId, { editing_status: editingStatus });
  };

  const assignToEditor = async (shootId: string, data: {
    editor_drive_link: string;
    editor_description: string;
    assigned_editor_id: string;
    editor_deadline: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Fetch the editor's profile for optimistic update
      let editorProfile: { full_name: string; email: string; avatar_url: string | null } | null = null;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', data.assigned_editor_id)
        .maybeSingle();
      
      if (profileData) {
        editorProfile = {
          full_name: profileData.full_name,
          email: profileData.email,
          avatar_url: profileData.avatar_url,
        };
      }

      const updateData = {
        status: 'given_by_editor' as ShootStatus,
        editor_drive_link: data.editor_drive_link,
        editor_description: data.editor_description,
        assigned_editor_id: data.assigned_editor_id,
        editor_deadline: data.editor_deadline,
        updated_at: new Date().toISOString(),
      };

      // Optimistically update local state with editor profile included
      setShoots(prev => prev.map(shoot => 
        shoot.id === shootId 
          ? { ...shoot, ...updateData, assigned_editor: editorProfile }
          : shoot
      ));

      const { error } = await supabase
        .from('shoots')
        .update(updateData)
        .eq('id', shootId);

      if (error) {
        await fetchShoots(false);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Shoot assigned to editor successfully',
      });

      // No need to refetch - realtime subscription handles sync
      return { error: null };
    } catch (error) {
      console.error('Error assigning to editor:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign to editor',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const addAssignment = async (shootId: string, userId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const tempId = `temp-${shootId}-${userId}-${Date.now()}`;

      // Optimistic UI: show the member immediately (even if realtime is not enabled)
      setShoots(prev => prev.map(shoot => {
        if (shoot.id !== shootId) return shoot;
        if (shoot.assignments.some(a => a.user_id === userId)) return shoot;
        return {
          ...shoot,
          assignments: [
            ...shoot.assignments,
            {
              id: tempId,
              shoot_id: shootId,
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ],
        };
      }));

      // Insert and try to get the real row back
      const { data: inserted, error: insertError } = await supabase
        .from('shoot_assignments')
        .insert({ shoot_id: shootId, user_id: userId })
        .select('*')
        .maybeSingle();

      if (insertError) throw insertError;

      // Some environments/policies may not return INSERT rows; fallback to fetch.
      let assignmentRow = inserted;
      if (!assignmentRow) {
        const { data: fetched, error: fetchErr } = await supabase
          .from('shoot_assignments')
          .select('*')
          .eq('shoot_id', shootId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        assignmentRow = fetched ?? null;
      }

      // Fetch profile for immediate display
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      const resolvedAssignment: ShootAssignment = assignmentRow
        ? {
            ...(assignmentRow as unknown as ShootAssignment),
            profile: profileData
              ? {
                  full_name: profileData.full_name,
                  email: profileData.email,
                  avatar_url: profileData.avatar_url,
                }
              : undefined,
          }
        : {
            id: tempId,
            shoot_id: shootId,
            user_id: userId,
            created_at: new Date().toISOString(),
            profile: profileData
              ? {
                  full_name: profileData.full_name,
                  email: profileData.email,
                  avatar_url: profileData.avatar_url,
                }
              : undefined,
          };

      // Replace optimistic temp row with the real assignment (and attach profile)
      setShoots(prev => prev.map(shoot => {
        if (shoot.id !== shootId) return shoot;
        const next = shoot.assignments
          .filter(a => a.id !== tempId && a.user_id !== userId)
          .concat(resolvedAssignment);

        // Deduplicate by assignment id
        const map = new Map(next.map(a => [a.id, a]));
        return { ...shoot, assignments: Array.from(map.values()) };
      }));

      toast({
        title: 'Success',
        description: 'Team member assigned',
      });

      // Ensure state sync even when realtime isn't available
      scheduleRefresh();
      return { error: null };
    } catch (error) {
      console.error('Error adding assignment:', error);

      // Revert optimistic row on error
      setShoots(prev => prev.map(shoot => {
        if (shoot.id !== shootId) return shoot;
        return { ...shoot, assignments: shoot.assignments.filter(a => a.user_id !== userId) };
      }));

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
      // Optimistic UI: remove immediately
      setShoots(prev => prev.map(shoot => {
        if (!shoot.assignments.some(a => a.id === assignmentId)) return shoot;
        return { ...shoot, assignments: shoot.assignments.filter(a => a.id !== assignmentId) };
      }));

      const { error } = await supabase
        .from('shoot_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member removed',
      });

      // Ensure state sync even when realtime isn't available
      scheduleRefresh();
      return { error: null };
    } catch (error) {
      console.error('Error removing assignment:', error);

      // Re-sync on error (restores UI if needed)
      await fetchShoots(false);

      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteShoot = async (shootId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Check if user can delete: creator, assigned, or admin
    const shoot = shoots.find(s => s.id === shootId);
    if (!shoot) return { error: new Error('Shoot not found') };
    
    const isCreator = shoot.created_by === user.id;
    const isAssigned = shoot.assignments.some(a => a.user_id === user.id);
    const canDelete = isAdmin || isCreator || isAssigned;
    
    if (!canDelete) {
      toast({
        title: 'Not Authorized',
        description: 'You can only delete shoots you created or are assigned to',
        variant: 'destructive',
      });
      return { error: new Error('Not authorized') };
    }

    try {
      // Optimistically remove from state
      setShoots(prev => prev.filter(s => s.id !== shootId));

      const { error } = await supabase
        .from('shoots')
        .delete()
        .eq('id', shootId);

      if (error) {
        await fetchShoots(false);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Shoot deleted',
      });

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
    updateEditingStatus,
    assignToEditor,
    addAssignment,
    removeAssignment,
    deleteShoot,
    refreshShoots: () => fetchShoots(true),
  };
}
