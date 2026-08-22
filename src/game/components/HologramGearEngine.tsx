import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Eye, EyeOff, RotateCw, Cog, Box, Sparkles, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { HologramEngineState, LightProtocolData } from '../types';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { AppThemeConfig, APP_THEMES } from '../utils/theme';

interface HologramGearEngineProps {
  powerOn: boolean;
  fluxFrequency: number;
  currentLight: LightProtocolData;
  engineState: HologramEngineState;
  onUpdateState: (newState: Partial<HologramEngineState>) => void;
  theme?: AppThemeConfig;
}

export const HologramGearEngine: React.FC<HologramGearEngineProps> = ({
  powerOn,
  fluxFrequency,
  currentLight,
  engineState,
  onUpdateState,
  theme = APP_THEMES.CRIMSON_CYBERPUNK,
}) => {
  const [selectedGear, setSelectedGear] = useState<string | null>(null);

  const toggleLayer = (layerKey: keyof HologramEngineState['visibleLayers']) => {
    sounds.playClick(840);
    haptics.trigger('click');
    onUpdateState({
      visibleLayers: {
        ...engineState.visibleLayers,
        [layerKey]: !engineState.visibleLayers[layerKey],
      },
    });
  };

  const cycleViewMode = () => {
    const modes: HologramEngineState['viewMode'][] = [
      'EXPLODED_3D',
      'ISOMETRIC',
      'TOP_DOWN',
      'CROSS_SECTION',
    ];
    const nextIdx = (modes.indexOf(engineState.viewMode) + 1) % modes.length;
    sounds.playClick(720);
    haptics.trigger('click');
    onUpdateState({ viewMode: modes[nextIdx] });
  };

  const cycleMesh = () => {
    const meshes: HologramEngineState['meshType'][] = [
      'CRYSTALLINE_FOLDER',
      'QUANTUM_PRISM',
      'NEURAL_LATTICE',
    ];
    const nextIdx = (meshes.indexOf(engineState.meshType) + 1) % meshes.length;
    sounds.playClick(680);
    haptics.trigger('click');
    onUpdateState({ meshType: meshes[nextIdx] });
  };

  // Rotation duration dynamically calculated from Flux frequency slider
  const baseRotationDuration = powerOn ? Math.max(0.6, 12 - (fluxFrequency / 100) * 10) : 0;

  return (
    <div
      id="hologram-gear-engine"
      className="relative w-full h-full min-h-[480px] bg-[#0A0A0A] border border-white/10 p-4 sm:p-5 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Header Controls Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 border border-white/15 bg-white/5">
            <Box className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="font-mono text-xs sm:text-sm font-black tracking-widest text-white">
              HOLOGRAPHIC // GEAR ENGINE
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">
              LAYERED BIO-MECHANICAL PROCESSOR
            </span>
          </div>
        </div>

        {/* View mode & Mesh switchers */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={cycleViewMode}
            className="flex items-center gap-1 px-2.5 py-1 border border-white/20 bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <Layers className="w-3 h-3 text-neutral-400" />
            <span className="text-[10px] font-bold">{engineState.viewMode}</span>
          </button>

          <button
            onClick={cycleMesh}
            className="flex items-center gap-1 px-2.5 py-1 border border-red-600/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 active:scale-95 transition-all"
          >
            <Sparkles className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold">{engineState.meshType}</span>
          </button>
        </div>
      </div>

      {/* Center 3-Tier Multi-Layer Interactive Visualizer */}
      <div className="relative z-10 my-auto w-full h-[320px] flex items-center justify-center overflow-hidden">
        {/* Ambient Light Flare */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-15"
          style={{
            backgroundColor: powerOn ? '#dc2626' : '#171717',
          }}
        />

        {/* Transformable Stage with 3D Perspective */}
        <div
          className="relative w-80 h-72 transition-transform duration-700"
          style={{
            transform:
              engineState.viewMode === 'EXPLODED_3D'
                ? 'perspective(900px) rotateX(48deg) rotateZ(-22deg) scale(0.95)'
                : engineState.viewMode === 'ISOMETRIC'
                ? 'perspective(900px) rotateX(35deg) rotateZ(-30deg) scale(0.9)'
                : engineState.viewMode === 'CROSS_SECTION'
                ? 'perspective(900px) rotateX(75deg) rotateZ(0deg) scale(1)'
                : 'perspective(900px) rotateX(0deg) rotateZ(0deg) scale(0.9)',
          }}
        >
          {/* TIER 3 (BASE LAYER): Mechanical Clockwork Gear Train */}
          {engineState.visibleLayers.mechanicalGears && (
            <motion.div
              className="absolute inset-0 bg-[#0E0E0E] border border-white/20 p-3 overflow-hidden shadow-2xl"
              style={{
                transform:
                  engineState.viewMode === 'EXPLODED_3D'
                    ? 'translateZ(0px)'
                    : 'translateZ(0px)',
              }}
            >
              <div className="absolute top-2 left-2 text-[8px] font-mono text-neutral-400">
                CHRONO-CORE // 36-TOOTH RATIO
              </div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-red-500">
                RPM: {(fluxFrequency * 18.5).toFixed(0)}
              </div>

              {/* Interlocking Gears Array */}
              <svg className="w-full h-full" viewBox="0 0 280 220">
                <defs>
                  <linearGradient id="monochromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#a3a3a3" />
                    <stop offset="100%" stopColor="#525252" />
                  </linearGradient>
                  <linearGradient id="redGradGear" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </linearGradient>
                </defs>

                {/* Main Drive Gear */}
                <g
                  transform="translate(100, 110)"
                  onClick={() => {
                    sounds.playGearTick();
                    setSelectedGear('DRIVE_GEAR_01');
                  }}
                  className="cursor-pointer"
                >
                  <motion.g
                    animate={{ rotate: powerOn ? 360 : 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: baseRotationDuration,
                      ease: 'linear',
                    }}
                  >
                    <circle r="44" fill="none" stroke="url(#monochromeGrad)" strokeWidth="10" strokeDasharray="6 3.5" />
                    <circle r="40" fill="#171717" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <path d="M -30 0 L 30 0 M 0 -30 L 0 30 M -21 -21 L 21 21 M -21 21 L 21 -21" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <circle r="12" fill="url(#redGradGear)" stroke="#fff" strokeWidth="1" />
                    <circle r="4" fill="#000" />
                  </motion.g>
                </g>

                {/* Secondary Interlocking Gear */}
                <g
                  transform="translate(175, 75)"
                  onClick={() => {
                    sounds.playGearTick();
                    setSelectedGear('PINION_GEAR_02');
                  }}
                  className="cursor-pointer"
                >
                  <motion.g
                    animate={{ rotate: powerOn ? -360 : 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: baseRotationDuration * 0.72,
                      ease: 'linear',
                    }}
                  >
                    <circle r="34" fill="none" stroke="url(#monochromeGrad)" strokeWidth="8" strokeDasharray="5 3" />
                    <circle r="30" fill="#1c1917" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <path d="M -22 0 L 22 0 M 0 -22 L 0 22" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                    <circle r="9" fill="#262626" />
                    <circle r="3" fill="#dc2626" />
                  </motion.g>
                </g>

                {/* Tertiary Escapement Gear */}
                <g
                  transform="translate(185, 150)"
                  onClick={() => {
                    sounds.playGearTick();
                    setSelectedGear('ESCAPEMENT_03');
                  }}
                  className="cursor-pointer"
                >
                  <motion.g
                    animate={{ rotate: powerOn ? 360 : 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: baseRotationDuration * 0.5,
                      ease: 'linear',
                    }}
                  >
                    <circle r="26" fill="none" stroke="url(#redGradGear)" strokeWidth="6" strokeDasharray="4 2.5" />
                    <circle r="23" fill="#171717" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <circle r="7" fill="url(#monochromeGrad)" />
                  </motion.g>
                </g>

                {/* Micro Transfer Pinion */}
                <g transform="translate(45, 145)">
                  <motion.g
                    animate={{ rotate: powerOn ? -360 : 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: baseRotationDuration * 0.4,
                      ease: 'linear',
                    }}
                  >
                    <circle r="18" fill="none" stroke="url(#monochromeGrad)" strokeWidth="5" strokeDasharray="3 2" />
                    <circle r="15" fill="#171717" />
                    <circle r="4" fill="#dc2626" />
                  </motion.g>
                </g>
              </svg>
            </motion.div>
          )}

          {/* TIER 2 (MIDDLE LAYER): High-Density Silicon PCB Matrix */}
          {engineState.visibleLayers.siliconPcb && (
            <motion.div
              className="absolute inset-0 bg-[#0A0A0A]/90 border border-white/30 p-3 overflow-hidden"
              style={{
                transform:
                  engineState.viewMode === 'EXPLODED_3D'
                    ? 'translateZ(65px)'
                    : 'translateZ(20px)',
              }}
            >
              <div className="absolute top-2 left-2 text-[8px] font-mono text-white/70">
                SILICON LOGIC MATRIX // 8-NM SYNAPSE
              </div>

              {/* Silicon Micro-Traces and Logic Gates */}
              <svg className="w-full h-full" viewBox="0 0 280 220">
                <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none">
                  <path d="M 30 30 L 70 30 L 90 60 L 150 60 L 170 40 L 250 40" />
                  <path d="M 40 190 L 80 190 L 100 150 L 160 150 L 180 170 L 240 170" />
                  <path d="M 140 20 L 140 80 L 120 100 L 120 140 L 150 170 L 150 200" stroke="#dc2626" />
                </g>
                {/* Silicon IC Chips */}
                <rect x="80" y="80" width="120" height="60" fill="#141414" stroke="#ffffff" strokeWidth="1.5" />
                <text x="140" y="112" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  AURORA-V9
                </text>
                <text x="140" y="126" fill="#dc2626" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  QUANTUM LOGIC BUS
                </text>
                {/* IC Pins */}
                {[90, 110, 130, 150, 170, 190].map((px) => (
                  <g key={px}>
                    <line x1={px} y1="74" x2={px} y2="80" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1={px} y1="140" x2={px} y2="146" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                ))}
              </svg>
            </motion.div>
          )}

          {/* TIER 1 (TOP LAYER): Holographic Crystalline Wireframe Mesh */}
          {engineState.visibleLayers.holographicWireframe && (
            <motion.div
              className="absolute inset-0 bg-red-950/10 border border-red-600/60 p-3 backdrop-blur-[1px] overflow-hidden"
              style={{
                transform:
                  engineState.viewMode === 'EXPLODED_3D'
                    ? 'translateZ(130px)'
                    : 'translateZ(40px)',
              }}
            >
              <div className="absolute top-2 left-2 text-[8px] font-mono text-red-500 font-bold">
                HOLOGRAM WIREFRAME // PRISM FACETS
              </div>

              <svg className="w-full h-full" viewBox="0 0 280 220">
                <defs>
                  <linearGradient id="polyGradArt" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#dc2626" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Faceted Low-Poly Mesh */}
                <g stroke="#ffffff" strokeWidth="1" opacity="0.8">
                  {/* Top Crystalline Tab */}
                  <polygon points="40,30 90,15 140,30 90,45" fill="url(#polyGradArt)" />
                  <polygon points="140,30 190,15 240,30 190,45" fill="url(#polyGradArt)" />

                  {/* Body Low-Poly Mesh */}
                  <polygon points="40,30 90,45 80,100 30,85" fill="rgba(255,255,255,0.05)" />
                  <polygon points="90,45 140,30 150,90 80,100" fill="rgba(220,38,38,0.15)" />
                  <polygon points="140,30 190,45 200,95 150,90" fill="rgba(255,255,255,0.05)" />
                  <polygon points="190,45 240,30 250,85 200,95" fill="rgba(220,38,38,0.15)" />

                  <polygon points="30,85 80,100 70,160 20,145" fill="rgba(220,38,38,0.1)" />
                  <polygon points="80,100 150,90 140,165 70,160" fill="rgba(255,255,255,0.05)" />
                  <polygon points="150,90 200,95 210,160 140,165" fill="rgba(220,38,38,0.15)" />
                  <polygon points="200,95 250,85 260,145 210,160" fill="rgba(255,255,255,0.05)" />

                  {/* Base Flange */}
                  <polygon points="20,145 70,160 140,165 210,160 260,145 140,195" fill="url(#polyGradArt)" opacity="0.7" />
                </g>

                {/* Glowing Vertices */}
                {[
                  { cx: 40, cy: 30 },
                  { cx: 90, cy: 15 },
                  { cx: 140, cy: 30 },
                  { cx: 190, cy: 15 },
                  { cx: 240, cy: 30 },
                  { cx: 80, cy: 100 },
                  { cx: 150, cy: 90 },
                  { cx: 200, cy: 95 },
                  { cx: 70, cy: 160 },
                  { cx: 140, cy: 165 },
                  { cx: 210, cy: 160 },
                ].map((v, i) => (
                  <circle
                    key={i}
                    cx={v.cx}
                    cy={v.cy}
                    r="2"
                    fill={i % 2 === 0 ? '#ffffff' : '#dc2626'}
                    className="animate-pulse"
                  />
                ))}
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Layer Toggle Switches */}
      <div className="relative z-20 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Toggle Layer 1 */}
          <button
            onClick={() => toggleLayer('holographicWireframe')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono font-bold transition-all ${
              engineState.visibleLayers.holographicWireframe
                ? 'border-red-600 bg-red-950/40 text-red-400'
                : 'border-white/15 bg-white/5 text-neutral-500'
            }`}
          >
            {engineState.visibleLayers.holographicWireframe ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>HOLOGRAM</span>
          </button>

          {/* Toggle Layer 2 */}
          <button
            onClick={() => toggleLayer('siliconPcb')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono font-bold transition-all ${
              engineState.visibleLayers.siliconPcb
                ? 'border-white bg-white/15 text-white'
                : 'border-white/15 bg-white/5 text-neutral-500'
            }`}
          >
            {engineState.visibleLayers.siliconPcb ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>SILICON PCB</span>
          </button>

          {/* Toggle Layer 3 */}
          <button
            onClick={() => toggleLayer('mechanicalGears')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono font-bold transition-all ${
              engineState.visibleLayers.mechanicalGears
                ? 'border-white bg-white/15 text-white'
                : 'border-white/15 bg-white/5 text-neutral-500'
            }`}
          >
            {engineState.visibleLayers.mechanicalGears ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>GEAR DRIVE</span>
          </button>
        </div>

        {/* Selected Component Status */}
        <div className="text-[10px] font-mono text-neutral-400">
          STATUS: <span className="text-red-500 font-bold">{powerOn ? 'RESONATING' : 'IDLE'}</span>
        </div>
      </div>
    </div>
  );
};
