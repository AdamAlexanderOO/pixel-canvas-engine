import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Cpu,
  Shield,
  Flame,
  Activity,
  Layers,
  Radio,
  Droplet,
  Zap,
  Sparkles,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SubsystemStatus, LightProtocolData } from '../types';
import { sounds } from '../utils/soundEffects';

interface SubsystemsArchiveViewProps {
  subsystems: SubsystemStatus;
  currentLight: LightProtocolData;
  powerOn: boolean;
  onBoostSubsystem: (subsystemKey: string) => void;
  onSelectSubsystem: (subsystemKey: string) => void;
}

export const SubsystemsArchiveView: React.FC<SubsystemsArchiveViewProps> = ({
  subsystems,
  currentLight,
  powerOn,
  onBoostSubsystem,
  onSelectSubsystem,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'OPTIMAL'>('ALL');

  const subsystemsList = [
    {
      id: 'HEALTH',
      title: 'VITAL HEALTH MATRIX',
      icon: Heart,
      status: subsystems.health.status,
      integrity: subsystems.health.integrity,
      description: 'Biomechanical chassis cellular integrity and regenerative nutrient fluid balance.',
      primaryMetric: `${subsystems.health.current} / ${subsystems.health.max} HP`,
      secondaryMetric: '+14.2 HP/sec Cell Regen',
      accentColor: 'text-red-500',
      borderColor: 'border-red-600/30',
      specs: [
        { label: 'Cellular Density', val: '99.2%' },
        { label: 'Regen Buffer', val: 'Active' },
        { label: 'Thermal Degradation', val: '0.04%' },
      ],
    },
    {
      id: 'AI_CORE',
      title: 'GEMINI AI SYNAPSE CORE',
      icon: Cpu,
      status: subsystems.aiCore.neuralSync > 95 ? 'OPTIMAL' : 'REGENERATING',
      integrity: 100 - subsystems.aiCore.load,
      description: 'Gemini 3.7 Flash simulation engine processing quantum mechanics and gear train kinematics.',
      primaryMetric: `${subsystems.aiCore.load}% Synaptic Load`,
      secondaryMetric: `${subsystems.aiCore.neuralSync}% Neural Sync`,
      accentColor: 'text-white',
      borderColor: 'border-white/20',
      specs: [
        { label: 'Core Temp', val: `${subsystems.aiCore.temperatureC}°C` },
        { label: 'Prompt Tokens', val: `${subsystems.aiCore.promptTokens}` },
        { label: 'Latency', val: '42ms' },
      ],
    },
    {
      id: 'SHIELD',
      title: 'DEFLECTOR FORCE FIELD',
      icon: Shield,
      status: subsystems.shield.locked ? 'OPTIMAL' : 'CRITICAL',
      integrity: subsystems.shield.strength,
      description: 'Polarized harmonic shield deflecting cosmic radiation and thermal pulse bursts.',
      primaryMetric: `${subsystems.shield.strength}% Field Strength`,
      secondaryMetric: `${subsystems.shield.chargeRate} MW/s Capacitor Rate`,
      accentColor: 'text-red-500',
      borderColor: 'border-red-600/30',
      specs: [
        { label: 'Harmonic Lock', val: '450 THz' },
        { label: 'Capacitor Bank', val: '12.4 GW' },
        { label: 'Deflection Index', val: '0.998' },
      ],
    },
    {
      id: 'HEAT_TREATED_METAL',
      title: 'HEAT-TREATED METAL MATRIX',
      icon: Flame,
      status: subsystems.heatTreatedMetal.alloyStrain < 25 ? 'OPTIMAL' : 'CRITICAL',
      integrity: 100 - subsystems.heatTreatedMetal.alloyStrain,
      description: 'Titanium-tungsten alloy chassis shielding sensitive clockwork escapement gears.',
      primaryMetric: `${subsystems.heatTreatedMetal.alloyStrain}% Alloy Strain`,
      secondaryMetric: `${subsystems.heatTreatedMetal.temperatureC}°C Chassis Temp`,
      accentColor: 'text-amber-500',
      borderColor: 'border-amber-500/30',
      specs: [
        { label: 'Structural Purity', val: `${subsystems.heatTreatedMetal.structuralPurity}%` },
        { label: 'Tensile Yield', val: '3,200 MPa' },
        { label: 'Annealing State', val: 'Austenitic' },
      ],
    },
    {
      id: 'CPU_DASHBOARD',
      title: 'CPU INSTRUCTION DASHBOARD',
      icon: Activity,
      status: 'OPTIMAL',
      integrity: 94,
      description: 'Multi-core instruction pipeline executing concurrent quantum and mechanical simulations.',
      primaryMetric: `${subsystems.cpuDashboard.clockGhz} GHz Quad Core`,
      secondaryMetric: `${subsystems.cpuDashboard.instructionMips.toLocaleString()} MIPS`,
      accentColor: 'text-white',
      borderColor: 'border-white/20',
      specs: [
        { label: 'Core 00', val: `${subsystems.cpuDashboard.coreLoads[0]}%` },
        { label: 'Core 01', val: `${subsystems.cpuDashboard.coreLoads[1]}%` },
        { label: 'Core 02', val: `${subsystems.cpuDashboard.coreLoads[2]}%` },
        { label: 'Core 03', val: `${subsystems.cpuDashboard.coreLoads[3]}%` },
      ],
    },
    {
      id: 'ASSET_PACKS',
      title: 'ASSET PACKS & SHADER REGISTRY',
      icon: Layers,
      status: 'OPTIMAL',
      integrity: 100,
      description: 'Pre-compiled shaders, holographic look-up tables, and brass gear mesh matrices.',
      primaryMetric: `${subsystems.assetPacks.loadedBuffers} Geometry Buffers`,
      secondaryMetric: `${subsystems.assetPacks.matrixCacheMb} MB Matrix VRAM`,
      accentColor: 'text-white',
      borderColor: 'border-white/20',
      specs: [
        { label: 'Aurora_Shader', val: 'v4.2.0 Compiled' },
        { label: 'PCB_Traces', val: 'Dynamic GLSL' },
        { label: 'Brass_Gear_Reflect', val: 'Raymarched' },
      ],
    },
    {
      id: 'SENSORS',
      title: 'QUANTUM SENSOR ARRAY',
      icon: Radio,
      status: 'OPTIMAL',
      integrity: 97,
      description: 'Electromagnetic spectrum analyzer and quantum resonance receiver monitoring Sector 07.',
      primaryMetric: `${subsystems.sensors.emSpectrum.toFixed(1)} GHz EM Spectrum`,
      secondaryMetric: `${subsystems.sensors.quantumResonance} Φ Quantum Resonance`,
      accentColor: 'text-red-500',
      borderColor: 'border-red-600/30',
      specs: [
        { label: 'Thermal Flux', val: `${subsystems.sensors.thermalFlux.toFixed(0)} W/m²` },
        { label: 'Sector Lock', val: 'Sector 07 (Active)' },
        { label: 'Ion Drift', val: '0.002 ppm' },
      ],
    },
    {
      id: 'NUTRIENT_SYS',
      title: 'BIOMECHANICAL NUTRIENT SYSTEM',
      icon: Droplet,
      status: 'OPTIMAL',
      integrity: subsystems.nutrientSys.bioPurity,
      description: 'Biomechanical fluid synthesis and electrolyte coolant circulating through chassis channels.',
      primaryMetric: `${subsystems.nutrientSys.fluidPressurePsi} PSI Fluid Pressure`,
      secondaryMetric: `${subsystems.nutrientSys.bioPurity}% Bio Purity`,
      accentColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/30',
      specs: [
        { label: 'Electrolyte Bal', val: `${subsystems.nutrientSys.electrolyteBalance}%` },
        { label: 'Viscosity Index', val: '1.45 cSt' },
        { label: 'Pump RPM', val: '2,400' },
      ],
    },
  ];

  return (
    <div id="subsystems-archive" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
              SUBSYSTEMS ARCHIVE & DIAGNOSTICS DIRECTORY
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Full telemetry profiles, specs, and real-time telemetry from all 8 deck architecture modules.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick(600);
              setFilter('ALL');
            }}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
              filter === 'ALL'
                ? 'bg-white text-black border-white'
                : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            All Subsystems (8)
          </button>
          <button
            onClick={() => {
              sounds.playClick(650);
              setFilter('OPTIMAL');
            }}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
              filter === 'OPTIMAL'
                ? 'bg-white text-black border-white'
                : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            Optimal
          </button>
        </div>
      </div>

      {/* 8 Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {subsystemsList.map((sys) => {
          const Icon = sys.icon;
          return (
            <div
              key={sys.id}
              className={`p-4 border bg-neutral-950/80 flex flex-col justify-between space-y-4 hover:border-white/40 transition-all ${sys.borderColor}`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${sys.accentColor}`} />
                    <span className="text-xs font-black tracking-wider text-white uppercase">{sys.id.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
                    {sys.integrity}% INT
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 line-clamp-2 mb-3">
                  {sys.description}
                </div>

                {/* Primary Metrics */}
                <div className="space-y-1 p-2.5 bg-white/5 border border-white/10 text-xs">
                  <div className="text-white font-bold">{sys.primaryMetric}</div>
                  <div className="text-[10px] text-neutral-400">{sys.secondaryMetric}</div>
                </div>

                {/* Specs List */}
                <div className="mt-3 space-y-1.5 text-[10px]">
                  {sys.specs.map((spec, idx) => (
                    <div key={idx} className="flex justify-between items-center text-neutral-400 border-b border-white/5 pb-1">
                      <span>{spec.label}</span>
                      <span className="font-mono text-white font-bold">{spec.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playClick(720);
                    onSelectSubsystem(sys.id);
                  }}
                  className="flex-1 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider"
                >
                  INSPECT
                </button>
                <button
                  onClick={() => {
                    sounds.playSpectrumLoad();
                    onBoostSubsystem(sys.id);
                  }}
                  className="px-3 py-1.5 border border-red-600/40 bg-red-950/30 hover:bg-red-900/40 text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-red-500" />
                  <span>BOOST</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
