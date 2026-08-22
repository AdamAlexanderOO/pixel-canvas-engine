export type HologramThemeId =
  | 'CYBER_CYAN'
  | 'SOLAR_GOLD'
  | 'CRIMSON_NEO'
  | 'EMERALD_QUANTUM'
  | 'AMETHYST_VOID'
  | 'TITANIUM_WHITE';

export interface HologramThemeConfig {
  id: HologramThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  primaryNum: number;
  secondaryColor: string;
  secondaryNum: number;
  accentGlow: string;
  accentGlowNum: number;
  ambientNum: number;
  bgHex: number;
  gridPrimary: number;
  gridSecondary: number;
  pedestalColor: number;
  wireframeColor: number;
  uiBorder: string;
  uiGlow: string;
  uiText: string;
  uiBg: string;
  uiBadge: string;
  uiActiveButton: string;
}

export const HOLOGRAM_THEMES: Record<HologramThemeId, HologramThemeConfig> = {
  CYBER_CYAN: {
    id: 'CYBER_CYAN',
    name: 'Cyber Cyan',
    tagline: 'High-frequency sub-atomic plasma grid',
    primaryColor: '#00f0ff',
    primaryNum: 0x00f0ff,
    secondaryColor: '#0066ff',
    secondaryNum: 0x0066ff,
    accentGlow: '#38bdf8',
    accentGlowNum: 0x38bdf8,
    ambientNum: 0x112238,
    bgHex: 0x040814,
    gridPrimary: 0x00f0ff,
    gridSecondary: 0x0a2238,
    pedestalColor: 0x091424,
    wireframeColor: 0x00f0ff,
    uiBorder: 'border-cyan-500/40',
    uiGlow: 'shadow-[0_0_30px_rgba(0,240,255,0.25)]',
    uiText: 'text-cyan-400',
    uiBg: 'bg-[#060b18]',
    uiBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    uiActiveButton: 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.35)]',
  },
  SOLAR_GOLD: {
    id: 'SOLAR_GOLD',
    name: 'Solar Imperial Gold',
    tagline: 'Ancient Roman tesserae & solar corona alloy',
    primaryColor: '#ffb700',
    primaryNum: 0xffb700,
    secondaryColor: '#ff6a00',
    secondaryNum: 0xff6a00,
    accentGlow: '#fde047',
    accentGlowNum: 0xfde047,
    ambientNum: 0x2e1e08,
    bgHex: 0x0f0b04,
    gridPrimary: 0xffb700,
    gridSecondary: 0x332208,
    pedestalColor: 0x1c1406,
    wireframeColor: 0xffb700,
    uiBorder: 'border-amber-500/40',
    uiGlow: 'shadow-[0_0_30px_rgba(255,183,0,0.25)]',
    uiText: 'text-amber-400',
    uiBg: 'bg-[#120e06]',
    uiBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    uiActiveButton: 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(255,183,0,0.35)]',
  },
  CRIMSON_NEO: {
    id: 'CRIMSON_NEO',
    name: 'Crimson Valkyrie',
    tagline: 'Ruby particle beam & obsidian carbon weave',
    primaryColor: '#ff0055',
    primaryNum: 0xff0055,
    secondaryColor: '#ff2a00',
    secondaryNum: 0xff2a00,
    accentGlow: '#fb7185',
    accentGlowNum: 0xfb7185,
    ambientNum: 0x2e0d16,
    bgHex: 0x100408,
    gridPrimary: 0xff0055,
    gridSecondary: 0x380a15,
    pedestalColor: 0x1c060d,
    wireframeColor: 0xff0055,
    uiBorder: 'border-rose-500/40',
    uiGlow: 'shadow-[0_0_30px_rgba(255,0,85,0.25)]',
    uiText: 'text-rose-400',
    uiBg: 'bg-[#14060b]',
    uiBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    uiActiveButton: 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(255,0,85,0.35)]',
  },
  EMERALD_QUANTUM: {
    id: 'EMERALD_QUANTUM',
    name: 'Emerald Quantum',
    tagline: 'Bio-phosphor superconductor & matrix circuit',
    primaryColor: '#00ff88',
    primaryNum: 0x00ff88,
    secondaryColor: '#00bb55',
    secondaryNum: 0x00bb55,
    accentGlow: '#4ade80',
    accentGlowNum: 0x4ade80,
    ambientNum: 0x0c2918,
    bgHex: 0x04120a,
    gridPrimary: 0x00ff88,
    gridSecondary: 0x0a3318,
    pedestalColor: 0x061c0e,
    wireframeColor: 0x00ff88,
    uiBorder: 'border-emerald-500/40',
    uiGlow: 'shadow-[0_0_30px_rgba(0,255,136,0.25)]',
    uiText: 'text-emerald-400',
    uiBg: 'bg-[#05140b]',
    uiBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    uiActiveButton: 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(0,255,136,0.35)]',
  },
  AMETHYST_VOID: {
    id: 'AMETHYST_VOID',
    name: 'Amethyst Void',
    tagline: 'Deep space cosmic nebula & singularity field',
    primaryColor: '#d946ef',
    primaryNum: 0xd946ef,
    secondaryColor: '#8b5cf6',
    secondaryNum: 0x8b5cf6,
    accentGlow: '#c084fc',
    accentGlowNum: 0xc084fc,
    ambientNum: 0x240d2e,
    bgHex: 0x0c0414,
    gridPrimary: 0xd946ef,
    gridSecondary: 0x2b0e38,
    pedestalColor: 0x170624,
    wireframeColor: 0xd946ef,
    uiBorder: 'border-purple-500/40',
    uiGlow: 'shadow-[0_0_30px_rgba(217,70,239,0.25)]',
    uiText: 'text-purple-400',
    uiBg: 'bg-[#100618]',
    uiBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    uiActiveButton: 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]',
  },
  TITANIUM_WHITE: {
    id: 'TITANIUM_WHITE',
    name: 'Titanium Monolith',
    tagline: 'Polished chrome mirror & diamond laser optics',
    primaryColor: '#e2e8f0',
    primaryNum: 0xe2e8f0,
    secondaryColor: '#94a3b8',
    secondaryNum: 0x94a3b8,
    accentGlow: '#38bdf8',
    accentGlowNum: 0x38bdf8,
    ambientNum: 0x1e293b,
    bgHex: 0x090c12,
    gridPrimary: 0xe2e8f0,
    gridSecondary: 0x1e293b,
    pedestalColor: 0x141a24,
    wireframeColor: 0xe2e8f0,
    uiBorder: 'border-slate-400/40',
    uiGlow: 'shadow-[0_0_30px_rgba(226,232,240,0.2)]',
    uiText: 'text-slate-200',
    uiBg: 'bg-[#0b0e14]',
    uiBadge: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
    uiActiveButton: 'bg-slate-300/20 border-slate-300 text-white shadow-[0_0_12px_rgba(255,255,255,0.25)]',
  },
};
