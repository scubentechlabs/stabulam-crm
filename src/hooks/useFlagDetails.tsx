import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlagReply {
  id: string;
  flag_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface FlagDetails {
  id: string;
  employee_id: string;
  issued_by: string;
  title: string;
  description: string;
  status: 'open' | 'acknowledged';
  created_at: string;
  updated_at: string;
  employee_profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  issuer_profile?: {
    full_name: string;
  };
  replies: FlagReply[];
}

export function useFlagDetails(flagId: string | null) {
  return useQuery({
    queryKey: ['flag-details', flagId],
    queryFn: async (): Promise<FlagDetails | null> => {
      if (!flagId) return null;

      console.log('useFlagDetails: Starting fetch for flag', flagId);

      // Fetch flag
      const { data: flag, error: flagError } = await supabase
        .from('flags')
        .select('*')
        .eq('id', flagId)
        .single();

      if (flagError) {
        console.error('useFlagDetails: Error fetching flag:', flagError);
        throw flagError;
      }

      console.log('useFlagDetails: Flag fetched:', flag);

      // Fetch profiles
      const { data: employeeProfile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', flag.employee_id)
        .single();

      const { data: issuerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', flag.issued_by)
        .single();

      // Fetch replies
      const { data: replies, error: repliesError } = await supabase
        .from('flag_replies')
        .select('*')
        .eq('flag_id', flagId)
        .order('created_at', { ascending: true });

      console.log('useFlagDetails: Replies fetched:', replies, 'Error:', repliesError);

      if (repliesError) {
        console.error('useFlagDetails: Error fetching replies:', repliesError);
        throw repliesError;
      }

      // Fetch reply user profiles
      const repliesWithProfiles: FlagReply[] = [];
      for (const reply of (replies || [])) {
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', reply.user_id)
            .single();

          repliesWithProfiles.push({
            ...reply,
            user_profile: userProfile || { full_name: 'Unknown User', avatar_url: null },
          });
        } catch (err) {
          console.error('useFlagDetails: Error fetching profile for reply:', reply.id, err);
          repliesWithProfiles.push({
            ...reply,
            user_profile: { full_name: 'Unknown User', avatar_url: null },
          });
        }
      }

      console.log('useFlagDetails: Final replies with profiles:', repliesWithProfiles);

      return {
        ...flag,
        employee_profile: employeeProfile,
        issuer_profile: issuerProfile,
        replies: repliesWithProfiles,
      };
    },
    enabled: !!flagId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}
