import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];

export async function fetchTournaments(filters?: {
  status?: string;
  league_id?: number;
  limit?: number;
}) {
  let query = supabase.from('tournaments').select('*').order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.league_id) {
    query = query.eq('league_id', filters.league_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Tournament[];
}

export async function fetchTournament(id: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Tournament;
}

export async function createTournament(
  tournament: Omit<TournamentInsert, 'created_by'> & {
    wallet_address: string;
    contract_address?: string | null;
    on_chain_id?: number | null;
  }
) {
  const { wallet_address, contract_address, on_chain_id, ...rest } = tournament;

  // Ensure profile exists (creates auth user + profile if needed)
  const { data: profileId, error: rpcError } = await supabase.rpc('ensure_wallet_profile', {
    wallet_addr: wallet_address,
  });

  if (rpcError || !profileId) {
    throw new Error(rpcError?.message || 'Failed to create profile. Please try again.');
  }

  const insertData: Record<string, any> = { ...rest, created_by: profileId };
  if (contract_address) insertData.contract_address = contract_address;
  if (on_chain_id) insertData.on_chain_id = on_chain_id;

  const { data, error } = await supabase
    .from('tournaments')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as Tournament;
}

export async function joinTournament(tournamentId: string, userId: string, teamId: string) {
  // Insert participant
  const { error: participantError } = await supabase.from('tournament_participants').insert({
    tournament_id: tournamentId,
    user_id: userId,
    team_id: teamId,
    entry_paid: true,
  });

  if (participantError) throw participantError;

  // Increment participant count
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('current_participants')
    .eq('id', tournamentId)
    .single();

  await supabase
    .from('tournaments')
    .update({ current_participants: (tournament?.current_participants ?? 0) + 1 })
    .eq('id', tournamentId);

  // Update rankings (non-critical)
  const { error: updateError } = await supabase.rpc('update_tournament_rankings', {
    tournament_id: tournamentId,
  });
  if (updateError) console.warn('Failed to update rankings:', updateError);
}

export async function fetchTournamentParticipants(tournamentId: string) {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select('*, profiles(username, avatar_url)')
    .eq('tournament_id', tournamentId)
    .order('total_points', { ascending: false });

  if (error) throw error;
  return data;
}
