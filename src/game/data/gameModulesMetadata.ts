import { MosaicCharacterType, CHARACTER_IMAGE_ASSETS } from '../utils/mosaicCharacterRenderer';

export type ModuleCategory = 'WEAPON' | 'ARMOR' | 'PROPULSION' | 'AVIONICS' | 'TACTICAL' | 'CORE';
export type ModuleRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ANCIENT_MOSAIC';
export type GameTargetMode = 'FPS' | 'TPS' | 'SPACE_SIM';

export interface Module3DMetadata {
  mountNode: string; // e.g. 'barrel', 'left_shoulder', 'right_wing', 'torso', 'cockpit', 'thruster', 'hull_top'
  position: [number, number, number]; // [x, y, z] offset relative to mount node
  rotation: [number, number, number]; // [rx, ry, rz] Euler angles in radians
  scale: [number, number, number]; // [sx, sy, sz]
  geometryType: 'BOX' | 'CYLINDER' | 'SPHERE' | 'MOSAIC_PLAQUE' | 'HYBRID_MODULE';
  color: string;
  emissiveColor: string;
  glowIntensity: number;
  mosaicCharacterType?: MosaicCharacterType;
  customPlaqueSize?: [number, number];
}

export interface GameModuleAsset {
  id: string;
  name: string;
  shortCode: string;
  category: ModuleCategory;
  gameMode: GameTargetMode;
  rarity: ModuleRarity;
  level: number;
  mosaicImageSrc: string;
  mosaicCharacterType: MosaicCharacterType;
  description: string;
  lore: string;
  isEquipped: boolean;
  stats2D: {
    powerDrainMW: number;
    massKg: number;
    primaryAttribute: { label: string; value: string; numValue: number };
    secondaryAttribute?: { label: string; value: string; numValue: number };
    compatibility: string[];
    tesseraCount: number;
    groutHardness: number;
  };
  metadata3D: Module3DMetadata;
}

export const GAME_MODULES_DATABASE: GameModuleAsset[] = [
  // ==========================================
  // 1. FIRST PERSON SHOOTER (CYBER FPS) MODULES
  // ==========================================
  {
    id: 'fps_plasma_core',
    name: 'Helios Plasma Core',
    shortCode: 'HPC-01',
    category: 'CORE',
    gameMode: 'FPS',
    rarity: 'EPIC',
    level: 4,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.PLASMA_RIFLE,
    mosaicCharacterType: 'PLASMA_RIFLE',
    description: 'High-density micro-tesserae plasma containment cell with superconductor magnetic coils.',
    lore: 'Forged with Roman tesserae insulating ceramic that withstands 40,000 Kelvin plasma discharge.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 18.5,
      massKg: 4.2,
      primaryAttribute: { label: 'Plasma Damage', value: '+35%', numValue: 35 },
      secondaryAttribute: { label: 'Reload Speed', value: '+20%', numValue: 20 },
      compatibility: ['Cyber Plasma Rifle', 'Gauss Railgun'],
      tesseraCount: 1420,
      groutHardness: 88,
    },
    metadata3D: {
      mountNode: 'torso',
      position: [0, -0.06, 0.1],
      rotation: [0, 0, 0],
      scale: [0.08, 0.12, 0.25],
      geometryType: 'BOX',
      color: '#00f0ff',
      emissiveColor: '#0099cc',
      glowIntensity: 2.2,
      mosaicCharacterType: 'PLASMA_RIFLE',
    },
  },
  {
    id: 'fps_gauss_accelerator',
    name: 'Tessera Gauss Railgun Barrel',
    shortCode: 'TGR-09',
    category: 'WEAPON',
    gameMode: 'FPS',
    rarity: 'LEGENDARY',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.GAUSS_RAILGUN,
    mosaicCharacterType: 'GAUSS_RAILGUN',
    description: 'Electromagnetic rail coils etched with quantum transistor glyph patterns for extreme muzzle velocity.',
    lore: 'Empowers kinetic projectiles to pierce heavily armored goliaths with hyper-velocity depleted uranium rounds.',
    isEquipped: false,
    stats2D: {
      powerDrainMW: 24.0,
      massKg: 7.8,
      primaryAttribute: { label: 'Projectile Speed', value: '+75%', numValue: 75 },
      secondaryAttribute: { label: 'Armor Piercing', value: '+50%', numValue: 50 },
      compatibility: ['Gauss Railgun', 'Heavy Sniper'],
      tesseraCount: 2200,
      groutHardness: 94,
    },
    metadata3D: {
      mountNode: 'barrel',
      position: [0, 0.04, -0.55],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.05, 0.8, 0.05],
      geometryType: 'CYLINDER',
      color: '#ffaa00',
      emissiveColor: '#ff6600',
      glowIntensity: 1.8,
      mosaicCharacterType: 'GAUSS_RAILGUN',
    },
  },
  {
    id: 'fps_holo_collimator',
    name: 'Astrolabe Mosaic Holo-Sight',
    shortCode: 'AMH-03',
    category: 'AVIONICS',
    gameMode: 'FPS',
    rarity: 'RARE',
    level: 3,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.CYBER_PILOT,
    mosaicCharacterType: 'CYBER_PILOT',
    description: 'Reflex optical reticle with real-time target trajectory prediction and distance telemetry.',
    lore: 'Derived from ancient celestial navigation astrolabes, modernized with quantum HUD projection.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 4.5,
      massKg: 0.8,
      primaryAttribute: { label: 'Accuracy', value: '+40%', numValue: 40 },
      secondaryAttribute: { label: 'Crit Chance', value: '+15%', numValue: 15 },
      compatibility: ['All Rifles'],
      tesseraCount: 680,
      groutHardness: 76,
    },
    metadata3D: {
      mountNode: 'top_rail',
      position: [0, 0.14, -0.1],
      rotation: [0, 0, 0],
      scale: [0.06, 0.08, 0.12],
      geometryType: 'BOX',
      color: '#00ffff',
      emissiveColor: '#00ffff',
      glowIntensity: 2.5,
      mosaicCharacterType: 'CYBER_PILOT',
    },
  },
  {
    id: 'fps_beam_emitter',
    name: 'Sol Invictus Beam Saber Emitter',
    shortCode: 'SBS-07',
    category: 'WEAPON',
    gameMode: 'FPS',
    rarity: 'ANCIENT_MOSAIC',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.BEAM_SABER,
    mosaicCharacterType: 'BEAM_SABER',
    description: 'High-intensity plasma blade emitter with Roman golden mosaic pommel and quantum crystal focus.',
    lore: 'An ancient ceremonial blade re-engineered for close-quarters breach and sweep operations.',
    isEquipped: false,
    stats2D: {
      powerDrainMW: 30.0,
      massKg: 2.6,
      primaryAttribute: { label: 'Melee DPS', value: '450', numValue: 450 },
      secondaryAttribute: { label: 'Deflect Chance', value: '35%', numValue: 35 },
      compatibility: ['Sidearm Bayonet Socket'],
      tesseraCount: 3100,
      groutHardness: 99,
    },
    metadata3D: {
      mountNode: 'side_rail',
      position: [0.12, -0.02, -0.2],
      rotation: [0, 0, 0],
      scale: [0.04, 0.04, 0.4],
      geometryType: 'CYLINDER',
      color: '#ff0055',
      emissiveColor: '#ff0033',
      glowIntensity: 3.0,
      mosaicCharacterType: 'BEAM_SABER',
    },
  },

  // ==========================================
  // 2. THIRD PERSON TACTICAL SHOOTER (TPS) MODULES
  // ==========================================
  {
    id: 'tps_reactive_pauldron',
    name: 'Imperial Roman Reactive Pauldrons',
    shortCode: 'IRP-04',
    category: 'ARMOR',
    gameMode: 'TPS',
    rarity: 'LEGENDARY',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.MECH_ARMOR,
    mosaicCharacterType: 'MECH_ARMOR',
    description: 'Angled ceramic tesserae shoulder plating that deflects kinetic ordnance and dissipates plasma bursts.',
    lore: 'Directly replicates the Lorica Segmentata shoulder curvature with modern titanium-grout composites.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 12.0,
      massKg: 180,
      primaryAttribute: { label: 'Armor Rating', value: '+450', numValue: 450 },
      secondaryAttribute: { label: 'Blast Resistance', value: '+40%', numValue: 40 },
      compatibility: ['Aurora Titan', 'Valkyrie Gundam'],
      tesseraCount: 4800,
      groutHardness: 96,
    },
    metadata3D: {
      mountNode: 'left_shoulder',
      position: [-1.4, 2.8, 0],
      rotation: [0, 0, 0.2],
      scale: [0.8, 0.6, 0.9],
      geometryType: 'MOSAIC_PLAQUE',
      color: '#00f0ff',
      emissiveColor: '#0066aa',
      glowIntensity: 1.6,
      mosaicCharacterType: 'MECH_ARMOR',
      customPlaqueSize: [0.9, 0.8],
    },
  },
  {
    id: 'tps_valkyrie_wings',
    name: 'Valkyrie High-Agility Wing Verniers',
    shortCode: 'VHW-08',
    category: 'PROPULSION',
    gameMode: 'TPS',
    rarity: 'ANCIENT_MOSAIC',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.VALKYRIE_GUNDAM,
    mosaicCharacterType: 'VALKYRIE_GUNDAM',
    description: 'Twin articulated aerodynamic flight wings with micro-thrusters for omnidirectional combat dashing.',
    lore: 'Inspired by ancient winged victory deities, enabling mechs to evade heavy orbital barrage strikes.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 32.0,
      massKg: 240,
      primaryAttribute: { label: 'Dash Cooldown', value: '-35%', numValue: 35 },
      secondaryAttribute: { label: 'Move Speed', value: '+25%', numValue: 25 },
      compatibility: ['Valkyrie Frame', 'Aurora Titan'],
      tesseraCount: 5600,
      groutHardness: 92,
    },
    metadata3D: {
      mountNode: 'back_thruster',
      position: [0, 2.2, -0.6],
      rotation: [0.3, 0, 0],
      scale: [2.8, 2.2, 0.1],
      geometryType: 'MOSAIC_PLAQUE',
      color: '#00f0ff',
      emissiveColor: '#00ffff',
      glowIntensity: 2.4,
      mosaicCharacterType: 'VALKYRIE_GUNDAM',
      customPlaqueSize: [2.6, 2.0],
    },
  },
  {
    id: 'tps_orbital_beacon',
    name: 'Centurion Orbital Strike Relay',
    shortCode: 'COS-12',
    category: 'TACTICAL',
    gameMode: 'TPS',
    rarity: 'EPIC',
    level: 4,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.ROMAN_CYBER_MOSAIC,
    mosaicCharacterType: 'ROMAN_CYBER_MOSAIC',
    description: 'High-gain laser targeting pod that links with satellite arrays for devastating orbital beam bombardments.',
    lore: 'Transmits tactical laser coordinates through quantum-entangled relay nodes within 12 milliseconds.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 28.0,
      massKg: 95,
      primaryAttribute: { label: 'Orbital Damage', value: '1800', numValue: 1800 },
      secondaryAttribute: { label: 'Blast Radius', value: '12m', numValue: 12 },
      compatibility: ['All Mechs'],
      tesseraCount: 3400,
      groutHardness: 89,
    },
    metadata3D: {
      mountNode: 'right_shoulder',
      position: [1.2, 3.1, 0.1],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.18, 1.4, 0.18],
      geometryType: 'CYLINDER',
      color: '#00f0ff',
      emissiveColor: '#0099ff',
      glowIntensity: 2.8,
      mosaicCharacterType: 'ROMAN_CYBER_MOSAIC',
    },
  },
  {
    id: 'tps_goliath_barrier',
    name: 'Goliath Hyper-Density Grout Shield',
    shortCode: 'GHD-05',
    category: 'ARMOR',
    gameMode: 'TPS',
    rarity: 'LEGENDARY',
    level: 4,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.GOLIATH_TITAN,
    mosaicCharacterType: 'GOLIATH_TITAN',
    description: 'Solid-state kinetic barrier generator reinforced with pulverized volcanic ash and cyber tesserae.',
    lore: 'Salvaged from rogue Goliath titans, capable of absorbing explosive barrage impacts without buckle.',
    isEquipped: false,
    stats2D: {
      powerDrainMW: 20.0,
      massKg: 310,
      primaryAttribute: { label: 'Barrier Health', value: '+600', numValue: 600 },
      secondaryAttribute: { label: 'Recharge Rate', value: '+30/s', numValue: 30 },
      compatibility: ['Heavy Chassis'],
      tesseraCount: 4200,
      groutHardness: 98,
    },
    metadata3D: {
      mountNode: 'torso_front',
      position: [0, 1.8, 0.5],
      rotation: [0, 0, 0],
      scale: [1.8, 1.6, 0.1],
      geometryType: 'MOSAIC_PLAQUE',
      color: '#ff0044',
      emissiveColor: '#ff0033',
      glowIntensity: 2.0,
      mosaicCharacterType: 'GOLIATH_TITAN',
      customPlaqueSize: [1.8, 1.6],
    },
  },

  // ==========================================
  // 3. SPACE DOGFIGHT SIMULATOR MODULES
  // ==========================================
  {
    id: 'space_quantum_torpedo',
    name: 'Aquila Quantum Torpedo Pod',
    shortCode: 'AQT-02',
    category: 'WEAPON',
    gameMode: 'SPACE_SIM',
    rarity: 'LEGENDARY',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.STARFIGHTER_INTERCEPTOR,
    mosaicCharacterType: 'STARFIGHTER_INTERCEPTOR',
    description: 'Dual under-wing missile launcher racks loaded with homing tachyon-seeking torpedoes.',
    lore: 'Locks onto enemy capital ships with electromagnetic signature recognition in zero-G vacuum.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 15.0,
      massKg: 120,
      primaryAttribute: { label: 'Torpedo Damage', value: '450', numValue: 450 },
      secondaryAttribute: { label: 'Lock Range', value: '1800m', numValue: 1800 },
      compatibility: ['Starfighter Interceptor', 'Stealth Corvette'],
      tesseraCount: 2800,
      groutHardness: 91,
    },
    metadata3D: {
      mountNode: 'under_wing_left',
      position: [-2.2, -0.2, 0.4],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.25, 1.2, 0.25],
      geometryType: 'CYLINDER',
      color: '#ffaa00',
      emissiveColor: '#ff6600',
      glowIntensity: 2.0,
      mosaicCharacterType: 'STARFIGHTER_INTERCEPTOR',
    },
  },
  {
    id: 'space_stealth_shroud',
    name: 'Shadow Corvette Sensor Shroud',
    shortCode: 'SCS-06',
    category: 'TACTICAL',
    gameMode: 'SPACE_SIM',
    rarity: 'EPIC',
    level: 4,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.STEALTH_CORVETTE,
    mosaicCharacterType: 'STEALTH_CORVETTE',
    description: 'Radar-absorbent tesserae hull coating that baffles enemy targeting systems and thermal sensors.',
    lore: 'Allows deep infiltration into hostile asteroid belts without triggering perimeter defense networks.',
    isEquipped: false,
    stats2D: {
      powerDrainMW: 22.0,
      massKg: 85,
      primaryAttribute: { label: 'Signature Mask', value: '65%', numValue: 65 },
      secondaryAttribute: { label: 'Evasion Boost', value: '+20%', numValue: 20 },
      compatibility: ['Stealth Corvette', 'Interceptor'],
      tesseraCount: 3600,
      groutHardness: 87,
    },
    metadata3D: {
      mountNode: 'hull_top',
      position: [0, 0.6, 0],
      rotation: [0, 0, 0],
      scale: [1.4, 0.3, 2.2],
      geometryType: 'MOSAIC_PLAQUE',
      color: '#00f0ff',
      emissiveColor: '#005588',
      glowIntensity: 1.5,
      mosaicCharacterType: 'STEALTH_CORVETTE',
      customPlaqueSize: [1.4, 2.0],
    },
  },
  {
    id: 'space_sublight_thruster',
    name: 'Hyperion Sub-Light Ion Nozzles',
    shortCode: 'HSL-10',
    category: 'PROPULSION',
    gameMode: 'SPACE_SIM',
    rarity: 'LEGENDARY',
    level: 5,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.DEEP_SPACE_NEBULA,
    mosaicCharacterType: 'DEEP_SPACE_NEBULA',
    description: 'Triple-manifold plasma afterburner nozzles for supersonic acceleration in sub-light engagements.',
    lore: 'Generates up to 14 Gs of instantaneous thrust through magnetic pinch containment rings.',
    isEquipped: true,
    stats2D: {
      powerDrainMW: 38.0,
      massKg: 210,
      primaryAttribute: { label: 'Max Velocity', value: '+40%', numValue: 40 },
      secondaryAttribute: { label: 'Boost Duration', value: '+60%', numValue: 60 },
      compatibility: ['Starfighters', 'Cruisers'],
      tesseraCount: 5100,
      groutHardness: 95,
    },
    metadata3D: {
      mountNode: 'rear_engines',
      position: [0, 0, 2.8],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.4, 0.8, 0.4],
      geometryType: 'CYLINDER',
      color: '#00f0ff',
      emissiveColor: '#00ffff',
      glowIntensity: 3.5,
      mosaicCharacterType: 'DEEP_SPACE_NEBULA',
    },
  },
  {
    id: 'space_cruiser_flak',
    name: 'Aegis Flak Point Defense Battery',
    shortCode: 'AFP-11',
    category: 'WEAPON',
    gameMode: 'SPACE_SIM',
    rarity: 'EPIC',
    level: 4,
    mosaicImageSrc: CHARACTER_IMAGE_ASSETS.CRUISER_BOSS,
    mosaicCharacterType: 'CRUISER_BOSS',
    description: 'Automated rapid-fire point defense turret designed to shred enemy drones and inbound missiles.',
    lore: 'Standard military issue on capital battlecruisers patrolling Outer Rim Roman warp gates.',
    isEquipped: false,
    stats2D: {
      powerDrainMW: 26.0,
      massKg: 190,
      primaryAttribute: { label: 'Auto-Turret DPS', value: '280', numValue: 280 },
      secondaryAttribute: { label: 'Tracking Angle', value: '360°', numValue: 360 },
      compatibility: ['Cruiser Flagship', 'Heavy Gunship'],
      tesseraCount: 4600,
      groutHardness: 93,
    },
    metadata3D: {
      mountNode: 'dorsal_turret',
      position: [0, 0.8, -0.6],
      rotation: [0, 0, 0],
      scale: [0.5, 0.4, 0.5],
      geometryType: 'SPHERE',
      color: '#ff0055',
      emissiveColor: '#ff0033',
      glowIntensity: 2.2,
      mosaicCharacterType: 'CRUISER_BOSS',
    },
  },
];

/**
 * Returns modules filtered by game mode (FPS, TPS, or SPACE_SIM)
 */
export function getModulesForGame(gameMode: GameTargetMode): GameModuleAsset[] {
  return GAME_MODULES_DATABASE.filter((m) => m.gameMode === gameMode);
}
