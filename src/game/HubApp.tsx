/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Zap,
  Sliders,
  Cpu,
  Layers,
  Radio,
  Sparkles,
  Shield,
  Heart,
  Flame,
  Volume2,
  VolumeX,
  RefreshCw,
  Terminal,
  Grid,
  Maximize2,
  Box,
  Eye,
  Gamepad2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  MoveHorizontal,
  Compass,
  ArrowLeft,
  ArrowRight,
  Minimize2,
} from 'lucide-react';

import {
  SimulationMode,
  LightPreset,
  LightProtocolData,
  SubsystemStatus,
  HologramEngineState,
  TelemetryState,
  RadarAnomaly,
  TerminalLog,
  SimulationResult,
} from './types';

import { AuroraMachineConsole } from './components/AuroraMachineConsole';
import { LightProtocolPCB } from './components/LightProtocolPCB';
import { HologramGearEngine } from './components/HologramGearEngine';
import { TacticalTelemetryHUD } from './components/TacticalTelemetryHUD';
import { SubsystemsArchiveView } from './components/SubsystemsArchiveView';
import { MiniGamesSuite } from './components/MiniGamesSuite';
import { TerminalArchiveView } from './components/TerminalArchiveView';
import { RomanMosaicMatrixEngine } from './components/RomanMosaicMatrixEngine';
import { AICoreModal } from './components/AICoreModal';
import { SubsystemDetailModal } from './components/SubsystemDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { SystemDiagnosticsPanel } from './components/SystemDiagnosticsPanel';
import { sounds } from './utils/soundEffects';
import { haptics } from './utils/haptics';
import { AppThemeId, AppThemeConfig, APP_THEMES } from './utils/theme';

const LIGHT_PRESETS: Record<LightPreset, LightProtocolData> = {
  AURORA_VIOLET: {
    preset: 'AURORA_VIOLET',
    name: 'AURORA VIOLET',
    primaryColor: '#ff007f',
    glowColor: '#ff007f',
    wavelengthTHz: 430,
    energyOutputMW: 142.8,
    activePathways: ['Core -> AI Synapse', 'Core -> Hologram Matrix'],
  },
  CYBER_CYAN: {
    preset: 'CYBER_CYAN',
    name: 'CYBER CYAN',
    primaryColor: '#00f0ff',
    glowColor: '#00f0ff',
    wavelengthTHz: 620,
    energyOutputMW: 188.4,
    activePathways: ['Core -> Silicon Bus', 'Core -> Shield Deflector'],
  },
  SOLAR_AMBER: {
    preset: 'SOLAR_AMBER',
    name: 'SOLAR AMBER',
    primaryColor: '#ffaa00',
    glowColor: '#ffaa00',
    wavelengthTHz: 510,
    energyOutputMW: 165.2,
    activePathways: ['Core -> Heat-Treated Metal', 'Core -> Gear Drive'],
  },
  BIOLUMINESCENT: {
    preset: 'BIOLUMINESCENT',
    name: 'BIOLUMINESCENT',
    primaryColor: '#00ffaa',
    glowColor: '#00ffaa',
    wavelengthTHz: 550,
    energyOutputMW: 135.0,
    activePathways: ['Core -> Nutrient System', 'Core -> Bio Sensors'],
  },
  GAMMA_PULSE: {
    preset: 'GAMMA_PULSE',
    name: 'GAMMA PULSE',
    primaryColor: '#a855f7',
    glowColor: '#a855f7',
    wavelengthTHz: 780,
    energyOutputMW: 240.6,
    activePathways: ['Core -> Quantum Radar', 'Core -> CPU Dashboard'],
  },
  HEAT_TREATED: {
    preset: 'HEAT_TREATED',
    name: 'HEAT-TREATED METALLIC',
    primaryColor: '#ff5500',
    glowColor: '#ff5500',
    wavelengthTHz: 480,
    energyOutputMW: 195.1,
    activePathways: ['Core -> Alloy Chassis', 'Core -> Chrono Escapement'],
  },
  SAKURA_PINK: {
    preset: 'SAKURA_PINK',
    name: 'CYBER SAKURA PINK',
    primaryColor: '#ff2a85',
    glowColor: '#ff2a85',
    wavelengthTHz: 410,
    energyOutputMW: 215.4,
    activePathways: ['Core -> Plasma Conduit', 'Core -> Mosaic Tesserae Matrix'],
  },
};

export type MobileTab =
  | 'CONSOLE'
  | 'PCB'
  | 'GEARS'
  | 'RADAR'
  | 'SUBSYSTEMS'
  | 'ARCADE'
  | 'MOSAIC'
  | 'ALL_FEED';

export default function App() {
  // Core Deck State
  const [powerOn, setPowerOn] = useState<boolean>(true);
  const [fluxFrequency, setFluxFrequency] = useState<number>(68);
  const [currentLightPreset, setCurrentLightPreset] = useState<LightPreset>('CYBER_CYAN');
  const [activeTab, setActiveTab] = useState<MobileTab>('CONSOLE');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Subsystem Status (Full 8 Subsystems from uploaded files)
  const [subsystems, setSubsystems] = useState<SubsystemStatus>({
    health: { current: 980, max: 1000, integrity: 98, status: 'OPTIMAL' },
    aiCore: { load: 42, neuralSync: 99.4, temperatureC: 38.5, promptTokens: 1420 },
    shield: { strength: 88, harmonics: 450, chargeRate: 24.5, locked: true },
    heatTreatedMetal: { alloyStrain: 12, temperatureC: 62.4, structuralPurity: 99.9 },
    cpuDashboard: { coreLoads: [45, 62, 38, 54], clockGhz: 4.85, instructionMips: 94000 },
    assetPacks: { loadedBuffers: 14, matrixCacheMb: 512, activeShaders: ['Aurora_Shader', 'PCB_Traces', 'Brass_Gear_Reflect'] },
    sensors: { emSpectrum: 42.4, quantumResonance: 0.98, thermalFlux: 234.1 },
    nutrientSys: { fluidPressurePsi: 145, electrolyteBalance: 86, bioPurity: 97.5 },
  });

  // Hologram Engine State
  const [hologramState, setHologramState] = useState<HologramEngineState>({
    visibleLayers: {
      holographicWireframe: true,
      siliconPcb: true,
      mechanicalGears: true,
    },
    meshType: 'CRYSTALLINE_FOLDER',
    viewMode: 'EXPLODED_3D',
    gearRpm: 1240,
    gearRatio: 3.6,
    prismaticRefraction: 1.42,
  });

  // Tactical Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    gauges: {
      primaryFlux: 45,
      harmonicEntropy: 38,
      capacitorLoad: 33,
    },
    testTubes: [
      { id: 'tube-1', label: 'CYAN-01', level: 75, color: '#00f0ff', pulseSpeed: 1.2 },
      { id: 'tube-2', label: 'VIOLET-02', level: 55, color: '#ff007f', pulseSpeed: 1.8 },
      { id: 'tube-3', label: 'AMBER-03', level: 88, color: '#ffaa00', pulseSpeed: 0.9 },
      { id: 'tube-4', label: 'BIO-04', level: 64, color: '#00ffaa', pulseSpeed: 1.5 },
    ],
    radarAnomalies: [
      { id: 'anom-1', label: 'SIG-ALPHA', angle: 45, radius: 60, severity: 'NOMINAL', coordinates: '34°N 118°W', signature: '0x4F92' },
      { id: 'anom-2', label: 'FLUX-ELEVATED', angle: 165, radius: 85, severity: 'ELEVATED', coordinates: '12°S 77°W', signature: '0x88A1' },
      { id: 'anom-3', label: 'QUANTUM-BURST', angle: 280, radius: 45, severity: 'CRITICAL', coordinates: '51°N 0°E', signature: '0xFF30' },
    ],
    radarAngle: 0,
    hexGridActive: [1, 2, 4, 5, 8],
    matrixStreamActive: true,
  });

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    { id: '1', timestamp: '14:44:01', source: 'SYSTEM', message: 'Aurora Machine Smartphone Console ready.', type: 'INFO' },
    { id: '2', timestamp: '14:44:02', source: 'LIGHT_PROTOCOL', message: 'Photon traces locked at 620 THz.', type: 'SUCCESS' },
    { id: '3', timestamp: '14:44:03', source: 'GEAR_DRIVE', message: 'Chrono-escapement meshed with 36-tooth brass drive.', type: 'INFO' },
    { id: '4', timestamp: '14:44:05', source: 'AI_SIM', message: 'Gemini AI Core neural standby ready.', type: 'SUCCESS' },
    { id: '5', timestamp: '14:44:08', source: 'SYSTEM', message: 'All 8 subsystems online: HEALTH, AI CORE, SHIELD, HEAT-TREATED METAL, CPU, ASSET PACKS, SENSORS, NUTRIENTS.', type: 'INFO' },
  ]);

  // Modals & UI States
  const [activeNodeModal, setActiveNodeModal] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<RadarAnomaly | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isArcadeFullscreen, setIsArcadeFullscreen] = useState<boolean>(false);

  // Settings & Theme
  const [currentThemeId, setCurrentThemeId] = useState<AppThemeId>('CRIMSON_CYBERPUNK');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(false);
  const [glowIntensity, setGlowIntensity] = useState<number>(85);
  const [overclockEnabled, setOverclockEnabled] = useState<boolean>(false);

  const currentTheme = APP_THEMES[currentThemeId] || APP_THEMES.CRIMSON_CYBERPUNK;

  const handleSelectTheme = (themeId: AppThemeId) => {
    setCurrentThemeId(themeId);
    sounds.playSpectrumLoad();
    haptics.trigger('medium');
    addLog(`Color Scheme shifted to ${APP_THEMES[themeId].name}.`, 'SUCCESS', 'SYSTEM');
  };

  const handleToggleDiagnostics = () => {
    setIsDiagnosticsOpen((prev) => !prev);
    sounds.playClick(720);
    haptics.trigger('click');
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    haptics.setEnabled(next);
    if (next) haptics.trigger('success');
    sounds.playClick(750);
  };

  // Mobile Tabs definition
  const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
    { id: 'CONSOLE', label: 'Console', icon: Sliders, tag: '01' },
    { id: 'PCB', label: 'PCB Board', icon: Grid, tag: '02' },
    { id: 'GEARS', label: 'Holo Gears', icon: Layers, tag: '03' },
    { id: 'RADAR', label: 'Radar HUD', icon: Radio, tag: '04' },
    { id: 'SUBSYSTEMS', label: '8 Matrix', icon: Activity, tag: '05' },
    { id: 'ARCADE', label: 'Arcade', icon: Gamepad2, tag: '06' },
    { id: 'MOSAIC', label: 'Mosaic', icon: Sparkles, tag: '07' },
  ];

  // Log append helper
  const addLog = (message: string, type: TerminalLog['type'] = 'INFO', source: TerminalLog['source'] = 'SYSTEM') => {
    const time = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [
      ...prev.slice(-60),
      { id: Math.random().toString(36).substring(2, 7), timestamp: time, message, type, source },
    ]);
  };

  // Light spectrum cycle handler
  const handleCycleLight = () => {
    const keys = Object.keys(LIGHT_PRESETS) as LightPreset[];
    const nextIdx = (keys.indexOf(currentLightPreset) + 1) % keys.length;
    const nextPreset = keys[nextIdx];
    setCurrentLightPreset(nextPreset);
    sounds.playSpectrumLoad();
    addLog(`Light-Protocol spectrum shifted to ${LIGHT_PRESETS[nextPreset].name}.`, 'SUCCESS', 'LIGHT_PROTOCOL');
  };

  // Run Simulation
  const handleRunSimulation = async (mode: SimulationMode) => {
    if (!powerOn) return;
    setIsSimulating(true);
    setIsAiModalOpen(true);
    sounds.playSimulatePulse();
    addLog(`Executing ${mode} quantum pulse on AI Core...`, 'INFO', 'AI_SIM');

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          parameters: {
            fluxFrequency,
            overclockEnabled,
            lightPreset: currentLightPreset,
            gearRpm: (fluxFrequency * 18.5).toFixed(0),
          },
          context: {
            subsystems,
            hologramView: hologramState.viewMode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: SimulationResult = await response.json();
      setSimulationResult(data);
      addLog(`Simulation completed: ${data.output.title}`, 'SUCCESS', 'AI_SIM');

      setSubsystems((prev) => ({
        ...prev,
        aiCore: { ...prev.aiCore, load: Math.min(100, prev.aiCore.load + 8) },
        shield: { ...prev.shield, strength: Math.min(100, prev.shield.strength + 4) },
      }));
    } catch (err: any) {
      console.warn('Simulation fallback:', err);
      const fallbackResult: SimulationResult = {
        simulationId: `SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'simulated_local',
        output: {
          title: `Aurora ${mode} Resonance Wave`,
          description: `Generated stable quantum photon excitation at ${fluxFrequency.toFixed(1)} GHz. Light-Protocol traces and 36-tooth gear train locked with 99.7% efficiency.`,
          metrics: {
            efficiency: `${(fluxFrequency * 0.92 + 45).toFixed(1)}%`,
            quantumCoherence: '0.992 Φ',
            entropyIndex: '0.008 Δe',
            thermalDissipation: '215 W/cm²',
          },
          recommendation: 'Maintain current nutrient fluid balance while monitoring gear escapement.',
          anomaliesDetected: 0,
          events: [
            'Holographic faceted prism synchronized with base gear train.',
            'Light-Protocol routed 4.8 GW photon flux to AI Synaptic matrix.',
            'Tactical radar coordinates aligned to Sector 07.',
          ],
        },
      };
      setSimulationResult(fallbackResult);
      addLog(`Local simulation completed: ${fallbackResult.output.title}`, 'SUCCESS', 'AI_SIM');
    } finally {
      setIsSimulating(false);
    }
  };

  // Overcharge reactor core pulse
  const handleOverchargeCore = () => {
    sounds.playSimulatePulse();
    addLog('LIGHT-PROTOCOL Core overcharged! Photon surge broadcasted to all channels.', 'WARNING', 'LIGHT_PROTOCOL');
    setSubsystems((prev) => ({
      ...prev,
      shield: { ...prev.shield, strength: 100 },
      health: { ...prev.health, integrity: 100, current: 1000 },
      aiCore: { ...prev.aiCore, load: Math.min(100, prev.aiCore.load + 15) },
      heatTreatedMetal: { ...prev.heatTreatedMetal, temperatureC: prev.heatTreatedMetal.temperatureC + 5 },
    }));
  };

  // Boost specific subsystem
  const handleBoostSubsystem = (nodeKey: string) => {
    sounds.playSpectrumLoad();
    addLog(`Subsystem [${nodeKey}] boosted with auxiliary photon flux.`, 'SUCCESS', 'SYSTEM');
    setSubsystems((prev) => {
      const copy = { ...prev };
      if (nodeKey === 'HEALTH') copy.health.integrity = 100;
      if (nodeKey === 'SHIELD') copy.shield.strength = 100;
      if (nodeKey === 'HEAT_TREATED_METAL') copy.heatTreatedMetal.alloyStrain = Math.max(2, copy.heatTreatedMetal.alloyStrain - 8);
      if (nodeKey === 'NUTRIENT_SYS') copy.nutrientSys.bioPurity = 99.8;
      if (nodeKey === 'AI_CORE') copy.aiCore.neuralSync = 99.9;
      return copy;
    });
    setActiveNodeModal(null);
  };

  // Command REPL handler for Terminal
  const handleExecuteCommand = (cmd: string) => {
    const raw = cmd.toLowerCase().trim();
    addLog(`> ${cmd}`, 'INFO', 'SYSTEM');

    if (raw === 'help') {
      addLog('Available commands: status, simulate, overclock, boost all, boost [subsystem], light [preset], clear', 'INFO', 'SYSTEM');
    } else if (raw === 'status') {
      addLog(`STATUS: Power=${powerOn ? 'ON' : 'OFF'} | Flux=${fluxFrequency.toFixed(1)}GHz | Health=${subsystems.health.integrity}% | Shield=${subsystems.shield.strength}% | AI Load=${subsystems.aiCore.load}%`, 'SUCCESS', 'SYSTEM');
    } else if (raw === 'simulate') {
      handleRunSimulation('SIMULATE');
    } else if (raw === 'overclock') {
      setOverclockEnabled(!overclockEnabled);
      addLog(!overclockEnabled ? 'OVERCLOCK ACTIVE: Boosted synaptic throughput.' : 'Overclock disabled.', 'WARNING', 'SYSTEM');
    } else if (raw === 'boost all') {
      handleOverchargeCore();
    } else if (raw.startsWith('boost ')) {
      const target = raw.replace('boost ', '').toUpperCase();
      handleBoostSubsystem(target);
    } else if (raw.startsWith('light ')) {
      const color = raw.replace('light ', '').toUpperCase();
      const match = (Object.keys(LIGHT_PRESETS) as LightPreset[]).find((k) => k.includes(color));
      if (match) {
        setCurrentLightPreset(match);
        addLog(`Shifted light preset to ${match}`, 'SUCCESS', 'LIGHT_PROTOCOL');
      } else {
        addLog(`Unknown light preset. Try cyan, violet, amber, bio, gamma, heat.`, 'WARNING', 'LIGHT_PROTOCOL');
      }
    } else if (raw === 'clear') {
      setTerminalLogs([]);
    } else {
      addLog(`Unrecognized directive: '${cmd}'. Type 'help' for command syntax.`, 'WARNING', 'SYSTEM');
    }
  };

  // Mobile Touch Swipe Handling (Ignoring games and canvas)
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('.touch-none') || target.closest('canvas') || target.closest('button') || target.closest('input'))) {
      setTouchStartX(null);
      return;
    }
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('.touch-none') || target.closest('canvas') || target.closest('button') || target.closest('input'))) {
      setTouchStartX(null);
      return;
    }
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > 90) {
      const tabs: MobileTab[] = ['CONSOLE', 'PCB', 'GEARS', 'RADAR', 'SUBSYSTEMS', 'ARCADE', 'ALL_FEED'];
      const curIdx = tabs.indexOf(activeTab);
      if (diffX > 0 && curIdx < tabs.length - 1) {
        sounds.playClick(640);
        setActiveTab(tabs[curIdx + 1]);
      } else if (diffX < 0 && curIdx > 0) {
        sounds.playClick(600);
        setActiveTab(tabs[curIdx - 1]);
      }
    }
    setTouchStartX(null);
  };

  // Periodic heartbeat
  useEffect(() => {
    if (!powerOn) return;
    const interval = setInterval(() => {
      setFluxFrequency((prev) => {
        const drift = (Math.random() - 0.5) * 0.4;
        return Math.min(100, Math.max(10, +(prev + drift).toFixed(1)));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [powerOn]);

  const currentLight = LIGHT_PRESETS[currentLightPreset];

  return (
    <div
      id="smartphone-app-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen w-full text-white font-sans flex flex-col pb-24 overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgDark,
      }}
    >
      {/* Optional CRT Scanlines */}
      {scanlines && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
      )}

      {/* TOP SMARTPHONE STATUS & CONTROL BAR (Hidden during Fullscreen Arcade Mode) */}
      {!isArcadeFullscreen && (
        <header
          className="sticky top-0 z-40 border-b px-3.5 py-2.5 flex items-center justify-between select-none backdrop-blur-md transition-colors duration-300"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.12)',
            backgroundColor: `${currentTheme.bgPanel}F0`,
          }}
        >
          {/* Left Branding */}
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 0 10px ${currentTheme.primary}`,
              }}
            />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-sm sm:text-base tracking-tighter text-white">AURORA</span>
                <span
                  className="text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: currentTheme.primary }}
                >
                  // {MOBILE_TABS.find((t) => t.id === activeTab)?.label || 'ALL'}
                </span>
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
                {fluxFrequency.toFixed(1)} GHz | {currentTheme.name.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-1.5">
            {/* Quick Theme Switcher Pill */}
            <button
              type="button"
              onClick={() => {
                const themeKeys = Object.keys(APP_THEMES) as AppThemeId[];
                const nextIdx = (themeKeys.indexOf(currentThemeId) + 1) % themeKeys.length;
                handleSelectTheme(themeKeys[nextIdx]);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 transition-all text-xs font-mono"
              title="Cycle Global Color Scheme Theme"
            >
              <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: currentTheme.primary }} />
              <span className="text-[9px] font-bold text-neutral-200 hidden sm:inline">{currentTheme.name.split(' ')[0]}</span>
            </button>

            {/* Quick System Diagnostics Toggle */}
            <button
              type="button"
              onClick={handleToggleDiagnostics}
              className={`p-1.5 sm:px-2 sm:py-1 rounded border text-xs font-mono flex items-center gap-1 active:scale-95 transition-all ${
                isDiagnosticsOpen
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 border-white/15 text-neutral-400 hover:text-white'
              }`}
              style={{
                borderColor: isDiagnosticsOpen ? currentTheme.primary : 'rgba(255,255,255,0.15)',
                color: isDiagnosticsOpen ? currentTheme.primary : undefined,
              }}
              title={isDiagnosticsOpen ? 'Hide System Diagnostics Telemetry' : 'Show System Diagnostics Telemetry'}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold hidden sm:inline">FPS</span>
            </button>

            {/* Quick Spectrum Switch */}
            <button
              type="button"
              onClick={handleCycleLight}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 transition-all text-xs font-mono"
              title="Cycle Spectrum"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentLight.primaryColor }} />
              <span className="text-[9px] font-bold text-neutral-300">{currentLight.wavelengthTHz}T</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                sounds.setEnabled(next);
                haptics.trigger('click');
              }}
              className="p-1.5 rounded bg-white/5 border border-white/15 text-neutral-300 hover:text-white active:scale-95"
              title="Sound"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {/* Settings Modal */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick(800);
                haptics.trigger('click');
                setIsSettingsOpen(true);
              }}
              className="p-1.5 rounded bg-white/5 border border-white/15 text-neutral-300 hover:text-white active:scale-95"
              title="Settings & Themes"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* QUICK HORIZONTAL SCROLLABLE TAB PILLS (Hidden during Fullscreen Arcade Mode) */}
      {!isArcadeFullscreen && (
        <div
          className="border-b px-2.5 py-2 overflow-x-auto flex items-center gap-1.5 select-none scrollbar-none transition-colors duration-300"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(5, 5, 8, 0.95)',
          }}
        >
          {MOBILE_TABS.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  sounds.playClick(680);
                  haptics.trigger('light');
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider whitespace-nowrap flex items-center gap-1.5 transition-all border shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                }`}
                style={{
                  backgroundColor: isActive ? currentTheme.primary : undefined,
                  borderColor: isActive ? currentTheme.primary : undefined,
                  boxShadow: isActive ? `0 0 10px ${currentTheme.glowRgba}` : undefined,
                }}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(720);
              haptics.trigger('click');
              setActiveTab(activeTab === 'ALL_FEED' ? 'CONSOLE' : 'ALL_FEED');
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider whitespace-nowrap flex items-center gap-1.5 transition-all border shrink-0 ${
              activeTab === 'ALL_FEED'
                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Continuous Feed</span>
          </button>
        </div>
      )}

      {/* MOBILE EXECUTIVE TELEMETRY TICKER (Hidden during Fullscreen Arcade Mode) */}
      {!isArcadeFullscreen && (
        <div className="grid grid-cols-4 gap-1 p-2 bg-[#060606] border-b border-white/10 font-mono text-center select-none">
          <div className="p-1 border border-white/5 bg-white/[0.02] rounded">
            <div className="text-[8px] text-neutral-400 uppercase">Health</div>
            <div className="text-xs font-bold text-white">{subsystems.health.integrity}%</div>
          </div>
          <div className="p-1 border border-white/5 bg-white/[0.02] rounded">
            <div className="text-[8px] text-neutral-400 uppercase">Shield</div>
            <div className="text-xs font-bold text-emerald-400">{subsystems.shield.strength}%</div>
          </div>
          <div className="p-1 border border-white/5 bg-white/[0.02] rounded">
            <div className="text-[8px] text-neutral-400 uppercase">AI Load</div>
            <div className="text-xs font-bold" style={{ color: currentTheme.primary }}>{subsystems.aiCore.load}%</div>
          </div>
          <div className="p-1 border border-white/5 bg-white/[0.02] rounded">
            <div className="text-[8px] text-neutral-400 uppercase">Radar</div>
            <div className="text-xs font-bold text-amber-400">3 Sigs</div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT (TOUCH-SIZED & 100% RESPONSIVE) */}
      <main className={`flex-1 ${isArcadeFullscreen ? 'p-0 max-w-none w-full' : 'p-2.5 sm:p-4 max-w-3xl mx-auto w-full'}`}>
        {/* TAB 1: [IMAGE 2] AURORA MACHINE HARDWARE CONSOLE */}
        {activeTab === 'CONSOLE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold" style={{ color: currentTheme.primary }}>01 // HARDWARE CHASSIS</span>
              <span className="text-neutral-400">TOUCH CONTROLS</span>
            </div>
            <div className="flex justify-center">
              <AuroraMachineConsole
                powerOn={powerOn}
                onTogglePower={() => setPowerOn(!powerOn)}
                fluxFrequency={fluxFrequency}
                onFluxChange={(val) => setFluxFrequency(val)}
                currentLight={currentLight}
                onCycleLight={handleCycleLight}
                onRunSimulation={handleRunSimulation}
                isSimulating={isSimulating}
                onOpenSettings={() => setIsSettingsOpen(true)}
                soundEnabled={soundEnabled}
                onToggleSound={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  sounds.setEnabled(next);
                  haptics.trigger('click');
                }}
                theme={currentTheme}
              />
            </div>
          </div>
        )}

        {/* TAB 2: [IMAGE 1] LIGHT-PROTOCOL PCB MATRIX (REF_0912) */}
        {activeTab === 'PCB' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold" style={{ color: currentTheme.primary }}>02 // LIGHT-PROTOCOL PCB</span>
              <button
                type="button"
                onClick={handleOverchargeCore}
                className="text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded active:scale-95 transition-all"
                style={{
                  backgroundColor: currentTheme.primary,
                  boxShadow: `0 0 8px ${currentTheme.glowRgba}`,
                }}
              >
                Overcharge
              </button>
            </div>
            <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg overflow-x-auto">
              <LightProtocolPCB
                powerOn={powerOn}
                subsystems={subsystems}
                currentLight={currentLight}
                onSelectNode={(node) => setActiveNodeModal(node)}
                onOverchargeCore={handleOverchargeCore}
                activeNode={activeNodeModal}
                fluxFrequency={fluxFrequency}
                theme={currentTheme}
              />
            </div>
          </div>
        )}

        {/* TAB 3: [IMAGE 3 PART 1] 3-LAYER HOLOGRAPHIC GEAR ENGINE (REF_0913) */}
        {activeTab === 'GEARS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold" style={{ color: currentTheme.primary }}>03 // HOLOGRAPHIC GEAR ENGINE</span>
              <span className="text-neutral-400 font-mono">{(fluxFrequency * 18.5).toFixed(0)} RPM</span>
            </div>
            <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg">
              <HologramGearEngine
                powerOn={powerOn}
                fluxFrequency={fluxFrequency}
                currentLight={currentLight}
                engineState={hologramState}
                onUpdateState={(st) => setHologramState((prev) => ({ ...prev, ...st }))}
                theme={currentTheme}
              />
            </div>
          </div>
        )}

        {/* TAB 4: [IMAGE 3 PART 2] TACTICAL TELEMETRY RADAR HUD */}
        {activeTab === 'RADAR' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold animate-pulse" style={{ color: currentTheme.primary }}>04 // TACTICAL RADAR HUD</span>
              <span className="text-neutral-400 font-mono">SECTOR 07</span>
            </div>
            <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg">
              <TacticalTelemetryHUD
                powerOn={powerOn}
                telemetry={telemetry}
                onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
                selectedAnomaly={selectedAnomaly}
                terminalLogs={terminalLogs}
                fluxFrequency={fluxFrequency}
                theme={currentTheme}
              />
            </div>
          </div>
        )}

        {/* TAB 5: 8 SUBSYSTEMS ARCHIVE */}
        {activeTab === 'SUBSYSTEMS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold" style={{ color: currentTheme.primary }}>05 // 8 SUBSYSTEMS MATRIX</span>
              <button
                type="button"
                onClick={handleOverchargeCore}
                className="bg-white text-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded active:scale-95 transition-all"
              >
                Boost All
              </button>
            </div>
            <SubsystemsArchiveView
              subsystems={subsystems}
              currentLight={currentLight}
              powerOn={powerOn}
              onBoostSubsystem={handleBoostSubsystem}
              onSelectSubsystem={(id) => setActiveNodeModal(id)}
            />
          </div>
        )}

        {/* TAB 6: 4 SIMULATION GAMES & TERMINAL CLI */}
        {activeTab === 'ARCADE' && (
          <div className="space-y-5">
            {!isArcadeFullscreen && (
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
                <span className="font-bold" style={{ color: currentTheme.primary }}>06 // CYBER ARCADE & REPL</span>
                <span className="text-neutral-400 font-mono">TOUCH READY</span>
              </div>
            )}
            <MiniGamesSuite
              powerOn={powerOn}
              fluxFrequency={fluxFrequency}
              isFullscreen={isArcadeFullscreen}
              onToggleFullscreen={(fs) => setIsArcadeFullscreen(fs)}
              onExitToMenu={() => {
                setIsArcadeFullscreen(false);
                setActiveTab('CONSOLE');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            {!isArcadeFullscreen && (
              <TerminalArchiveView
                logs={terminalLogs}
                onClearLogs={() => setTerminalLogs([])}
                onExecuteCommand={handleExecuteCommand}
              />
            )}
          </div>
        )}

        {/* TAB 7: ROMAN MOSAIC & PIXEL CYPHER ENGINE */}
        {activeTab === 'MOSAIC' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-mono text-xs">
              <span className="font-bold" style={{ color: currentTheme.primary }}>07 // ROMAN MOSAIC & PIXEL CYPHER</span>
              <span className="text-neutral-400 font-mono">300/200/150 HIERARCHY</span>
            </div>
            <RomanMosaicMatrixEngine
              powerOn={powerOn}
              fluxFrequency={fluxFrequency}
              theme={currentTheme}
            />
          </div>
        )}

        {/* CONTINUOUS FEED (ALL MODULES STACKED VERTICALLY) */}
        {activeTab === 'ALL_FEED' && (
          <div className="space-y-8">
            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                01 // HARDWARE CHASSIS
              </h2>
              <div className="flex justify-center">
                <AuroraMachineConsole
                  powerOn={powerOn}
                  onTogglePower={() => setPowerOn(!powerOn)}
                  fluxFrequency={fluxFrequency}
                  onFluxChange={(val) => setFluxFrequency(val)}
                  currentLight={currentLight}
                  onCycleLight={handleCycleLight}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    sounds.setEnabled(next);
                    haptics.trigger('click');
                  }}
                  theme={currentTheme}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                02 // LIGHT-PROTOCOL PCB MATRIX
              </h2>
              <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg overflow-x-auto">
                <LightProtocolPCB
                  powerOn={powerOn}
                  subsystems={subsystems}
                  currentLight={currentLight}
                  onSelectNode={(node) => setActiveNodeModal(node)}
                  onOverchargeCore={handleOverchargeCore}
                  activeNode={activeNodeModal}
                  fluxFrequency={fluxFrequency}
                  theme={currentTheme}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                03 // HOLOGRAPHIC GEAR ENGINE
              </h2>
              <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg">
                <HologramGearEngine
                  powerOn={powerOn}
                  fluxFrequency={fluxFrequency}
                  currentLight={currentLight}
                  engineState={hologramState}
                  onUpdateState={(st) => setHologramState((prev) => ({ ...prev, ...st }))}
                  theme={currentTheme}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                04 // TACTICAL RADAR HUD
              </h2>
              <div className="border border-white/10 bg-neutral-950/80 p-2 sm:p-4 rounded-lg">
                <TacticalTelemetryHUD
                  powerOn={powerOn}
                  telemetry={telemetry}
                  onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
                  selectedAnomaly={selectedAnomaly}
                  terminalLogs={terminalLogs}
                  fluxFrequency={fluxFrequency}
                  theme={currentTheme}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                05 // 8 SUBSYSTEMS MATRIX
              </h2>
              <SubsystemsArchiveView
                subsystems={subsystems}
                currentLight={currentLight}
                powerOn={powerOn}
                onBoostSubsystem={handleBoostSubsystem}
                onSelectSubsystem={(id) => setActiveNodeModal(id)}
              />
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                06 // CYBER ARCADE & REPL
              </h2>
              <MiniGamesSuite
                powerOn={powerOn}
                fluxFrequency={fluxFrequency}
                onExitToMenu={() => {
                  setActiveTab('CONSOLE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <TerminalArchiveView
                logs={terminalLogs}
                onClearLogs={() => setTerminalLogs([])}
                onExecuteCommand={handleExecuteCommand}
              />
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-mono font-bold pb-1 border-b border-white/10" style={{ color: currentTheme.primary }}>
                07 // ROMAN MOSAIC & PIXEL CYPHER
              </h2>
              <RomanMosaicMatrixEngine
                powerOn={powerOn}
                fluxFrequency={fluxFrequency}
                theme={currentTheme}
              />
            </section>
          </div>
        )}
      </main>

      {/* BOTTOM PERSISTENT SMARTPHONE NAVIGATION DOCK (Hidden during Fullscreen Arcade Mode) */}
      {!isArcadeFullscreen && (
        <nav
          aria-label="Smartphone Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-2 py-1.5 flex items-center justify-around select-none transition-colors duration-300"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.12)',
            backgroundColor: `${currentTheme.bgPanel}F8`,
          }}
        >
          {MOBILE_TABS.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  sounds.playClick(720);
                  haptics.trigger('click');
                  setActiveTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all active:scale-95 min-w-[50px] ${
                  isActive
                    ? 'font-bold bg-white/5'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                style={{
                  color: isActive ? currentTheme.primary : undefined,
                }}
              >
                <IconComp
                  className="w-5 h-5 mb-0.5"
                  style={{
                    color: isActive ? currentTheme.primary : undefined,
                    filter: isActive ? `drop-shadow(0 0 6px ${currentTheme.glowRgba})` : undefined,
                  }}
                />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* FLOATING SYSTEM DIAGNOSTICS TELEMETRY PANEL */}
      <SystemDiagnosticsPanel
        theme={currentTheme}
        powerOn={powerOn}
        fluxFrequency={fluxFrequency}
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onSelectTheme={handleSelectTheme}
      />

      {/* MODALS */}
      {/* Subsystem Detail Modal */}
      <SubsystemDetailModal
        nodeName={activeNodeModal}
        onClose={() => setActiveNodeModal(null)}
        subsystems={subsystems}
        currentLight={currentLight}
        onBoostSubsystem={handleBoostSubsystem}
      />

      {/* AI Synapse Core Modal */}
      <AICoreModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        result={simulationResult}
        isLoading={isSimulating}
        onReSimulate={() => handleRunSimulation('SIMULATE')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sounds.setEnabled(next);
        }}
        scanlines={scanlines}
        onToggleScanlines={() => setScanlines(!scanlines)}
        glowIntensity={glowIntensity}
        onGlowChange={(val) => setGlowIntensity(val)}
        overclockEnabled={overclockEnabled}
        onToggleOverclock={() => {
          setOverclockEnabled(!overclockEnabled);
          addLog(!overclockEnabled ? 'OVERCLOCK ACTIVE: Boosted synaptic throughput.' : 'Overclock disabled.', 'WARNING', 'SYSTEM');
        }}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        isDiagnosticsOpen={isDiagnosticsOpen}
        onToggleDiagnostics={handleToggleDiagnostics}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={handleToggleHaptics}
      />
    </div>
  );
}
