import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#002541',
    primaryContainer: '#0B3B60',
    primaryLight: '#E8F1F8',
    secondary: '#BB0112',
    secondaryContainer: '#FEE2E2',
    accent: '#0284C7',
    success: '#10B981',
    successBg: '#ECFDF5',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    danger: '#EF4444',
    dangerBg: '#FEF2F2',
    
    // Core structure
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    
    // Typography
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Tab bar & chrome
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabActive: '#0B3B60',
    tabInactive: '#94A3B8',
    
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
