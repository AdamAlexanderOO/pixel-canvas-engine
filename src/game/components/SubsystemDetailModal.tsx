import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Cpu, Shield, Flame, Database, Radio, Droplet, Zap, RefreshCw } from 'lucide-react';
import { SubsystemStatus, LightProtocolData } from '../types';
import { sounds } from '../utils/soundEffects';

interface SubsystemDetailModalProps {
  nodeName: string | null;
  onClose: () => void;
  subsystems: SubsystemStatus;
  currentLight: LightProtocolData;
  onBoostSubsystem: (subsystemKey: string) => void;
}

export const SubsystemDetailModal: React.FC<SubsystemDetailModalProps> = ({
  nodeName,
  onClose,
  subsystems,
  currentLight,
  onBoostSubsystem,
}) => {
  if (!nodeName) return null;

  const handleBoost = () => {
    sounds.playSimulatePulse();
    onBoostSubsystem(nodeName);
  };

  const renderContent = () => {
    switch (nodeName) {
      case 'HEALTH':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">INTEGRITY RATING</span>
              <span className="text-red-500 font-bold text-sm">{subsystems.health.integrity}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 overflow-hidden border border-white/15">
              <div className="h-full bg-red-600" style={{ width: `${subsystems.health.integrity}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">CURRENT HP</div>
                <div className="text-white font-bold">{subsystems.health.current} / {subsystems.health.max}</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">CELL REGEN</div>
                <div className="text-red-400 font-bold">+14.2 HP/sec</div>
              </div>
            </div>
          </div>
        );
      case 'AI_CORE':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">SYNAPTIC LOAD</span>
              <span className="text-white font-bold text-sm">{subsystems.aiCore.load}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 overflow-hidden border border-white/15">
              <div className="h-full bg-white" style={{ width: `${subsystems.aiCore.load}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">NEURAL SYNC</div>
                <div className="text-white font-bold">{subsystems.aiCore.neuralSync}%</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">CORE TEMP</div>
                <div className="text-red-400 font-bold">{subsystems.aiCore.temperatureC}°C</div>
              </div>
            </div>
          </div>
        );
      case 'SHIELD':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">DEFLECTOR FIELD</span>
              <span className="text-white font-bold text-sm">{subsystems.shield.strength}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 overflow-hidden border border-white/15">
              <div className="h-full bg-red-600" style={{ width: `${subsystems.shield.strength}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">HARMONIC LOCK</div>
                <div className="text-white font-bold">LOCKED (450 THz)</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">CAPACITOR RATE</div>
                <div className="text-red-400 font-bold">{subsystems.shield.chargeRate} MW/s</div>
              </div>
            </div>
          </div>
        );
      case 'HEAT_TREATED_METAL':
        return (
          <div className="space-y-3">
            <div className="p-3 border border-white/15 bg-white/5 text-xs">
              <div className="text-red-500 font-bold mb-1">TITANIUM-TUNGSTEN MATRIX</div>
              <p className="text-neutral-300">
                Heat-treated alloy chassis shielding sensitive clockwork gears and silicon synapses against plasma thermal bloom.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">ALLOY STRAIN</div>
                <div className="text-white font-bold">{subsystems.heatTreatedMetal.alloyStrain}%</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">CHASSIS TEMP</div>
                <div className="text-red-400 font-bold">{subsystems.heatTreatedMetal.temperatureC}°C</div>
              </div>
            </div>
          </div>
        );
      case 'CPU_DASHBOARD':
        return (
          <div className="space-y-3">
            <div className="text-xs text-neutral-300">
              Multi-core instruction pipeline executing concurrent quantum and mechanical simulations.
            </div>
            <div className="grid grid-cols-4 gap-2">
              {subsystems.cpuDashboard.coreLoads.map((load, idx) => (
                <div key={idx} className="p-2 bg-white/5 border border-white/10 text-center">
                  <div className="text-[9px] text-neutral-400">CORE 0{idx}</div>
                  <div className="text-xs font-black text-white mt-0.5">{load}%</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'ASSET_PACKS':
        return (
          <div className="space-y-3">
            <div className="text-xs text-neutral-300">
              Pre-compiled shaders, holographic coordinate look-up tables, and gear mesh matrices.
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">ACTIVE SHADERS</div>
                <div className="text-white font-bold">14 Compiled</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">MATRIX VRAM</div>
                <div className="text-red-400 font-bold">{subsystems.assetPacks.matrixCacheMb} MB</div>
              </div>
            </div>
          </div>
        );
      case 'NUTRIENT_SYS':
        return (
          <div className="space-y-3">
            <div className="text-xs text-neutral-300">
              Biomechanical fluid synthesis and electrolyte coolant circulating through chassis channels.
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">FLUID PRESSURE</div>
                <div className="text-white font-bold">{subsystems.nutrientSys.fluidPressurePsi} PSI</div>
              </div>
              <div className="p-2 bg-white/5 border border-white/10">
                <div className="text-neutral-400 text-[10px]">BIO PURITY</div>
                <div className="text-red-400 font-bold">{subsystems.nutrientSys.bioPurity}%</div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-xs text-neutral-300">
            Sensor telemetry locked onto quantum frequencies and atmospheric ionization.
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md border border-white/20 bg-[#0A0A0A] p-5 text-neutral-200 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-black tracking-wider text-white">
                SUBSYSTEM // {nodeName.replace('_', ' ')}
              </h3>
            </div>
            <button
              onClick={() => {
                sounds.playClick(600);
                onClose();
              }}
              className="p-1.5 border border-white/20 bg-white/5 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="my-4">{renderContent()}</div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              onClick={handleBoost}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-600 bg-red-950/40 text-red-400 hover:bg-red-950/60 active:scale-95 text-xs font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>BOOST CHANNEL</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick(640);
                onClose();
              }}
              className="px-3.5 py-1.5 border border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs font-bold transition-all"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
