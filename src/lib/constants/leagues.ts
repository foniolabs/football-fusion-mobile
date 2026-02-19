export interface League {
  id: number;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  description: string;
  logo: string;
  banner: string;
}

export const MAJOR_LEAGUES: League[] = [
  {
    id: 39,
    name: 'Premier League',
    shortName: 'EPL',
    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: '#8B5CF6',
    description: 'English Premier League',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    banner: 'https://images.unsplash.com/photo-1540552613783-47a1e0120bb5?w=800&q=80',
  },
  {
    id: 140,
    name: 'La Liga',
    shortName: 'La Liga',
    emoji: '🇪🇸',
    color: '#F97316',
    description: 'Spanish La Liga',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    banner: 'https://images.unsplash.com/photo-1614632537423-1e6e480b13bc?w=800&q=80',
  },
  {
    id: 78,
    name: 'Bundesliga',
    shortName: 'BL',
    emoji: '🇩🇪',
    color: '#EF4444',
    description: 'German Bundesliga',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    banner: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&q=80',
  },
  {
    id: 135,
    name: 'Serie A',
    shortName: 'Serie A',
    emoji: '🇮🇹',
    color: '#3B82F6',
    description: 'Italian Serie A',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    banner: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
  },
  {
    id: 61,
    name: 'Ligue 1',
    shortName: 'L1',
    emoji: '🇫🇷',
    color: '#10B981',
    description: 'French Ligue 1',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    banner: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
  },
  {
    id: 2,
    name: 'Champions League',
    shortName: 'UCL',
    emoji: '🏆',
    color: '#1E40AF',
    description: 'UEFA Champions League',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    banner: 'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=800&q=80',
  },
];

export function getLeagueById(id: number): League | undefined {
  return MAJOR_LEAGUES.find((l) => l.id === id);
}

export function getLeagueColor(id: number): string {
  return getLeagueById(id)?.color ?? '#2596be';
}
