/**
 * Theme constants matching the web app's dark theme
 * Based on Tailwind CSS colors and shadcn/ui design system
 */

export const colors = {
  // Primary - Lime/Green accent
  primary: {
    DEFAULT: '#84cc16',
    foreground: '#0a0a0a',
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
  },

  // Background colors
  background: '#0a0a0a',
  foreground: '#fafafa',

  // Card colors
  card: {
    DEFAULT: '#0a0a0a',
    foreground: '#fafafa',
  },

  // Muted colors
  muted: {
    DEFAULT: '#262626',
    foreground: '#a1a1aa',
  },

  // Border colors
  border: '#27272a',

  // Input colors
  input: '#27272a',

  // Destructive (red for delete/error)
  destructive: {
    DEFAULT: '#ef4444',
    foreground: '#fafafa',
  },

  // Secondary
  secondary: {
    DEFAULT: '#27272a',
    foreground: '#fafafa',
  },

  // Accent
  accent: {
    DEFAULT: '#27272a',
    foreground: '#fafafa',
  },

  // Status colors
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',

  // Event type colors (matching web)
  eventTypes: {
    practice: {
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.2)',
    },
    game: {
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22c55e',
      border: 'rgba(34, 197, 94, 0.2)',
    },
    meeting: {
      bg: 'rgba(168, 85, 247, 0.1)',
      text: '#a855f7',
      border: 'rgba(168, 85, 247, 0.2)',
    },
    other: {
      bg: 'rgba(107, 114, 128, 0.1)',
      text: '#6b7280',
      border: 'rgba(107, 114, 128, 0.2)',
    },
  },

  // Rating colors (matching web assessment ratings)
  ratings: {
    1: '#ef4444', // Needs Development - red
    2: '#f97316', // Developing - orange
    3: '#eab308', // Competent - yellow
    4: '#22c55e', // Advanced - green
    5: '#84cc16', // Elite - primary lime
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
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
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
