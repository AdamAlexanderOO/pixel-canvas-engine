import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Zap,
  Power,
  Sliders,
  Sun,
  Volume2,
  VolumeX,
  Sparkles,
  Cpu,
  Activity,
} from 'lucide-react';
import { LightPreset, LightProtocolData, SimulationMode } from '../types';
import { AppThemeConfig, APP_THEMES } from '../utils/theme';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

interface AuroraMachineConsoleProps {
  powerOn: boolean;
  onTogglePower: () => void;
  fluxFrequency: number;
  onFluxChange: (val: number) => void;
  currentLight: LightProtocolData;
  onCycleLight: () => void;
  onRunSimulation: (mode: SimulationMode) => void;
  isSimulating: boolean;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme?: AppThemeConfig;
}

export const AuroraMachineConsole: React.FC<AuroraMachineConsoleProps> = ({
  powerOn,
  onTogglePower,
  fluxFrequency,
  onFluxChange,
  currentLight,
  onCycleLight,
  onRunSimulation,
  isSimulating,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  theme = APP_THEMES.CRIMSON_CYBERPUNK,
}) => {
  const [selectedMode, setSelectedMode] = useState<SimulationMode>('SIMULATE');
  const [sliderHover, setSliderHover] = useState(false);

  const handleSimulateClick = () => {
    sounds.playSimulatePulse();
    haptics.trigger('heavy');
    onRunSimulation(selectedMode);
  };

  const handleLightClick = () => {
    sounds.playSpectrumLoad();
    haptics.trigger('pulse');
    onCycleLight();
  };

  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onFluxChange(val);
    sounds.playGearTick();
    haptics.trigger('light');
  };

  const cycleMode = () => {
    const modes: SimulationMode[] = [
      'SIMULATE',
      'QUANTUM_SYNTHESIS',
      'BIO_TACTICAL',
      'NEURAL_LINK',
      'SPECTRAL_SWEEP',
    ];
    const nextIdx = (modes.indexOf(selectedMode) + 1) % modes.length;
    setSelectedMode(modes[nextIdx]);
    sounds.playClick(620);
    haptics.trigger('click');
  };

  return (
    <div
      id="aurora-machine-chassis"
      className="relative w-full max-w-sm select-none p-5 border shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all font-mono"
      style={{
        backgroundColor: theme.bgDark,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 15px ${theme.glowRgba}`,
      }}
    >
      {/* Machined chassis corner screw bolts (Minimalist Precision Pins) */}
      <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-neutral-800 border border-white/20 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-900 rotate-45" />
      </div>
      <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-neutral-800 border border-white/20 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-900 -rotate-45" />
      </div>
      <div className="absolute bottom-2.5 left-2.5 w-2 h-2 bg-neutral-800 border border-white/20 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-900 -rotate-12" />
      </div>
      <div className="absolute bottom-2.5 right-2.5 w-2 h-2 bg-neutral-800 border border-white/20 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-900 rotate-60" />
      </div>

      {/* Top Header Label */}
      <div className="text-center pt-1 pb-3 border-b border-white/10 mb-4">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold"
          style={{ color: theme.primary }}
        >
          Hardware Deck 02 // {theme.name.split(' ')[0]}
        </div>
        <h2 className="font-mono tracking-[0.25em] text-base font-black uppercase text-white mt-0.5">
          AURORA MACHINE
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: powerOn ? theme.primary : '#404040' }}
          />
          <span className="text-[9px] font-mono tracking-widest text-neutral-400">
            {powerOn ? `SYSTEM ONLINE // ${currentLight.name}` : 'STANDBY MODE'}
          </span>
        </div>
      </div>

      {/* Primary Display Screen (Obsidian Chamfered Screen) */}
      <div
        id="aurora-main-screen"
        className={`relative mb-4 border p-4 text-center overflow-hidden transition-all duration-300 ${
          powerOn ? 'border-white/20 bg-neutral-950' : 'border-white/5 bg-[#050505]'
        }`}
      >
        {/* Subtle CRT scanline overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30" />

        {powerOn ? (
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[90px]">
            {/* Animated Oscilloscope / Simulation Wave */}
            <div className="flex items-center gap-1 mb-2 h-6">
              {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 30].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-t-sm"
                  style={{ backgroundColor: i % 2 === 0 ? theme.primary : '#ffffff' }}
                  animate={{
                    height: isSimulating ? [6, h * 0.26, 4] : [4, (h * fluxFrequency) / 450 + 4, 4],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.4 + (i % 4) * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            <motion.div
              animate={{
                scale: isSimulating ? [1, 1.03, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="font-mono text-lg sm:text-xl font-black tracking-widest text-white cursor-pointer transition-colors hover:opacity-90"
              style={{ color: isSimulating ? theme.primary : '#ffffff' }}
              onClick={handleSimulateClick}
            >
              {isSimulating ? 'PROCESSING...' : selectedMode}
            </motion.div>

            <div className="text-[9px] font-mono text-neutral-400 mt-1 tracking-widest uppercase">
              FREQ: {fluxFrequency.toFixed(1)} GHz | LOAD: {(fluxFrequency * 1.42).toFixed(1)} MW
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[90px] text-neutral-500 font-mono text-xs tracking-widest">
            <Power className="w-5 h-5 mb-1 text-neutral-600 animate-pulse" />
            <span>PRESS POWER TO ACTIVATE</span>
          </div>
        )}
      </div>

      {/* Button Deck Grid (Matching Image 2 Layout) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Button 1: LOAD.LIGHT */}
        <button
          type="button"
          id="btn-load-light-primary"
          onClick={handleLightClick}
          disabled={!powerOn}
          className={`group relative flex items-center justify-center border py-2.5 px-2 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            powerOn
              ? 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40'
              : 'border-white/5 bg-transparent text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
            <span>LOAD.LIGHT</span>
          </div>
        </button>

        {/* Button 2: SIMULATE (Mode switch) */}
        <button
          type="button"
          id="btn-simulate-mode"
          onClick={cycleMode}
          disabled={!powerOn}
          className={`group relative flex items-center justify-center border py-2.5 px-2 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            powerOn
              ? 'hover:bg-white/10'
              : 'border-white/5 bg-transparent text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
          style={{
            borderColor: powerOn ? theme.borderPrimary : undefined,
            backgroundColor: powerOn ? theme.badgeBg : undefined,
            color: powerOn ? theme.primary : undefined,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            <span>SIMULATE</span>
          </div>
        </button>

        {/* Tactical Flux Slider */}
        <div
          className={`col-span-1 flex flex-col justify-center border px-2.5 py-1.5 transition-all ${
            powerOn ? 'border-white/20 bg-white/5' : 'border-white/5 bg-transparent opacity-40'
          }`}
          onMouseEnter={() => setSliderHover(true)}
          onMouseLeave={() => setSliderHover(false)}
        >
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 mb-1">
            <span>FLUX</span>
            <span className="font-bold text-white">{Math.round(fluxFrequency)}%</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="10"
              max="100"
              value={fluxFrequency}
              onChange={handleSliderInput}
              disabled={!powerOn}
              className="w-full h-1 bg-neutral-800 rounded-none appearance-none cursor-pointer"
              style={{ accentColor: theme.primary }}
            />
          </div>
        </div>

        {/* Button 4: SETTINGS */}
        <button
          type="button"
          id="btn-settings"
          onClick={() => {
            sounds.playClick(720);
            haptics.trigger('click');
            onOpenSettings();
          }}
          disabled={!powerOn}
          className={`flex items-center justify-center border py-2.5 px-2 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            powerOn
              ? 'border-white/20 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10'
              : 'border-white/5 bg-transparent text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span>SETTINGS</span>
          </div>
        </button>

        {/* Button 5: LOAD .LIGHT (Secondary Spectrum Injector) */}
        <button
          type="button"
          id="btn-load-light-secondary"
          onClick={handleLightClick}
          disabled={!powerOn}
          className={`flex items-center justify-center border py-2.5 px-2 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            powerOn
              ? 'border-white/20 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10'
              : 'border-white/5 bg-transparent text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center leading-tight">
            <span>LOAD</span>
            <span className="text-[10px] text-neutral-400">.LIGHT</span>
          </div>
        </button>

        {/* Button 6: POWER */}
        <button
          type="button"
          id="btn-power-main"
          onClick={() => {
            sounds.playPowerToggle(!powerOn);
            haptics.trigger('heavy');
            onTogglePower();
          }}
          className={`flex items-center justify-center border py-2.5 px-2 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            powerOn
              ? 'text-white hover:opacity-90'
              : 'border-white/20 bg-white/5 text-neutral-400 hover:border-white/40 hover:text-white'
          }`}
          style={{
            backgroundColor: powerOn ? theme.primary : undefined,
            borderColor: powerOn ? theme.primary : undefined,
            boxShadow: powerOn ? `0 0 15px ${theme.glowRgba}` : undefined,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Power className="w-3.5 h-3.5" />
            <span>POWER</span>
          </div>
        </button>
      </div>

      {/* Bottom Console Audio & Status Quick-Toggles */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-400">
        <button
          type="button"
          onClick={() => {
            haptics.trigger('click');
            onToggleSound();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
          title={soundEnabled ? 'Mute Cyber Audio' : 'Unmute Cyber Audio'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-white" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-neutral-600" />
          )}
          <span>{soundEnabled ? 'AUDIO: SYNTH' : 'AUDIO: MUTED'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-neutral-500">REV. 4.08-X</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: powerOn ? theme.primary : '#404040',
              boxShadow: powerOn ? `0 0 6px ${theme.primary}` : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
};
