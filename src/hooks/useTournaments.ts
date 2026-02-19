import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTournaments,
  fetchTournament,
  createTournament,
  joinTournament,
  fetchTournamentParticipants,
} from '@/lib/api/tournaments';

export function useTournaments(filters?: {
  status?: string;
  league_id?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: () => fetchTournaments(filters),
    staleTime: 60_000,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => fetchTournament(id),
    enabled: !!id,
  });
}

export function useTournamentParticipants(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: () => fetchTournamentParticipants(tournamentId),
    enabled: !!tournamentId,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tournamentId,
      userId,
      teamId,
    }: {
      tournamentId: string;
      userId: string;
      teamId: string;
    }) => joinTournament(tournamentId, userId, teamId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', variables.tournamentId] });
    },
  });
}
