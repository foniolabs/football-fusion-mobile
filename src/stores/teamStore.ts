import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  team: string;
  teamColor: string;
  position: Position;
  price: number;
  points: number;
  photo?: string;
  form?: number;
  goals?: number;
  assists?: number;
  rating?: string;
}

export interface TeamPlayer extends Player {
  isCaptain: boolean;
  isViceCaptain: boolean;
  isBenched: boolean;
  benchOrder?: number;
}

export interface TeamState {
  teamId: string | null;
  teamName: string;
  formation: string;

  goalkeeper: TeamPlayer | null;
  defenders: TeamPlayer[];
  midfielders: TeamPlayer[];
  forwards: TeamPlayer[];
  bench: TeamPlayer[];

  budget: number;
  totalValue: number;
  freeTransfers: number;
  totalPoints: number;
  gameweekPoints: number;

  chipsAvailable: {
    benchBoost: boolean;
    tripleCaptain: boolean;
    freeHit: boolean;
    wildcard: boolean;
  };
  activeChip: string | null;

  setTeamId: (id: string) => void;
  setTeamName: (name: string) => void;
  setFormation: (formation: string) => void;
  addPlayer: (player: Player, position: Position, isBench?: boolean) => boolean;
  removePlayer: (playerId: string) => void;
  setCaptain: (playerId: string) => void;
  setViceCaptain: (playerId: string) => void;
  activateChip: (chip: string) => void;
  deactivateChip: () => void;
  resetTeam: () => void;
  loadTeam: (team: Partial<TeamState>) => void;
  getPlayersCount: () => number;
  getRemainingBudget: () => number;
  isTeamComplete: () => boolean;
  isTeamValid: () => { valid: boolean; errors: string[] };
}

const INITIAL_BUDGET = 100;

const FORMATION_REQUIREMENTS: Record<string, { def: number; mid: number; fwd: number }> = {
  '3-4-3': { def: 3, mid: 4, fwd: 3 },
  '3-5-2': { def: 3, mid: 5, fwd: 2 },
  '4-3-3': { def: 4, mid: 3, fwd: 3 },
  '4-4-2': { def: 4, mid: 4, fwd: 2 },
  '4-5-1': { def: 4, mid: 5, fwd: 1 },
  '5-3-2': { def: 5, mid: 3, fwd: 2 },
  '5-4-1': { def: 5, mid: 4, fwd: 1 },
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teamId: null,
      teamName: 'My Team',
      formation: '4-3-3',

      goalkeeper: null,
      defenders: [],
      midfielders: [],
      forwards: [],
      bench: [],

      budget: INITIAL_BUDGET,
      totalValue: 0,
      freeTransfers: 1,
      totalPoints: 0,
      gameweekPoints: 0,

      chipsAvailable: {
        benchBoost: true,
        tripleCaptain: true,
        freeHit: true,
        wildcard: true,
      },
      activeChip: null,

      setTeamId: (id) => set({ teamId: id }),
      setTeamName: (name) => set({ teamName: name }),
      setFormation: (formation) => set({ formation }),

      addPlayer: (player, position, isBench = false) => {
        const state = get();
        const teamPlayer: TeamPlayer = {
          ...player,
          isCaptain: false,
          isViceCaptain: false,
          isBenched: isBench,
        };

        const remainingBudget = state.getRemainingBudget();
        if (player.price > remainingBudget) return false;

        const allPlayers = [
          state.goalkeeper,
          ...state.defenders,
          ...state.midfielders,
          ...state.forwards,
          ...state.bench,
        ].filter(Boolean);

        if (allPlayers.some((p) => p?.id === player.id)) return false;

        const sameClubPlayers = allPlayers.filter((p) => p?.team === player.team);
        if (sameClubPlayers.length >= 3) return false;

        if (isBench) {
          if (state.bench.length >= 4) return false;
          teamPlayer.benchOrder = state.bench.length + 1;
          set({ bench: [...state.bench, teamPlayer] });
        } else {
          switch (position) {
            case 'GK':
              if (state.goalkeeper) return false;
              set({ goalkeeper: teamPlayer });
              break;
            case 'DEF':
              if (state.defenders.length >= 5) return false;
              set({ defenders: [...state.defenders, teamPlayer] });
              break;
            case 'MID':
              if (state.midfielders.length >= 5) return false;
              set({ midfielders: [...state.midfielders, teamPlayer] });
              break;
            case 'FWD':
              if (state.forwards.length >= 3) return false;
              set({ forwards: [...state.forwards, teamPlayer] });
              break;
          }
        }

        set({ totalValue: state.totalValue + player.price });
        return true;
      },

      removePlayer: (playerId) => {
        const state = get();
        let removedPlayer: TeamPlayer | null = null;

        if (state.goalkeeper?.id === playerId) {
          removedPlayer = state.goalkeeper;
          set({ goalkeeper: null });
        }

        const defIndex = state.defenders.findIndex((p) => p.id === playerId);
        if (defIndex !== -1) {
          removedPlayer = state.defenders[defIndex];
          set({ defenders: state.defenders.filter((p) => p.id !== playerId) });
        }

        const midIndex = state.midfielders.findIndex((p) => p.id === playerId);
        if (midIndex !== -1) {
          removedPlayer = state.midfielders[midIndex];
          set({ midfielders: state.midfielders.filter((p) => p.id !== playerId) });
        }

        const fwdIndex = state.forwards.findIndex((p) => p.id === playerId);
        if (fwdIndex !== -1) {
          removedPlayer = state.forwards[fwdIndex];
          set({ forwards: state.forwards.filter((p) => p.id !== playerId) });
        }

        const benchIndex = state.bench.findIndex((p) => p.id === playerId);
        if (benchIndex !== -1) {
          removedPlayer = state.bench[benchIndex];
          set({ bench: state.bench.filter((p) => p.id !== playerId) });
        }

        if (removedPlayer) {
          set({ totalValue: state.totalValue - removedPlayer.price });
        }
      },

      setCaptain: (playerId) => {
        const state = get();
        const update = (players: TeamPlayer[]): TeamPlayer[] =>
          players.map((p) => ({
            ...p,
            isCaptain: p.id === playerId,
            isViceCaptain: p.id === playerId ? false : p.isViceCaptain,
          }));

        set({
          goalkeeper: state.goalkeeper
            ? {
                ...state.goalkeeper,
                isCaptain: state.goalkeeper.id === playerId,
                isViceCaptain:
                  state.goalkeeper.id === playerId ? false : state.goalkeeper.isViceCaptain,
              }
            : null,
          defenders: update(state.defenders),
          midfielders: update(state.midfielders),
          forwards: update(state.forwards),
        });
      },

      setViceCaptain: (playerId) => {
        const state = get();
        const update = (players: TeamPlayer[]): TeamPlayer[] =>
          players.map((p) => ({
            ...p,
            isViceCaptain: p.id === playerId,
            isCaptain: p.id === playerId ? false : p.isCaptain,
          }));

        set({
          goalkeeper: state.goalkeeper
            ? {
                ...state.goalkeeper,
                isViceCaptain: state.goalkeeper.id === playerId,
                isCaptain:
                  state.goalkeeper.id === playerId ? false : state.goalkeeper.isCaptain,
              }
            : null,
          defenders: update(state.defenders),
          midfielders: update(state.midfielders),
          forwards: update(state.forwards),
        });
      },

      activateChip: (chip) => {
        const state = get();
        if (state.chipsAvailable[chip as keyof typeof state.chipsAvailable]) {
          set({ activeChip: chip });
        }
      },

      deactivateChip: () => set({ activeChip: null }),

      resetTeam: () =>
        set({
          teamId: null,
          teamName: 'My Team',
          formation: '4-3-3',
          goalkeeper: null,
          defenders: [],
          midfielders: [],
          forwards: [],
          bench: [],
          budget: INITIAL_BUDGET,
          totalValue: 0,
          totalPoints: 0,
          gameweekPoints: 0,
          activeChip: null,
        }),

      loadTeam: (team) => set({ ...team }),

      getPlayersCount: () => {
        const state = get();
        return [
          state.goalkeeper ? 1 : 0,
          state.defenders.length,
          state.midfielders.length,
          state.forwards.length,
          state.bench.length,
        ].reduce((a, b) => a + b, 0);
      },

      getRemainingBudget: () => {
        const state = get();
        return INITIAL_BUDGET - state.totalValue;
      },

      isTeamComplete: () => get().getPlayersCount() === 15,

      isTeamValid: () => {
        const state = get();
        const errors: string[] = [];

        if (state.getPlayersCount() !== 15) {
          errors.push(`Need 15 players, have ${state.getPlayersCount()}`);
        }

        if (!state.goalkeeper) errors.push('Need 1 goalkeeper');
        if (state.bench.length !== 4) {
          errors.push(`Need 4 bench players, have ${state.bench.length}`);
        }

        const req = FORMATION_REQUIREMENTS[state.formation];
        if (req) {
          if (state.defenders.length !== req.def)
            errors.push(`Formation requires ${req.def} defenders`);
          if (state.midfielders.length !== req.mid)
            errors.push(`Formation requires ${req.mid} midfielders`);
          if (state.forwards.length !== req.fwd)
            errors.push(`Formation requires ${req.fwd} forwards`);
        }

        const allPlayers = [
          state.goalkeeper,
          ...state.defenders,
          ...state.midfielders,
          ...state.forwards,
        ].filter(Boolean);

        if (!allPlayers.some((p) => p?.isCaptain)) errors.push('Select a captain');
        if (state.totalValue > INITIAL_BUDGET) {
          errors.push(`Over budget by £${(state.totalValue - INITIAL_BUDGET).toFixed(1)}m`);
        }

        return { valid: errors.length === 0, errors };
      },
    }),
    {
      name: 'football-fusion-team',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        teamId: state.teamId,
        teamName: state.teamName,
        formation: state.formation,
        goalkeeper: state.goalkeeper,
        defenders: state.defenders,
        midfielders: state.midfielders,
        forwards: state.forwards,
        bench: state.bench,
        totalValue: state.totalValue,
        totalPoints: state.totalPoints,
        chipsAvailable: state.chipsAvailable,
      }),
    }
  )
);
