export const colors = {
  primary: '#1a73e8',
  primaryLight: '#e8f0fe',
  success: '#34a853',
  successLight: '#e6f4ea',
  warning: '#f4b400',
  warningLight: '#fef9e7',
  danger: '#ea4335',
  dangerLight: '#fce8e6',
  dark: '#1c1c1e',
  mid: '#555',
  muted: '#999',
  border: '#e0e0e0',
  surface: '#f8f9fa',
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.dark },
  h2: { fontSize: 22, fontWeight: '700', color: colors.dark },
  h3: { fontSize: 18, fontWeight: '700', color: colors.dark },
  body: { fontSize: 15, color: colors.mid },
  caption: { fontSize: 12, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.dark },
};

export const shadows = {
  card: {
    shadowColor: colors.black,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
};

export const STATUS_COLORS = {
  pending: colors.warning,
  confirmed: colors.primary,
  in_progress: colors.success,
  completed: colors.muted,
  cancelled: colors.danger,
};
