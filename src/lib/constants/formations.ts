export const FORMATIONS = [
  '3-4-3',
  '3-5-2',
  '4-3-3',
  '4-4-2',
  '4-5-1',
  '5-3-2',
  '5-4-1',
] as const;

export type Formation = (typeof FORMATIONS)[number];

export const FORMATION_REQUIREMENTS: Record<
  Formation,
  { def: number; mid: number; fwd: number }
> = {
  '3-4-3': { def: 3, mid: 4, fwd: 3 },
  '3-5-2': { def: 3, mid: 5, fwd: 2 },
  '4-3-3': { def: 4, mid: 3, fwd: 3 },
  '4-4-2': { def: 4, mid: 4, fwd: 2 },
  '4-5-1': { def: 4, mid: 5, fwd: 1 },
  '5-3-2': { def: 5, mid: 3, fwd: 2 },
  '5-4-1': { def: 5, mid: 4, fwd: 1 },
};

export const INITIAL_BUDGET = 100;
export const MAX_SQUAD_SIZE = 15;
export const MAX_PLAYERS_PER_CLUB = 3;
