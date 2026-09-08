export const theme = {
  colors: {
    ink: '#F5F7F8',
    midnight: '#020817',
    navy: '#06162D',
    blue: '#0877F9',
    blueSoft: '#0B2342',
    cyan: '#16CFFF',
    cyanBright: '#35F2FF',
    green: '#83FF00',
    greenSoft: '#102B1A',
    red: '#FF5B66',
    redSoft: '#35151A',
    white: '#F5F7F8',
    surface: '#020817',
    card: '#06111F',
    border: '#17314A',
    muted: '#9AA7B2',
    slate: '#B7C6D0',
    gold: '#FFC400',
    orange: '#FF5A00',
  },
  radius: { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 },
} as const;

export type Theme = typeof theme;
