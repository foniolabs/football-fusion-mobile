export const fonts = {
  sans: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
  heading: {
    regular: 'Teko_400Regular',
    medium: 'Teko_500Medium',
    semibold: 'Teko_600SemiBold',
    bold: 'Teko_700Bold',
  },
  serif: {
    regular: 'DMSerifDisplay_400Regular',
  },
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
