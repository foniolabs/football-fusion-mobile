import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'username' | 'avatar_url' | 'favorite_team'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function fetchUserStats(userId: string) {
  // Fetch team info
  const { data: team } = await supabase
    .from('teams')
    .select('total_points, overall_rank')
    .eq('user_id', userId)
    .single();

  // Fetch tournament count
  const { count: tournamentsEntered } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Fetch wins
  const { count: tournamentsWon } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('current_rank', 1);

  return {
    totalPoints: team?.total_points ?? 0,
    overallRank: team?.overall_rank ?? null,
    tournamentsEntered: tournamentsEntered ?? 0,
    tournamentsWon: tournamentsWon ?? 0,
  };
}
