// Design tokens extracted directly from the CasualOS customer portal
// (resources/views/portal/dashboard.blade.php, show.blade.php) — this app is
// the native counterpart of that portal and should read as the same product.
// Light mode only. Nothing in the source portal specs a dark variant, so
// don't add one speculatively.

export const Colors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  border: '#E8E8ED',
  divider: '#F2F2F7',
  surfacePressed: '#EFEFF4',
  textPrimary: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#86868B',
  accent: '#0071E3',
  success: '#30D158',
  error: '#FF3B30',
};

// Order status chips — not used until the Ordering slice exists, but kept
// here now so that work doesn't need a second token-file handoff.
export const StatusColors = {
  received: { bg: '#DBEAFE', text: '#1D4ED8' },
  confirmed: { bg: '#FEF9C3', text: '#A16207' },
  stitching: { bg: '#FFEDD5', text: '#C2410C' },
  partially_dispatched: { bg: '#F3E8FF', text: '#7E22CE' },
  dispatched: { bg: '#DCFCE7', text: '#15803D' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  pill: 999, // buttons
  card: 12, // cards, inputs, other bordered surfaces
  chip: 8, // icon containers, small inline chips
};

// System font on both platforms: San Francisco on iOS (free, matches the
// web portal), Roboto on Android. Inter would be the specified Android
// fallback but isn't installed in this project, so no fontFamily override —
// Android already lands on Roboto by default, per the spec's own fallback.
export const Typography = {
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,
};
