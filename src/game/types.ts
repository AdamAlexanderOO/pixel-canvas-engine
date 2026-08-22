export type SimulationMode = 
  | 'SIMULATE' 
  | 'QUANTUM_SYNTHESIS' 
  | 'BIO_TACTICAL' 
  | 'NEURAL_LINK' 
  | 'SPECTRAL_SWEEP';

export type LightPreset = 
  | 'AURORA_VIOLET' 
  | 'CYBER_CYAN' 
  | 'SOLAR_AMBER' 
  | 'BIOLUMINESCENT' 
  | 'GAMMA_PULSE'
  | 'HEAT_TREATED'
  | 'SAKURA_PINK';

export interface LightProtocolData {
  preset: LightPreset;
  name: string;
  primaryColor: string;
  glowColor: string;
  wavelengthTHz: number;
  energyOutputMW: number;
  activePathways: string[];
}

export interface SubsystemStatus {
  health: { current: number; max: number; integrity: number; status: 'OPTIMAL' | 'REGENERATING' | 'CRITICAL' };
  aiCore: { load: number; neuralSync: number; temperatureC: number; promptTokens: number };
  shield: { strength: number; harmonics: number; chargeRate: number; locked: boolean };
  heatTreatedMetal: { alloyStrain: number; temperatureC: number; structuralPurity: number };
  cpuDashboard: { coreLoads: number[]; clockGhz: number; instructionMips: number };
  assetPacks: { loadedBuffers: number; matrixCacheMb: number; activeShaders: string[] };
  sensors: { emSpectrum: number; quantumResonance: number; thermalFlux: number };
  nutrientSys: { fluidPressurePsi: number; electrolyteBalance: number; bioPurity: number };
}

export interface HologramEngineState {
  visibleLayers: {
    holographicWireframe: boolean;
    siliconPcb: boolean;
    mechanicalGears: boolean;
  };
  meshType: 'CRYSTALLINE_FOLDER' | 'QUANTUM_PRISM' | 'NEURAL_LATTICE';
  viewMode: 'EXPLODED_3D' | 'ISOMETRIC' | 'TOP_DOWN' | 'CROSS_SECTION';
  gearRpm: number;
  gearRatio: number;
  prismaticRefraction: number;
}

export interface RadarAnomaly {
  id: string;
  label: string;
  angle: number; // degrees 0-360
  radius: number; // 0-100%
  severity: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  coordinates: string;
  signature: string;
}

export interface TelemetryState {
  gauges: {
    primaryFlux: number; // 45 in reference
    harmonicEntropy: number; // 38 in reference
    capacitorLoad: number; // 33 in reference
  };
  testTubes: Array<{
    id: string;
    label: string;
    level: number;
    color: string;
    pulseSpeed: number;
  }>;
  radarAnomalies: RadarAnomaly[];
  radarAngle: number;
  hexGridActive: number[];
  matrixStreamActive: boolean;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  source: 'SYSTEM' | 'AURORA_CORE' | 'LIGHT_PROTOCOL' | 'AI_SIM' | 'GEAR_DRIVE';
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface SimulationResult {
  simulationId: string;
  status: 'simulated_ai' | 'simulated_local';
  output: {
    title: string;
    description: string;
    metrics: {
      efficiency?: string;
      quantumCoherence?: string;
      entropyIndex?: string;
      thermalDissipation?: string;
      [key: string]: string | undefined;
    };
    recommendation: string;
    anomaliesDetected: number;
    events: string[];
  };
}
