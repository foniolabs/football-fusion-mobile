import { useQuery } from '@tanstack/react-query';

// ---------- Types ----------

export interface GameweekData {
  gameweek: number;
  dateRange: string;
  avgPoints: number;
  highestPoints: number;
  isFinished: boolean;
  isCurrent: boolean;
  deadlineTime: string;
}

export interface StarPlayer {
  id: number;
  name: string;
  team: string;
  teamShort: string;
  position: string;
  positionShort: string;
  points: number;
  photo: string;
}

export interface TransferPlayer {
  rank: number;
  id: number;
  name: string;
  position: string;
  team: string;
  transfers: number;
  photo: string;
}

export interface FPLData {
  gameweek: GameweekData | null;
  starPlayer: StarPlayer | null;
  mostTransferredIn: TransferPlayer[];
  topPlayers: StarPlayer[];
}

// ---------- Constants ----------

const POSITION_SHORT: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const POSITION_LONG: Record<number, string> = { 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' };

// ---------- Fetch ----------

async function fetchFPLData(): Promise<FPLData> {
  const response = await fetch(
    'https://fantasy.premierleague.com/api/bootstrap-static/',
    { headers: { 'User-Agent': 'FootballFusion/1.0' } }
  );

  if (!response.ok) throw new Error(`FPL API error: ${response.status}`);
  const data = await response.json();

  const { elements: players, teams, events: gameweeks } = data;

  // Team lookup
  const teamLookup = new Map(
    teams.map((t: any) => [t.id, { name: t.name, shortName: t.short_name }])
  );

  // Current gameweek
  const currentGW = gameweeks.find((gw: any) => gw.is_current) || gameweeks[gameweeks.length - 1];
  const gwStartDate = new Date(currentGW.deadline_time);
  const gwEndDate = new Date(gwStartDate);
  gwEndDate.setDate(gwEndDate.getDate() + 3);

  const gameweek: GameweekData = {
    gameweek: currentGW.id,
    dateRange: `${gwStartDate.toLocaleDateString('en-GB', { day: 'numeric' })}-${gwEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    avgPoints: currentGW.average_entry_score || 0,
    highestPoints: currentGW.highest_score || 0,
    isFinished: currentGW.finished,
    isCurrent: currentGW.is_current,
    deadlineTime: currentGW.deadline_time,
  };

  // Transform player helper
  const transformPlayer = (player: any): StarPlayer => {
    const team: any = teamLookup.get(player.team) || { name: 'Unknown', shortName: 'UNK' };
    return {
      id: player.id,
      name: player.web_name,
      team: team.name,
      teamShort: team.shortName,
      position: POSITION_LONG[player.element_type] || 'Unknown',
      positionShort: POSITION_SHORT[player.element_type] || 'UNK',
      points: player.total_points,
      photo: `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`,
    };
  };

  // Star player (highest total points)
  const sortedByPoints = [...players].sort((a: any, b: any) => b.total_points - a.total_points);
  const starPlayer = transformPlayer(sortedByPoints[0]);

  // Most transferred in (this gameweek)
  const mostTransferredIn: TransferPlayer[] = [...players]
    .sort((a: any, b: any) => b.transfers_in_event - a.transfers_in_event)
    .slice(0, 5)
    .map((player: any, index: number) => {
      const team: any = teamLookup.get(player.team) || { shortName: 'UNK' };
      return {
        rank: index + 1,
        id: player.id,
        name: player.web_name,
        position: POSITION_SHORT[player.element_type] || 'UNK',
        team: team.shortName,
        transfers: player.transfers_in_event,
        photo: `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`,
      };
    });

  // Top 10 players
  const topPlayers = sortedByPoints.slice(0, 10).map(transformPlayer);

  return { gameweek, starPlayer, mostTransferredIn, topPlayers };
}

// ---------- Hook ----------

export function useFPLData() {
  return useQuery({
    queryKey: ['fpl-data'],
    queryFn: fetchFPLData,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
