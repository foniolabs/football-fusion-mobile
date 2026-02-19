import { useQuery } from '@tanstack/react-query';

export interface FPLPlayerData {
  id: string;
  name: string;
  webName: string;
  team: string;
  teamShort: string;
  teamColor: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number;
  points: number;
  form: number;
  goals: number;
  assists: number;
  photo: string;
}

// Team colors for Premier League teams
const TEAM_COLORS: Record<string, string> = {
  ARS: '#EF0107', AVL: '#670E36', BOU: '#DA291C', BRE: '#FFD700',
  BHA: '#0057B8', CHE: '#034694', CRY: '#1B458F', EVE: '#003399',
  FUL: '#000000', IPS: '#0000FF', LEI: '#003090', LIV: '#C8102E',
  MCI: '#6CABDD', MUN: '#DA291C', NEW: '#241F20', NFO: '#DD0000',
  SOU: '#D71920', TOT: '#132257', WHU: '#7A263A', WOL: '#FDB913',
};

const POSITION_MAP: Record<number, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD',
};

async function fetchFPLPlayers(): Promise<FPLPlayerData[]> {
  // On native, we can call the FPL API directly (no CORS)
  const response = await fetch(
    'https://fantasy.premierleague.com/api/bootstrap-static/',
    { headers: { 'User-Agent': 'FootballFusion/1.0' } }
  );

  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.elements || !data.teams) {
    throw new Error('Invalid FPL data format');
  }

  // Build team lookup
  const teamLookup: Record<number, { name: string; shortName: string }> = {};
  data.teams.forEach((team: any) => {
    teamLookup[team.id] = {
      name: team.name,
      shortName: team.short_name,
    };
  });

  // Transform players
  const players: FPLPlayerData[] = data.elements.map((p: any) => {
    const team = teamLookup[p.team] || { name: 'Unknown', shortName: 'UNK' };
    const position = POSITION_MAP[p.element_type] || 'MID';

    return {
      id: `fpl-${p.id}`,
      name: `${p.first_name} ${p.second_name}`,
      webName: p.web_name,
      team: team.name,
      teamShort: team.shortName,
      teamColor: TEAM_COLORS[team.shortName] || '#666666',
      position,
      price: p.now_cost / 10,
      points: p.total_points,
      form: parseFloat(p.form) || 0,
      goals: p.goals_scored,
      assists: p.assists,
      photo: `https://resources.premierleague.com/premierleague/photos/players/250x250/p${p.code}.png`,
    };
  });

  // Sort by total points descending
  players.sort((a, b) => b.points - a.points);

  return players;
}

export function useFPLPlayers() {
  return useQuery({
    queryKey: ['fpl-players'],
    queryFn: fetchFPLPlayers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
