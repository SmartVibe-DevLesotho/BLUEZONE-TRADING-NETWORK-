export const theme = {
  colors: {
    ink: '#06111F',
    midnight: '#06111F',
    blue: '#2F6BFF',
    blueSoft: '#EAF0FF',
    green: '#19B66A',
    greenSoft: '#E9F9F1',
    red: '#EF5350',
    redSoft: '#FFF0F0',
    white: '#FFFFFF',
    surface: '#F5F7FB',
    card: '#FFFFFF',
    border: '#E4E9F2',
    muted: '#718096',
    slate: '#344054',
    gold: '#D9A441',
  },
  radius: { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 },
} as const;

export type Theme = typeof theme;
