import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Eye,
  Zap,
  Palette,
  Activity,
  Smartphone,
  Check,
} from 'lucide-react';
import { AppThemeId, AppThemeConfig, APP_THEMES } from '../utils/theme';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  scanlines: boolean;
  onToggleScanlines: () => void;
  glowIntensity: number;
  onGlowChange: (val: number) => void;
  overclockEnabled: boolean;
  onToggleOverclock: () => void;
  currentTheme: AppThemeConfig;
  onSelectTheme: (themeId: AppThemeId) => void;
  isDiagnosticsOpen: boolean;
  onToggleDiagnostics: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  scanlines,
  onToggleScanlines,
  glowIntensity,
  onGlowChange,
  overclockEnabled,
  onToggleOverclock,
  currentTheme,
  onSelectTheme,
  isDiagnosticsOpen,
  onToggleDiagnostics,
  hapticsEnabled,
  onToggleHaptics,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg border bg-[#0A0A0A] p-5 sm:p-6 text-neutral-200 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{
            borderColor: currentTheme.borderPrimary,
            boxShadow: `0 0 35px ${currentTheme.glowRgba}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5" style={{ color: currentTheme.primary }} />
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-wider text-white">
                  AURORA MACHINE // SETTINGS & THEMES
                </h3>
                <div className="text-[10px] text-neutral-400">HARDWARE DECK CONFIGURATION</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playClick(600);
                haptics.trigger('click');
                onClose();
              }}
              className="p-1.5 border border-white/20 bg-white/5 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Sections */}
          <div className="my-4 space-y-4 text-xs">
            {/* Color Scheme Theme Selector */}
            <div className="p-3 border border-white/10 bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Palette className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  <span>COLOR SCHEME THEME</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color: currentTheme.primary }}>
                  {currentTheme.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {(Object.keys(APP_THEMES) as AppThemeId[]).map((themeKey) => {
                  const th = APP_THEMES[themeKey];
                  const isSelected = currentTheme.id === themeKey;
                  return (
                    <button
                      type="button"
                      key={themeKey}
                      onClick={() => {
                        sounds.playClick(880);
                        haptics.trigger('medium');
                        onSelectTheme(themeKey);
                      }}
                      className={`p-2 border text-left rounded transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white/10'
                          : 'bg-black/40 border-white/10 hover:border-white/30'
                      }`}
                      style={{
                        borderColor: isSelected ? th.primary : undefined,
                        boxShadow: isSelected ? `0 0 12px ${th.glowRgba}` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black"
                            style={{ backgroundColor: th.primary }}
                          />
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: th.accent }}
                          />
                        </div>
                        {isSelected && <Check className="w-3 h-3" style={{ color: th.primary }} />}
                      </div>
                      <div className="text-[10px] font-bold text-white truncate">{th.name.split(' ')[0]}</div>
                      <div className="text-[8px] text-neutral-400 truncate">{th.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System Diagnostics Floating HUD Toggle */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" style={{ color: currentTheme.primary }} />
                <div>
                  <div className="font-bold text-white">SYSTEM DIAGNOSTICS HUD</div>
                  <div className="text-[10px] text-neutral-400">Real-time FPS telemetry & JS memory monitor</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick(800);
                  haptics.trigger('click');
                  onToggleDiagnostics();
                }}
                className={`px-3 py-1 border font-bold text-xs transition-all ${
                  isDiagnosticsOpen
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-500'
                }`}
                style={{
                  borderColor: isDiagnosticsOpen ? currentTheme.primary : undefined,
                  color: isDiagnosticsOpen ? currentTheme.primary : undefined,
                }}
              >
                {isDiagnosticsOpen ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>

            {/* Tactile Haptic Feedback Toggle */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" style={{ color: currentTheme.primary }} />
                <div>
                  <div className="font-bold text-white">TACTILE HAPTIC VIBRATIONS</div>
                  <div className="text-[10px] text-neutral-400">Physical click pulses via navigator.vibrate()</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick(800);
                  onToggleHaptics();
                }}
                className={`px-3 py-1 border font-bold text-xs transition-all ${
                  hapticsEnabled
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-500'
                }`}
                style={{
                  borderColor: hapticsEnabled ? currentTheme.primary : undefined,
                  color: hapticsEnabled ? currentTheme.primary : undefined,
                }}
              >
                {hapticsEnabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                )}
                <div>
                  <div className="font-bold text-white">TACTILE AUDIO SYNTH</div>
                  <div className="text-[10px] text-neutral-400">Relay clicks, quantum pulses, servo whines</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick(800);
                  haptics.trigger('click');
                  onToggleSound();
                }}
                className={`px-3 py-1 border font-bold text-xs transition-all ${
                  soundEnabled
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-500'
                }`}
              >
                {soundEnabled ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>

            {/* CRT Scanline Overlay Toggle */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4" style={{ color: currentTheme.primary }} />
                <div>
                  <div className="font-bold text-white">CRT SCANLINES & PHOSPHOR</div>
                  <div className="text-[10px] text-neutral-400">Retro-futuristic monitor scanline texture</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick(800);
                  haptics.trigger('click');
                  onToggleScanlines();
                }}
                className={`px-3 py-1 border font-bold text-xs transition-all ${
                  scanlines
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-500'
                }`}
              >
                {scanlines ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Overclock Toggle */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4" style={{ color: currentTheme.primary }} />
                <div>
                  <div className="font-bold text-white">OVERCLOCK GEAR TRAIN</div>
                  <div className="text-[10px] text-neutral-400">Boost RPM & AI Core synaptic throughput</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playSimulatePulse();
                  haptics.trigger('heavy');
                  onToggleOverclock();
                }}
                className={`px-3 py-1 border font-bold text-xs transition-all ${
                  overclockEnabled
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-500'
                }`}
                style={{
                  borderColor: overclockEnabled ? currentTheme.primary : undefined,
                  color: overclockEnabled ? currentTheme.primary : undefined,
                }}
              >
                {overclockEnabled ? 'OVERCLOCKED' : 'NORMAL'}
              </button>
            </div>

            {/* Neon Glow Slider */}
            <div className="p-3 border border-white/10 bg-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">TRACE GLOW INTENSITY</span>
                <span className="font-bold" style={{ color: currentTheme.primary }}>
                  {Math.round(glowIntensity)}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={glowIntensity}
                onChange={(e) => onGlowChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 appearance-none cursor-pointer"
                style={{ accentColor: currentTheme.primary }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => {
                sounds.playClick(640);
                haptics.trigger('click');
                onClose();
              }}
              className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-neutral-200 active:scale-95 transition-all"
            >
              APPLY & CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
