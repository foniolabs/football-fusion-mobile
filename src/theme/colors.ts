export const colors = {
  primary: {
    DEFAULT: '#2596be',
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#2596be',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  secondary: {
    DEFAULT: '#EC4899',
    500: '#EC4899',
    600: '#DB2777',
  },
  accent: {
    DEFAULT: '#06B6D4',
    500: '#06B6D4',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  league: {
    epl: '#8B5CF6',
    laliga: '#F97316',
    bundesliga: '#EF4444',
    seriea: '#3B82F6',
    ligue1: '#10B981',
    ucl: '#1E40AF',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Shorthand aliases
export const background = colors.slate[900];
export const cardBg = colors.slate[800];
export const borderColor = colors.slate[700];
export const textPrimary = colors.slate[100];
export const textSecondary = colors.slate[400];
export const textMuted = colors.slate[500];
