import { ThemeMode } from '../types';

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    success: string;
    danger: string;
    tabBar: string;
    input: string;
    gradientStart: string;
    gradientEnd: string;
    shadow: string;
  };
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F4F7FB',
    card: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    success: '#16A34A',
    danger: '#DC2626',
    tabBar: '#FFFFFF',
    input: '#EEF2FF',
    gradientStart: '#0EA5E9',
    gradientEnd: '#2563EB',
    shadow: 'rgba(2, 6, 23, 0.08)',
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#020617',
    card: '#0F172A',
    text: '#E2E8F0',
    textMuted: '#94A3B8',
    border: '#1E293B',
    primary: '#38BDF8',
    success: '#22C55E',
    danger: '#FB7185',
    tabBar: '#020617',
    input: '#1E293B',
    gradientStart: '#0EA5E9',
    gradientEnd: '#1D4ED8',
    shadow: 'rgba(148, 163, 184, 0.12)',
  },
};

export const getTheme = (mode: ThemeMode): AppTheme =>
  mode === 'dark' ? darkTheme : lightTheme;
