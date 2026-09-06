export const theme = {
  colors: {
    ink: '#07111F',
    blue: '#2563EB',
    blueSoft: '#EFF6FF',
    green: '#16A34A',
    red: '#DC2626',
    white: '#FFFFFF',
    surface: '#F7F9FC',
    border: '#E5EAF0',
    muted: '#64748B',
  },
  radius: { sm: 10, md: 14, lg: 20, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 },
} as const;

export type Theme = typeof theme;
