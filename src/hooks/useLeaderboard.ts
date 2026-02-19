import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTournamentLeaderboard(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament-leaderboard', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_leaderboard')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('total_points', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
    staleTime: 60_000,
  });
}
