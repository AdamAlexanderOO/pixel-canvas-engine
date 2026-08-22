import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crosshair,
  Gauge,
  Activity,
  AlertTriangle,
  Terminal,
  ShieldAlert,
  Radio,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TelemetryState, RadarAnomaly, TerminalLog } from '../types';
import { AppThemeConfig, APP_THEMES } from '../utils/theme';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

interface TacticalTelemetryHUDProps {
  powerOn: boolean;
  telemetry: TelemetryState;
  onSelectAnomaly: (anomaly: RadarAnomaly) => void;
  selectedAnomaly: RadarAnomaly | null;
  terminalLogs: TerminalLog[];
  fluxFrequency: number;
  theme?: AppThemeConfig;
}

export const TacticalTelemetryHUD: React.FC<TacticalTelemetryHUDProps> = ({
  powerOn,
  telemetry,
  onSelectAnomaly,
  selectedAnomaly,
  terminalLogs,
  fluxFrequency,
  theme = APP_THEMES.CRIMSON_CYBERPUNK,
}) => {
  const [radarAngle, setRadarAngle] = useState(0);
  const [selectedTube, setSelectedTube] = useState<string | null>(null);
  const [activeBlipId, setActiveBlipId] = useState<string | null>(null);
  const [interceptSuccess, setInterceptSuccess] = useState<boolean>(false);
  const [lastDetectedId, setLastDetectedId] = useState<string | null>(null);
  const [scanPulseKey, setScanPulseKey] = useState<number>(0);
  const prevAnomaliesCountRef = React.useRef(telemetry.radarAnomalies.length);

  // Radar beam sweep animation
  useEffect(() => {
    if (!powerOn) return;
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [powerOn]);

  // Framer Motion Scan Pulse Trigger when signatures change or are detected
  useEffect(() => {
    if (!powerOn || telemetry.radarAnomalies.length === 0) return;

    // Detect if new anomaly was added or refreshed
    if (telemetry.radarAnomalies.length !== prevAnomaliesCountRef.current) {
      setScanPulseKey((k) => k + 1);
      const newest = telemetry.radarAnomalies[telemetry.radarAnomalies.length - 1];
      if (newest) {
        setLastDetectedId(newest.id);
        setActiveBlipId(newest.id);
        sounds.playRadarPing();
        haptics.trigger('radar');
        setTimeout(() => setActiveBlipId(null), 2400);
      }
      prevAnomaliesCountRef.current = telemetry.radarAnomalies.length;
    }
  }, [powerOn, telemetry.radarAnomalies]);

  // Periodic automatic anomaly ping trigger
  useEffect(() => {
    if (!powerOn || telemetry.radarAnomalies.length === 0) return;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * telemetry.radarAnomalies.length);
      const target = telemetry.radarAnomalies[randomIndex];
      setActiveBlipId(target.id);
      setLastDetectedId(target.id);
      setScanPulseKey((k) => k + 1);
      sounds.playRadarPing();
      setTimeout(() => setActiveBlipId(null), 2200);
    }, 4500);
    return () => clearInterval(interval);
  }, [powerOn, telemetry.radarAnomalies]);

  const handleAnomalyClick = (anomaly: RadarAnomaly) => {
    sounds.playRadarPing();
    haptics.trigger('radar');
    setActiveBlipId(anomaly.id);
    setLastDetectedId(anomaly.id);
    setScanPulseKey((k) => k + 1);
    onSelectAnomaly(anomaly);
  };

  const handleInterceptTarget = () => {
    sounds.playSimulatePulse();
    haptics.trigger('warning');
    setInterceptSuccess(true);
    setTimeout(() => setInterceptSuccess(false), 2200);
  };

  return (
    <div
      id="tactical-hud-console"
      className="relative w-full h-full min-h-[500px] border p-4 sm:p-5 overflow-hidden flex flex-col justify-between select-none font-mono"
      style={{
        backgroundColor: theme.bgDark,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Background HUD Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Header & Tactical Coordinates */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crosshair
            className="w-4 h-4 animate-spin"
            style={{ color: theme.primary, animationDuration: '12s' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-white">
                TACTICAL TELEMETRY // HUD COMMAND
              </span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-bold rounded"
                style={{ backgroundColor: theme.badgeBg, color: theme.primary }}
              >
                RADAR ACTIVE
              </span>
            </div>
            <div className="text-[9px] font-mono text-neutral-400">
              SECTOR 07-GRID-ALPHA | FREQ: {(fluxFrequency * 12.4).toFixed(1)} MHz
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-white">
            GRID: ACTIVE
          </span>
          <span
            className="px-2 py-0.5 border"
            style={{
              borderColor: theme.borderPrimary,
              backgroundColor: theme.badgeBg,
              color: theme.primary,
            }}
          >
            ANOMALIES: {telemetry.radarAnomalies.length}
          </span>
        </div>
      </div>

      {/* Main HUD Body: 3-Column Layout */}
      <div className="relative z-10 my-3 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column: Radial Gauges + Plasma Vials */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Radial Metric Gauges */}
          <div className="border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-mono text-white font-bold mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span>FLUX HARMONICS</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Gauge 45 */}
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="113"
                      strokeDashoffset={powerOn ? '62' : '113'}
                      strokeLinecap="square"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-black text-white">45</span>
                </div>
                <span className="text-[8px] font-mono text-neutral-400 mt-1">PRIMARY</span>
              </div>

              {/* Gauge 38 */}
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      fill="none"
                      stroke={theme.primary}
                      strokeWidth="2.5"
                      strokeDasharray="113"
                      strokeDashoffset={powerOn ? '70' : '113'}
                      strokeLinecap="square"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-black" style={{ color: theme.primary }}>
                    38
                  </span>
                </div>
                <span className="text-[8px] font-mono text-neutral-400 mt-1">ENTROPY</span>
              </div>

              {/* Gauge 33 */}
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      fill="none"
                      stroke="#a3a3a3"
                      strokeWidth="2.5"
                      strokeDasharray="113"
                      strokeDashoffset={powerOn ? '75' : '113'}
                      strokeLinecap="square"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-black text-neutral-300">33</span>
                </div>
                <span className="text-[8px] font-mono text-neutral-400 mt-1">CAPACITOR</span>
              </div>
            </div>
          </div>

          {/* Bio-Nutrient Plasma Test Tubes */}
          <div className="border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-mono text-white font-bold mb-2 flex items-center justify-between">
              <span>PLASMA VIALS</span>
              <span className="text-[8px] text-neutral-400">CHAMBER 03</span>
            </div>
            <div className="flex items-center justify-around h-20">
              {telemetry.testTubes.map((tube) => (
                <div
                  key={tube.id}
                  onClick={() => {
                    sounds.playClick(1100);
                    haptics.trigger('click');
                    setSelectedTube(tube.label);
                  }}
                  className="cursor-pointer flex flex-col items-center group"
                >
                  <div className="relative w-5 h-16 border border-white/20 bg-neutral-950 p-0.5 overflow-hidden flex flex-col justify-end">
                    <motion.div
                      className="w-full transition-all"
                      style={{
                        backgroundColor: tube.id === 'tube-1' ? theme.primary : tube.id === 'tube-2' ? '#ffffff' : theme.accent,
                      }}
                      animate={{
                        height: powerOn ? `${tube.level}%` : '10%',
                      }}
                    />
                    <div className="absolute inset-y-1 right-0.5 flex flex-col justify-between opacity-40 pointer-events-none">
                      <div className="w-1 h-[1px] bg-white" />
                      <div className="w-1 h-[1px] bg-white" />
                      <div className="w-1 h-[1px] bg-white" />
                    </div>
                  </div>
                  <span className="text-[7px] font-mono text-neutral-400 mt-1">{tube.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Tactical Radar with Framer Motion Warning Blips */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center border border-white/10 bg-[#070707] p-3 relative overflow-hidden">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-white/20 bg-[#050505] flex items-center justify-center">
            {/* Concentric Range Rings */}
            <div className="absolute w-48 h-48 rounded-full border border-white/10" />
            <div className="absolute w-32 h-32 rounded-full border border-white/10" />
            <div className="absolute w-16 h-16 rounded-full border border-white/15" />

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-white/10" />
            <div className="absolute h-full w-[1px] bg-white/10" />

            {/* Background Map Projection */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" />
              <path d="M 60 70 Q 80 50 100 65 T 140 80 T 120 120 T 70 110 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
              <path d="M 90 120 Q 110 140 130 160 T 100 170 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
            </svg>

            {/* Sweeping Radar Beam */}
            {powerOn && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(from ${radarAngle}deg, ${theme.glowRgba} 0deg, transparent 65deg)`,
                }}
              />
            )}

            {/* Framer Motion Full-Diameter Radar Scan Pulse Wave */}
            <AnimatePresence>
              {powerOn && (
                <motion.div
                  key={`scan-pulse-${scanPulseKey}`}
                  initial={{ scale: 0.1, opacity: 0.8, borderWidth: '3px' }}
                  animate={{ scale: 1.05, opacity: 0, borderWidth: '1px' }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border pointer-events-none z-10"
                  style={{ borderColor: theme.primary }}
                />
              )}
            </AnimatePresence>

            {/* Radar Anomalies Blips with Framer Motion Warning Pulse Waves & Lock-on Sequences */}
            {telemetry.radarAnomalies.map((anomaly) => {
              const rad = (anomaly.angle * Math.PI) / 180;
              const dist = anomaly.radius * 0.9;
              const x = Math.cos(rad) * dist;
              const y = Math.sin(rad) * dist;

              const isSelected = selectedAnomaly?.id === anomaly.id;
              const isBlipActive = activeBlipId === anomaly.id || isSelected;
              const isNewDetection = lastDetectedId === anomaly.id;

              return (
                <div
                  key={anomaly.id}
                  onClick={() => handleAnomalyClick(anomaly)}
                  className="absolute cursor-pointer z-30"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  {/* Framer Motion Scan Wave Ripple & Detection Pulse */}
                  {isBlipActive && (
                    <>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 1 }}
                        animate={{ scale: [0.6, 3.2], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeOut' }}
                        className="absolute -inset-2 rounded-full border pointer-events-none"
                        style={{ borderColor: theme.primary }}
                      />
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0.8 }}
                        animate={{ scale: [0.6, 4.6], opacity: [0.8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, ease: 'easeOut' }}
                        className="absolute -inset-2 rounded-full border border-dashed pointer-events-none"
                        style={{ borderColor: theme.accent }}
                      />
                    </>
                  )}

                  {/* Smooth Anomaly Lock-On Animation Sequence */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 2.8, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 1.8, opacity: 0, rotate: 45 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="absolute -inset-3.5 pointer-events-none flex items-center justify-center"
                      >
                        {/* Outer rotating brackets */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                          className="w-9 h-9 border border-cyan-400/80 relative"
                        >
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300" />
                        </motion.div>

                        {/* Inner targeting reticle cross */}
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.15, duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                          <div className="absolute w-4 h-[1px] bg-cyan-300/80" />
                          <div className="absolute h-4 w-[1px] bg-cyan-300/80" />
                        </motion.div>

                        {/* Lock-on Text Indicator */}
                        <motion.span
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="absolute -top-4 text-[8px] font-mono font-bold tracking-widest text-cyan-300 bg-black/90 px-1 py-0.2 border border-cyan-400/50 whitespace-nowrap"
                        >
                          LOCK_ON_ACQUIRED
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Core Anomaly Dot */}
                  <motion.div
                    whileHover={{ scale: 1.35 }}
                    whileTap={{ scale: 0.85 }}
                    animate={
                      isNewDetection
                        ? { scale: [1, 1.6, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      anomaly.severity === 'CRITICAL'
                        ? 'bg-red-500 ring-2 ring-red-400/80 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                        : anomaly.severity === 'ELEVATED'
                        ? 'bg-amber-400 ring-1 ring-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                        : 'bg-cyan-400 ring-1 ring-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  </motion.div>

                  {/* Floating Tag */}
                  <span
                    className="absolute top-4 -left-6 text-[8px] font-mono font-bold text-white px-1 border whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.85)',
                      borderColor: isSelected ? theme.primary : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {anomaly.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Radar Bottom Readout */}
          <div className="w-full flex items-center justify-between text-[9px] font-mono text-neutral-400 mt-2 px-2">
            <span>BEARING: {radarAngle.toFixed(0)}°</span>
            <span>ZOOM: 100X</span>
            <span style={{ color: theme.primary }}>TRACK: ACTIVE SCAN</span>
          </div>
        </div>

        {/* Right Column: Hex Node Matrix & Telemetry Logs */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Hexagonal Node Diagnostics Cluster */}
          <div className="border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-mono text-white font-bold mb-2 flex items-center justify-between">
              <span>HEX NODE MATRIX</span>
              <span className="text-[8px]" style={{ color: theme.primary }}>
                9/9 ONLINE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 place-items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((nodeNum) => (
                <button
                  type="button"
                  key={nodeNum}
                  onClick={() => {
                    sounds.playClick(600 + nodeNum * 60);
                    haptics.trigger('click');
                  }}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-[9px] font-bold cursor-pointer transition-all ${
                    powerOn
                      ? 'border border-white/20 bg-white/5 text-white hover:bg-white/20'
                      : 'border border-white/5 bg-neutral-950 text-neutral-600'
                  }`}
                >
                  N-0{nodeNum}
                </button>
              ))}
            </div>
          </div>

          {/* Live Streaming Data Log */}
          <div className="border border-white/10 bg-neutral-950 p-2.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between text-[9px] font-mono text-white pb-1 border-b border-white/10 mb-1.5">
              <div className="flex items-center gap-1">
                <Terminal className="w-3 h-3" style={{ color: theme.primary }} />
                <span>TERMINAL LOGS</span>
              </div>
              <span style={{ color: theme.primary }}>LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-28 space-y-1 font-mono text-[8px] text-neutral-300 scrollbar-thin">
              {terminalLogs.slice(-6).map((log) => (
                <div key={log.id} className="leading-tight">
                  <span className="text-neutral-500">[{log.timestamp}]</span>{' '}
                  <span
                    className={
                      log.type === 'CRITICAL'
                        ? 'text-red-400 font-bold'
                        : log.type === 'WARNING'
                        ? 'text-amber-300'
                        : 'text-neutral-400'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Anomaly Framer Motion Warning Banner with Intercept Action */}
      <AnimatePresence>
        {selectedAnomaly && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-white shadow-xl"
            style={{
              backgroundColor: 'rgba(15, 10, 15, 0.92)',
              borderColor: theme.borderPrimary,
              boxShadow: `0 0 20px ${theme.glowRgba}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded border flex items-center justify-center animate-pulse"
                style={{ backgroundColor: theme.badgeBg, borderColor: theme.borderPrimary }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: theme.primary }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-wider text-white">
                    TARGET: {selectedAnomaly.label}
                  </span>
                  <span
                    className="px-1.5 py-0.2 text-[8px] font-bold rounded uppercase"
                    style={{
                      backgroundColor:
                        selectedAnomaly.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
                      color: selectedAnomaly.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
                    }}
                  >
                    {selectedAnomaly.severity} ALERT
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  COORDS: {selectedAnomaly.coordinates} | SIGNATURE: {selectedAnomaly.signature} | BEARING: {selectedAnomaly.angle}°
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleInterceptTarget}
                className="px-3 py-1.5 border font-bold text-[10px] uppercase tracking-wider rounded transition-all active:scale-95 flex items-center gap-1.5"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: '#000000',
                  boxShadow: `0 0 12px ${theme.glowRgba}`,
                }}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{interceptSuccess ? 'LOCK ENGAGED' : 'INTERCEPT TARGET'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
