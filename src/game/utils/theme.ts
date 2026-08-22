/**
 * Global Color Scheme Themes for Aurora Cyber-Deck
 */

export type AppThemeId =
  | 'CRIMSON_CYBERPUNK'
  | 'NEON_CYAN'
  | 'AMBER_TERMINAL'
  | 'EMERALD_SYNTH'
  | 'VIOLET_PHANTOM'
  | 'SOLARIS_TITANIUM'
  | 'CYBER_SAKURA_PINK';

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  subtitle: string;
  primary: string; // e.g. #ef4444
  primaryHover: string;
  glow: string;
  glowRgba: string;
  accent: string;
  badgeBg: string;
  borderPrimary: string;
  textPrimary: string;
  bgDark: string;
  bgPanel: string;
  radarBeamGradient: string;
}

export const APP_THEMES: Record<AppThemeId, AppThemeConfig> = {
  CRIMSON_CYBERPUNK: {
    id: 'CRIMSON_CYBERPUNK',
    name: 'CRIMSON CYBERPUNK',
    subtitle: 'Obsidian & Tactical Blood Red',
    primary: '#ef4444',
    primaryHover: '#dc2626',
    glow: '#dc2626',
    glowRgba: 'rgba(239, 68, 68, 0.45)',
    accent: '#f59e0b',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    borderPrimary: 'rgba(239, 68, 68, 0.5)',
    textPrimary: '#ef4444',
    bgDark: '#0A0A0A',
    bgPanel: '#0e0e0e',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(220, 38, 38, 0.4) 0deg, transparent 65deg)',
  },
  NEON_CYAN: {
    id: 'NEON_CYAN',
    name: 'NEON MATRIX CYAN',
    subtitle: 'Electric Grid & Pure Cyan Laser',
    primary: '#00f0ff',
    primaryHover: '#00c8d6',
    glow: '#00f0ff',
    glowRgba: 'rgba(0, 240, 255, 0.45)',
    accent: '#3b82f6',
    badgeBg: 'rgba(0, 240, 255, 0.15)',
    borderPrimary: 'rgba(0, 240, 255, 0.5)',
    textPrimary: '#00f0ff',
    bgDark: '#050a12',
    bgPanel: '#08121f',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.4) 0deg, transparent 65deg)',
  },
  AMBER_TERMINAL: {
    id: 'AMBER_TERMINAL',
    name: 'AMBER INDUSTRIAL CRT',
    subtitle: 'Vintage Mainframe & Warm Gold Phosphor',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    glow: '#f59e0b',
    glowRgba: 'rgba(245, 158, 11, 0.45)',
    accent: '#ea580c',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    borderPrimary: 'rgba(245, 158, 11, 0.5)',
    textPrimary: '#f59e0b',
    bgDark: '#0e0a04',
    bgPanel: '#171107',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(245, 158, 11, 0.4) 0deg, transparent 65deg)',
  },
  EMERALD_SYNTH: {
    id: 'EMERALD_SYNTH',
    name: 'EMERALD PHOSPHOR SYNTH',
    subtitle: 'Military Bio-Telemetry & Mint Glow',
    primary: '#10b981',
    primaryHover: '#059669',
    glow: '#10b981',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
    accent: '#84cc16',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    borderPrimary: 'rgba(16, 185, 129, 0.5)',
    textPrimary: '#10b981',
    bgDark: '#040d09',
    bgPanel: '#071710',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.4) 0deg, transparent 65deg)',
  },
  VIOLET_PHANTOM: {
    id: 'VIOLET_PHANTOM',
    name: 'VIOLET PHANTOM SYNTHWAVE',
    subtitle: 'Deep Amethyst & Radiant Magenta',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    glow: '#a855f7',
    glowRgba: 'rgba(168, 85, 247, 0.45)',
    accent: '#ec4899',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    borderPrimary: 'rgba(168, 85, 247, 0.5)',
    textPrimary: '#a855f7',
    bgDark: '#0d0614',
    bgPanel: '#140b1f',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(168, 85, 247, 0.4) 0deg, transparent 65deg)',
  },
  SOLARIS_TITANIUM: {
    id: 'SOLARIS_TITANIUM',
    name: 'SOLARIS TITANIUM MONO',
    subtitle: 'High-Contrast White & Stealth Dark',
    primary: '#f8fafc',
    primaryHover: '#e2e8f0',
    glow: '#ffffff',
    glowRgba: 'rgba(255, 255, 255, 0.45)',
    accent: '#38bdf8',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    borderPrimary: 'rgba(255, 255, 255, 0.5)',
    textPrimary: '#f8fafc',
    bgDark: '#050505',
    bgPanel: '#0c0c0c',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(255, 255, 255, 0.4) 0deg, transparent 65deg)',
  },
  CYBER_SAKURA_PINK: {
    id: 'CYBER_SAKURA_PINK',
    name: 'CYBER SAKURA NEON PINK',
    subtitle: 'Electric Hot Pink & Radiant Magenta Blossom',
    primary: '#ff2a85',
    primaryHover: '#e60067',
    glow: '#ff2a85',
    glowRgba: 'rgba(255, 42, 133, 0.45)',
    accent: '#f472b6',
    badgeBg: 'rgba(255, 42, 133, 0.15)',
    borderPrimary: 'rgba(255, 42, 133, 0.5)',
    textPrimary: '#ff2a85',
    bgDark: '#12040b',
    bgPanel: '#1d0713',
    radarBeamGradient: 'conic-gradient(from 0deg, rgba(255, 42, 133, 0.45) 0deg, transparent 65deg)',
  },
};
