import { Platform } from 'react-native';

export const Colors = {
  /**
   * Light theme — matches the web design system: Apple-style neutrals with JBIT
   * navy (#0B3B60, from the institutional logo) as the single accent. Every
   * text colour here meets WCAG AA (4.5:1) on white.
   */
  light: {
    primary: '#082C49',
    primaryContainer: '#0B3B60',
    primaryLight: '#EDF3F9',
    secondary: '#B3261E',
    secondaryContainer: '#FDE7E5',
    accent: '#0B6AA8',
    success: '#1F7A45',
    successBg: '#E8F5EC',
    warning: '#9A5B05',
    warningBg: '#FFF4E0',
    danger: '#C62828',
    dangerBg: '#FDECEC',

    // Core structure
    background: '#F2F2F7',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E5E5EA',
    borderSubtle: '#F2F2F7',

    // Typography
    text: '#1C1C1E',
    textSecondary: '#636366',
    textMuted: '#737378',
    textInverse: '#FFFFFF',

    // Tab bar & chrome
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E5EA',
    tabActive: '#0B3B60',
    tabInactive: '#737378',

    backgroundElement: '#F2F2F7',
    backgroundSelected: '#E5E5EA',
  },
  dark: {
    primary: '#38BDF8',
    primaryContainer: '#0B3B60',
    primaryLight: '#082F49',
    secondary: '#F87171',
    secondaryContainer: '#450A0A',
    accent: '#38BDF8',
    success: '#34D399',
    successBg: '#064E3B',
    warning: '#FBBF24',
    warningBg: '#451A03',
    danger: '#F87171',
    dangerBg: '#450A0A',
    
    background: '#0F172A',
    card: '#1E293B',
    surface: '#1E293B',
    border: '#334155',
    borderSubtle: '#1E293B',
    
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',
    
    tabBar: '#1E293B',
    tabBarBorder: '#334155',
    tabActive: '#38BDF8',
    tabInactive: '#64748B',
    
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    heading: 'System',
    mono: 'Courier',
  },
  android: {
    sans: 'Roboto',
    heading: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    heading: 'System',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-sans, Inter, sans-serif)',
    heading: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
    mono: 'monospace',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

/** Apple HIG minimum hit target (also exceeds Material's 48dp at default density). */
export const MinTouchTarget = 44;

/**
 * Type scale (pt). 12 is the smallest size used anywhere; body copy is 15.
 * `allowFontScaling` stays on (the RN default) so Dynamic Type / font size is honoured.
 */
export const Type = {
  largeTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  callout: { fontSize: 14, lineHeight: 19, fontWeight: '500' as const },
  subhead: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
