import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Heart, Cpu, Flame, Database, Radio, Droplet, ArrowRight, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { LightProtocolData, SubsystemStatus } from '../types';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { AppThemeConfig, APP_THEMES } from '../utils/theme';

interface LightProtocolPCBProps {
  powerOn: boolean;
  subsystems: SubsystemStatus;
  currentLight: LightProtocolData;
  onSelectNode: (nodeName: string) => void;
  onOverchargeCore: () => void;
  activeNode: string | null;
  fluxFrequency: number;
  theme?: AppThemeConfig;
}

export const LightProtocolPCB: React.FC<LightProtocolPCBProps> = ({
  powerOn,
  subsystems,
  currentLight,
  onSelectNode,
  onOverchargeCore,
  activeNode,
  fluxFrequency,
  theme = APP_THEMES.CRIMSON_CYBERPUNK,
}) => {
  const [corePulsing, setCorePulsing] = useState(false);

  const handleCoreClick = () => {
    if (!powerOn) return;
    setCorePulsing(true);
    sounds.playSimulatePulse();
    haptics.trigger('overcharge');
    onOverchargeCore();
    setTimeout(() => setCorePulsing(false), 800);
  };

  const handleNodeClick = (nodeName: string) => {
    if (!powerOn) return;
    sounds.playClick(940);
    haptics.trigger('click');
    onSelectNode(nodeName);
  };

  const primaryCyan = '#00f0ff';
  const warmAmber = '#ff9900';

  return (
    <div
      id="light-protocol-pcb"
      className="relative w-full h-full min-h-[520px] bg-[#0A0A0A] border border-white/10 p-4 sm:p-6 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Background PCB Trace SVG Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="traceGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="traceGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#737373" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Dense PCB Micro-Grid Lines */}
        <pattern id="pcbGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx="15" cy="15" r="0.8" fill="rgba(255,255,255,0.12)" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#pcbGrid)" />

        {/* Radiating High-Voltage Bus Lines */}
        {powerOn && (
          <g>
            {/* Top bus towards Top-Left */}
            <path
              d="M 50% 50% L 48% 30% L 40% 18% L 25% 18% L 20% 5%"
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Top bus towards Top-Right */}
            <path
              d="M 50% 50% L 54% 34% L 62% 28% L 75% 28% L 85% 15%"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left bus towards Heat-Treated Metal */}
            <path
              d="M 50% 50% L 36% 44% L 26% 44% L 20% 48% L 10% 48%"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right bus towards Asset Packs */}
            <path
              d="M 50% 50% L 65% 58% L 78% 58% L 85% 64% L 95% 64%"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom-Left bus towards Sensors */}
            <path
              d="M 50% 50% L 42% 64% L 35% 72% L 35% 88% L 28% 95%"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom-Right bus towards Nutrient System */}
            <path
              d="M 50% 50% L 56% 66% L 68% 78% L 76% 78% L 82% 90%"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Ambient PCB Solder Pads & Vias */}
        {[
          { cx: '18%', cy: '12%' },
          { cx: '45%', cy: '22%' },
          { cx: '82%', cy: '24%' },
          { cx: '14%', cy: '56%' },
          { cx: '64%', cy: '50%' },
          { cx: '88%', cy: '72%' },
          { cx: '30%', cy: '82%' },
          { cx: '50%', cy: '85%' },
        ].map((via, idx) => (
          <g key={idx}>
            <circle cx={via.cx} cy={via.cy} r="2.5" fill="#dc2626" opacity={powerOn ? '0.9' : '0.2'} />
            <circle cx={via.cx} cy={via.cy} r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" opacity={powerOn ? '0.6' : '0.1'} />
          </g>
        ))}
      </svg>

      {/* TOP SECTION: HEALTH, AI CORE, SHIELD (Left) + CPU DASHBOARD (Right) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Subsystem Stack: Health / AI Core / Shield */}
        <div className="flex flex-col gap-2 max-w-xs">
          {/* HEALTH Bar Node */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('HEALTH')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'HEALTH'
                ? 'border-red-600 bg-red-950/40'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-white">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                <span>HEALTH</span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-neutral-900 overflow-hidden border border-white/10 p-0.5">
                <motion.div
                  className="h-full bg-red-600"
                  animate={{ width: powerOn ? `${subsystems.health.integrity}%` : '0%' }}
                />
              </div>
            </div>
          </motion.div>

          {/* AI CORE Load Node */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('AI_CORE')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'AI_CORE'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-white">
                <Cpu className="w-3.5 h-3.5 text-neutral-300" />
                <span>AI CORE</span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-neutral-900 overflow-hidden border border-white/10 p-0.5">
                <motion.div
                  className="h-full bg-white"
                  animate={{ width: powerOn ? `${subsystems.aiCore.load}%` : '0%' }}
                />
              </div>
            </div>
          </motion.div>

          {/* SHIELD Deflector Node */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('SHIELD')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'SHIELD'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-white">
                <Shield className="w-3.5 h-3.5 text-neutral-300" />
                <span>SHIELD</span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-neutral-900 overflow-hidden border border-white/10 p-0.5">
                <motion.div
                  className="h-full bg-neutral-300"
                  animate={{ width: powerOn ? `${subsystems.shield.strength}%` : '0%' }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Node: CPU DASHBOARD */}
        <div className="flex flex-col items-start md:items-end justify-start">
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('CPU_DASHBOARD')}
            className={`cursor-pointer w-full max-w-xs border p-3 transition-all ${
              activeNode === 'CPU_DASHBOARD'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-white">
                CPU DASHBOARD
              </span>
              <span className="font-mono text-[10px] text-red-500 font-bold">
                {subsystems.cpuDashboard.clockGhz.toFixed(2)} GHz
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {subsystems.cpuDashboard.coreLoads.map((load, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full h-8 bg-neutral-900 overflow-hidden flex flex-col justify-end p-0.5 border border-white/10">
                    <motion.div
                      className={`w-full ${idx === 0 ? 'bg-red-600' : 'bg-white'}`}
                      animate={{ height: powerOn ? `${load}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-neutral-400 mt-0.5">C{idx}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* MIDDLE SECTION: HEAT-TREATED METAL (Left) + CENTRAL LIGHT-PROTOCOL CORE + ASSET PACKS (Right) */}
      <div className="relative z-10 my-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: HEAT-TREATED METAL */}
        <div className="flex flex-col gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => handleNodeClick('HEAT_TREATED_METAL')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'HEAT_TREATED_METAL'
                ? 'border-red-600 bg-red-950/40'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <div className="font-mono text-xs sm:text-sm font-black tracking-widest text-white">
                HEAT-TREATED METAL
              </div>
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
              ALLOY TEMP: {subsystems.heatTreatedMetal.temperatureC}°C | STRAIN: {subsystems.heatTreatedMetal.alloyStrain}%
            </div>
          </motion.div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-white/50 px-1">
            <span className="tracking-widest uppercase">SWIPE</span>
            <ArrowRight className="w-3 h-3 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* CENTER REACTOR: LIGHT-PROTOCOL CORE */}
        <div className="relative flex items-center justify-center py-2">
          {powerOn && (
            <>
              <motion.div
                className="absolute w-36 h-36 rounded-full border border-white/20"
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              />
              <motion.div
                className="absolute w-44 h-44 rounded-full border border-dashed border-red-600/40"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
              />
            </>
          )}

          <motion.button
            id="btn-light-protocol-core"
            onClick={handleCoreClick}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all ${
              powerOn
                ? 'border-white bg-[#0A0A0A] text-white shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                : 'border-white/10 bg-[#050505] text-neutral-600'
            }`}
          >
            {corePulsing && (
              <motion.div
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-red-600/30"
              />
            )}

            <div className="relative z-10 flex flex-col items-center text-center p-2">
              <Zap className={`w-4 h-4 mb-0.5 ${powerOn ? 'text-red-500' : 'text-neutral-600'}`} />
              <span className="font-mono text-[11px] sm:text-xs font-black tracking-widest leading-tight text-white">
                LIGHT-
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] font-black tracking-widest leading-tight text-white">
                PROTOCOL
              </span>
              <span className="text-[8px] font-mono text-red-500 mt-1 font-bold">
                {powerOn ? `${Math.round(fluxFrequency * 10)} THz` : 'OFF'}
              </span>
            </div>
          </motion.button>
        </div>

        {/* Right Side: ASSET PACKS Node */}
        <div className="flex flex-col items-end">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => handleNodeClick('ASSET_PACKS')}
            className={`cursor-pointer border px-4 py-3 transition-all ${
              activeNode === 'ASSET_PACKS'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-white" />
              <div className="font-mono text-xs sm:text-sm font-black tracking-wider text-white">
                ASSET PACKS
              </div>
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-1">
              SHADERS: {subsystems.assetPacks.loadedBuffers} | VRAM: {subsystems.assetPacks.matrixCacheMb} MB
            </div>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM SECTION: SENSORS (Left) + NUTRIENT SYS. (Right) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        {/* Left: Dual SENSORS Nodes */}
        <div className="flex flex-col sm:flex-row gap-2">
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('SENSORS_ALPHA')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'SENSORS_ALPHA'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-neutral-300" />
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-white">
                SENSORS
              </span>
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
              EM: {subsystems.sensors.emSpectrum.toFixed(1)} uT
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('SENSORS_BETA')}
            className={`cursor-pointer border px-3.5 py-2.5 transition-all ${
              activeNode === 'SENSORS_BETA'
                ? 'border-red-600 bg-red-950/40'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-white">
                SENSORS
              </span>
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
              Q-RES: {subsystems.sensors.quantumResonance.toFixed(2)} Φ
            </div>
          </motion.div>
        </div>

        {/* Right: NUTRIENT SYS. */}
        <div className="flex justify-start md:justify-end">
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleNodeClick('NUTRIENT_SYS')}
            className={`cursor-pointer w-full max-w-xs border p-3 transition-all ${
              activeNode === 'NUTRIENT_SYS'
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-neutral-300" />
                <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-white">
                  NUTRIENT SYS.
                </span>
              </div>
              <span className="font-mono text-[10px] text-red-500 font-bold">
                {subsystems.nutrientSys.fluidPressurePsi} PSI
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-1 bg-neutral-900 overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  animate={{ width: powerOn ? `${subsystems.nutrientSys.electrolyteBalance}%` : '0%' }}
                />
              </div>
              <div className="h-1 bg-neutral-900 overflow-hidden">
                <motion.div
                  className="h-full bg-red-600"
                  animate={{ width: powerOn ? `${subsystems.nutrientSys.bioPurity}%` : '0%' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
