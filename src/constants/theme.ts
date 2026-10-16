export const colors = {
  brand: '#3A0CA3',
  brandDark: '#1A002A',
  brandSoft: '#EEE8FB',
  accent: '#14B8A6',
  accentSoft: '#DDF7F3',
  bg: '#F6F5FA',
  card: '#FFFFFF',
  text: '#14111F',
  muted: '#6B6880',
  border: '#E6E3EF',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  white: '#FFFFFF',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.muted, letterSpacing: 0.4 },
};

/** Área mínima de toque recomendada (44 pt) */
export const HIT = 48;
