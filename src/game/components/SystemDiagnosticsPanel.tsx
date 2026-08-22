import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Cpu,
  Layers,
  Zap,
  RotateCcw,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  X,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppThemeConfig } from '../utils/theme';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

interface SystemDiagnosticsPanelProps {
  theme: AppThemeConfig;
  powerOn: boolean;
  fluxFrequency: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme?: (themeId: any) => void;
}

export const SystemDiagnosticsPanel: React.FC<SystemDiagnosticsPanelProps> = ({
  theme,
  powerOn,
  fluxFrequency,
  isOpen,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [targetFpsCap, setTargetFpsCap] = useState<'UNLIMITED' | '60FPS' | '30FPS'>('60FPS');

  // Real-time Telemetry Metrics
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [minFps, setMinFps] = useState<number>(60);
  const [maxFps, setMaxFps] = useState<number>(60);
  const [avgFps, setAvgFps] = useState<number>(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>(new Array(30).fill(60));

  // Memory Metrics (MB)
  const [usedHeapMb, setUsedHeapMb] = useState<number>(48.5);
  const [totalHeapMb, setTotalHeapMb] = useState<number>(72.0);
  const [heapLimitMb, setHeapLimitMb] = useState<number>(2048);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsAccumulatorRef = useRef<number[]>([]);
  const animIdRef = useRef<number>(0);

  // Measure Real-Time FPS and Frame-Time using requestAnimationFrame loop
  useEffect(() => {
    let lastFrameTimestamp = performance.now();

    const measureLoop = (now: number) => {
      const delta = now - lastFrameTimestamp;
      lastFrameTimestamp = now;

      frameCountRef.current++;

      // Update instantaneous frame time
      if (delta > 0 && delta < 200) {
        setFrameTimeMs(+delta.toFixed(1));
      }

      // Update aggregate FPS calculations every 250ms for stability
      if (now - lastTimeRef.current >= 250) {
        const measuredFps = Math.min(144, Math.max(1, Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))));
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        setFps(measuredFps);
        fpsAccumulatorRef.current.push(measuredFps);
        if (fpsAccumulatorRef.current.length > 60) {
          fpsAccumulatorRef.current.shift();
        }

        const sum = fpsAccumulatorRef.current.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / fpsAccumulatorRef.current.length);
        setAvgFps(avg);

        setMinFps((prev) => Math.min(prev, measuredFps));
        setMaxFps((prev) => Math.max(prev, measuredFps));

        setFpsHistory((prev) => [...prev.slice(1), measuredFps]);

        // Query real memory telemetry if supported
        const perf = performance as any;
        if (perf && perf.memory) {
          const used = +(perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
          const total = +(perf.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1);
          const limit = Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024));
          setUsedHeapMb(used);
          setTotalHeapMb(total);
          setHeapLimitMb(limit);
        } else {
          // Estimated memory baseline based on flux load and active geometries
          const estimated = +(42.5 + (fluxFrequency / 100) * 8.4 + Math.sin(now / 2000) * 1.5).toFixed(1);
          setUsedHeapMb(estimated);
          setTotalHeapMb(68.0);
        }
      }

      animIdRef.current = requestAnimationFrame(measureLoop);
    };

    animIdRef.current = requestAnimationFrame(measureLoop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [fluxFrequency]);

  const handleResetCounters = () => {
    sounds.playClick(600);
    haptics.trigger('click');
    setMinFps(fps);
    setMaxFps(fps);
    setAvgFps(fps);
    fpsAccumulatorRef.current = [fps];
  };

  const handleCopyTelemetry = () => {
    sounds.playClick(880);
    haptics.trigger('success');
    const report = `=== AURORA CYBER-DECK TELEMETRY ===
Timestamp: ${new Date().toISOString()}
Theme: ${theme.name}
Power State: ${powerOn ? 'ONLINE' : 'STANDBY'}
Flux Frequency: ${fluxFrequency.toFixed(1)} GHz
FPS: ${fps} (Avg: ${avgFps} | Min: ${minFps} | Max: ${maxFps})
Frame Time: ${frameTimeMs} ms
JS Heap Used: ${usedHeapMb} MB / ${totalHeapMb} MB (Limit: ${heapLimitMb} MB)
Memory Utilization: ${((usedHeapMb / totalHeapMb) * 100).toFixed(1)}%
Cap Target: ${targetFpsCap}
===================================`;

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  // FPS Color Logic
  const fpsColor = fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <motion.aside
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      id="system-diagnostics-floating-panel"
      aria-label="System Diagnostics"
      className={`fixed bottom-4 right-4 z-50 font-mono select-none border transition-all duration-300 ${
        isMinimized ? 'w-64' : 'w-80 sm:w-96'
      }`}
      style={{
        backgroundColor: 'rgba(8, 8, 12, 0.96)',
        borderColor: theme.borderPrimary,
        boxShadow: `0 10px 35px rgba(0, 0, 0, 0.85), 0 0 20px ${theme.glowRgba}`,
      }}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b cursor-move"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.primary }} />
          <span className="text-xs font-black tracking-widest text-white uppercase">
            SYSTEM DIAGNOSTICS
          </span>
          <span
            className="px-1.5 py-0.2 text-[9px] font-bold rounded"
            style={{ backgroundColor: theme.badgeBg, color: theme.primary }}
          >
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              sounds.playClick(700);
              haptics.trigger('light');
              setIsMinimized(!isMinimized);
            }}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand Telemetry' : 'Minimize Telemetry'}
            aria-label={isMinimized ? 'Expand Telemetry' : 'Minimize Telemetry'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(600);
              haptics.trigger('click');
              onClose();
            }}
            className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
            title="Close Diagnostics Panel"
            aria-label="Close Diagnostics Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Minimized Pill View */}
      {isMinimized ? (
        <div className="p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">FPS:</span>
            <span className="font-black text-sm" style={{ color: fpsColor }}>
              {fps}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">FRAME:</span>
            <span className="font-bold text-white">{frameTimeMs}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">HEAP:</span>
            <span className="font-bold text-cyan-300">{usedHeapMb}MB</span>
          </div>
        </div>
      ) : (
        /* Full Telemetry Body */
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Main Primary Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* FPS Gauge Box */}
            <div className="p-2 border border-white/10 bg-white/[0.02] rounded">
              <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Frame Rate</div>
              <div className="text-xl font-black mt-0.5" style={{ color: fpsColor }}>
                {fps} <span className="text-[10px] font-normal text-neutral-400">FPS</span>
              </div>
              <div className="text-[8px] text-neutral-500 mt-0.5">
                AVG: {avgFps} | MIN: {minFps}
              </div>
            </div>

            {/* Frame Time Box */}
            <div className="p-2 border border-white/10 bg-white/[0.02] rounded">
              <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Frame Time</div>
              <div className="text-xl font-black mt-0.5 text-white">
                {frameTimeMs} <span className="text-[10px] font-normal text-neutral-400">ms</span>
              </div>
              <div className="text-[8px] text-neutral-500 mt-0.5">
                TARGET: {(1000 / (targetFpsCap === '30FPS' ? 30 : 60)).toFixed(1)}ms
              </div>
            </div>

            {/* Memory JS Heap Box */}
            <div className="p-2 border border-white/10 bg-white/[0.02] rounded">
              <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">JS Heap Memory</div>
              <div className="text-xl font-black mt-0.5 text-cyan-400">
                {usedHeapMb} <span className="text-[10px] font-normal text-neutral-400">MB</span>
              </div>
              <div className="text-[8px] text-neutral-500 mt-0.5">
                ALLOC: {totalHeapMb}MB
              </div>
            </div>
          </div>

          {/* Real-time FPS Sparkline Waveform */}
          <div className="p-2.5 border border-white/10 bg-black/60 rounded">
            <div className="flex items-center justify-between text-[9px] font-bold text-neutral-400 mb-1.5">
              <span>ROLLING FPS TELEMETRY (LAST 30 TICKS)</span>
              <span style={{ color: fpsColor }}>{fps} FPS CURRENT</span>
            </div>
            <div className="h-10 w-full flex items-end gap-1 pt-1">
              {fpsHistory.map((val, idx) => {
                const heightPercent = Math.min(100, Math.max(10, (val / 75) * 100));
                const barColor = val >= 55 ? theme.primary : val >= 30 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-sm transition-all duration-150"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: barColor,
                      opacity: idx === fpsHistory.length - 1 ? 1 : 0.4 + (idx / fpsHistory.length) * 0.5,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Engine Subsystems & Memory Utilization Progress Bar */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-neutral-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>HEAP MEMORY RESERVATION</span>
                </span>
                <span>{((usedHeapMb / totalHeapMb) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 border border-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (usedHeapMb / totalHeapMb) * 100)}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </div>
            </div>

            {/* Simulation Telemetry Context */}
            <div className="grid grid-cols-2 gap-2 text-[10px] p-2 bg-white/[0.02] border border-white/10 rounded">
              <div>
                <span className="text-neutral-500">ENGINE STATE:</span>{' '}
                <span className="font-bold text-emerald-400">{powerOn ? '3D ACCELERATED' : 'STANDBY'}</span>
              </div>
              <div>
                <span className="text-neutral-500">FLUX HARMONIC:</span>{' '}
                <span className="font-bold text-white">{fluxFrequency.toFixed(1)} GHz</span>
              </div>
              <div>
                <span className="text-neutral-500">GEOMETRY CACHE:</span>{' '}
                <span className="font-bold text-amber-400">14 BUFFERS</span>
              </div>
              <div>
                <span className="text-neutral-500">THEME PALETTE:</span>{' '}
                <span className="font-bold" style={{ color: theme.primary }}>{theme.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Cap, Reset, Copy Snapshot */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 gap-2">
            {/* FPS Target Cap Toggle */}
            <div className="flex items-center gap-1 bg-neutral-900 border border-white/10 p-0.5 rounded">
              {(['UNLIMITED', '60FPS', '30FPS'] as const).map((cap) => (
                <button
                  type="button"
                  key={cap}
                  onClick={() => {
                    sounds.playClick(720);
                    haptics.trigger('click');
                    setTargetFpsCap(cap);
                  }}
                  className={`px-1.5 py-0.5 text-[8px] font-bold rounded transition-all ${
                    targetFpsCap === cap
                      ? 'bg-white/20 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>

            {/* Reset & Copy */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetCounters}
                className="p-1.5 border border-white/15 bg-white/5 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-all"
                title="Reset Min/Max Counters"
                aria-label="Reset Min/Max Counters"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleCopyTelemetry}
                className="px-2 py-1 border border-white/20 bg-white/10 hover:bg-white/20 rounded text-[9px] font-bold text-white flex items-center gap-1 transition-all active:scale-95"
                title="Copy Telemetry to Clipboard"
                aria-label="Copy Telemetry to Clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'SNAPSHOT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};
