import { create } from 'zustand';

interface TournamentState {
  activeTournamentId: string | null;
  setActiveTournament: (id: string | null) => void;
}

export const useTournamentStore = create<TournamentState>()((set) => ({
  activeTournamentId: null,
  setActiveTournament: (id) => set({ activeTournamentId: id }),
}));
