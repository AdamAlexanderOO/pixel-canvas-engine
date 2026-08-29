import React, { useMemo, useState, useCallback } from 'react';
import { Binary, Cpu, Sparkles, Boxes } from 'lucide-react';
import {
  compileLight,
  SUNSET_PROFILES,
  type SunsetSize,
} from '../engine/lightHierarchy';
import { TransistorMosaicMatrix } from './TransistorMosaicMatrix';
import { VultRumMeshDeck } from './VultRumMeshDeck';
import type { AppThemeConfig } from '../utils/theme';
import { haptics } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

interface Props {
  theme: AppThemeConfig;
  powerOn: boolean;
  fluxFrequency: number;
  onLog?: (message: string) => void;
}

const SUNSETS: SunsetSize[] = [100, 250, 500, 1000];

export const LightProtocolBlueDeck: React.FC<Props> = ({
  theme,
  powerOn,
  fluxFrequency,
  onLog,
}) => {
  const [source, setSource] = useState('Render a cyber-Roman mosaic node with pulse behaviour');
  const [sunset, setSunset] = useState<SunsetSize>(250);
  const [openTier, setOpenTier] = useState<number | null>(1);

  const compilation = useMemo(
    () => compileLight(source, sunset, 80, 45),
    [source, sunset],
  );

  const handleSiphon = useCallback(
    (label: string) => onLog?.(`VULT-RUM siphon :: ${label} torque released`),
    [onLog],
  );

  return (
    <div className="space-y-4">
      {/* English -> symbolic bridge */}
      <div className="border border-white/10 bg-neutral-950/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: theme.primary }}>
          <Binary className="w-3.5 h-3.5" />
          BRIDGE LAYER // ENGLISH → SYMBOLIC
        </div>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={2}
          className="w-full bg-black/60 border border-white/10 rounded p-2 font-mono text-[11px] text-white outline-none focus:border-white/30 resize-none"
          placeholder="Type a plain-English instruction…"
        />
        <div className="flex flex-wrap gap-1.5">
          {SUNSETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSunset(s);
                sounds.playClick(700);
                haptics.trigger('light');
                onLog?.(`${SUNSET_PROFILES[s].name} expansion engaged`);
              }}
              className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-all"
              style={{
                backgroundColor: sunset === s ? theme.primary : 'rgba(255,255,255,0.04)',
                borderColor: sunset === s ? theme.primary : 'rgba(255,255,255,0.1)',
                color: sunset === s ? '#000' : '#a3a3a3',
              }}
            >
              {SUNSET_PROFILES[s].name}
            </button>
          ))}
        </div>
        <p className="font-mono text-[9px] text-neutral-400">{SUNSET_PROFILES[sunset].role}</p>
      </div>

      {/* Tiers 50 / 30 / 20 */}
      <div className="space-y-1.5">
        {compilation.tiers.map((tier) => {
          const open = openTier === tier.index;
          return (
            <div key={tier.id} className="border border-white/10 bg-neutral-950/80 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setOpenTier(open ? null : tier.index);
                  haptics.trigger('click');
                }}
                className="w-full flex items-center justify-between px-3 py-2 font-mono text-[10px]"
              >
                <span className="font-bold" style={{ color: theme.primary }}>
                  TIER {tier.index} — {tier.name}
                </span>
                <span className="text-neutral-400">{tier.length} CHARS</span>
              </button>
              {open && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="font-mono text-[10px] break-all text-white bg-black/60 border border-white/10 rounded p-2">
                    {tier.code}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tier.defines.map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded font-mono text-[9px] border border-white/10 text-neutral-300"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="font-mono text-[9px] text-neutral-400">
                    {tier.layer} • {tier.purpose}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transistor display field */}
      <div className="border border-white/10 bg-neutral-950/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="flex items-center gap-1.5 tracking-[0.2em]" style={{ color: theme.primary }}>
            <Cpu className="w-3.5 h-3.5" />
            TRANSISTOR DISPLAY FIELD
          </span>
          <span className="text-neutral-400">CRC {compilation.checksum}</span>
        </div>
        <TransistorMosaicMatrix
          compilation={compilation}
          theme={theme}
          powerOn={powerOn}
          fluxFrequency={fluxFrequency}
        />
      </div>

      {/* Super-glyph */}
      <div className="border border-white/10 bg-neutral-950/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: theme.primary }}>
          <Sparkles className="w-3.5 h-3.5" />
          {SUNSET_PROFILES[sunset].name} SUPER-GLYPH
        </div>
        <div className="font-mono text-[9px] leading-relaxed break-all text-neutral-300 bg-black/60 border border-white/10 rounded p-2 max-h-32 overflow-y-auto">
          {compilation.superGlyph}
        </div>
      </div>

      {/* VULT-RUM interactive mesh */}
      <div className="border border-white/10 bg-neutral-950/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: theme.primary }}>
          <Boxes className="w-3.5 h-3.5" />
          VULT-RUM GEN-12 // 64-BIT MICRO-MESH
        </div>
        <VultRumMeshDeck
          theme={theme}
          powerOn={powerOn}
          fluxFrequency={fluxFrequency}
          onSiphon={handleSiphon}
        />
        <p className="font-mono text-[9px] text-neutral-400">
          Hover a node to open the raycaster handshake; tap to siphon torque.
        </p>
      </div>
    </div>
  );
};
