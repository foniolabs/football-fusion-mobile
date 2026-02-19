import { supabase } from '@/lib/supabase/client';

export async function fetchUserTeam(userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_players(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function saveTeam(
  userId: string,
  teamData: {
    name: string;
    formation: string;
    total_value: number;
    players: Array<{
      player_id: string;
      position: 'GK' | 'DEF' | 'MID' | 'FWD';
      is_captain: boolean;
      is_vice_captain: boolean;
      is_benched: boolean;
      bench_order: number | null;
      purchase_price: number;
      current_price: number;
    }>;
  }
) {
  // Upsert team — uses teams_user_id_unique constraint for atomic insert-or-update
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .upsert(
      {
        user_id: userId,
        name: teamData.name,
        formation: teamData.formation,
        total_value: teamData.total_value,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  if (teamError) throw teamError;

  // Delete existing players
  await supabase.from('team_players').delete().eq('team_id', team.id);

  // Insert new players
  if (teamData.players.length > 0) {
    const { error: playersError } = await supabase.from('team_players').insert(
      teamData.players.map((p) => ({
        ...p,
        team_id: team.id,
      }))
    );

    if (playersError) throw playersError;
  }

  return team;
}
