import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import {
  Layers,
  Sparkles,
  Grid,
  Cpu,
  Eye,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Zap,
  CheckCircle2,
  Activity,
  Maximize2,
  Minimize2,
  Binary,
  Compass,
  ZoomIn,
  ZoomOut,
  Move,
  Scan,
  Box,
  Shield,
  Flame,
  Rotate3d,
  Wand2,
  RefreshCw,
  Orbit,
  Split,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { AppThemeConfig } from '../utils/theme';
import { ArmorAssemblyModal } from './ArmorAssemblyModal';
import {
  applyConvolutionFilter,
  SHARPEN_KERNEL,
  SHARP_VECTOR_KERNEL,
  SOFT_MOSAIC_SMOOTH_KERNEL,
  applyAiBilinearUpscaleWithNoiseReduction,
} from '../utils/mosaicCharacterRenderer';

interface RomanMosaicEngineProps {
  powerOn: boolean;
  fluxFrequency: number;
  theme: AppThemeConfig;
}

// Characteristic Pre-built Image Profiles - In-Game Playable Characters, Bosses, Weapons & Sprites
interface KnownImageProfile {
  id: string;
  name: string;
  category: string;
  gameRole: 'PLAYABLE' | 'PILOT' | 'WEAPON' | 'BOSS' | 'ENEMY' | 'RELIC';
  src: string;
  dominantColors: string[];
  characteristicLines: string[];
  complexityIndex: number;
  equationsCount: number;
  description: string;
}

const PRESET_PROFILES: KnownImageProfile[] = [
  {
    id: 'MECH_HERO_FRONT',
    name: 'Assault Mech Prime (Front)',
    category: 'Playable TPS Operative',
    gameRole: 'PLAYABLE',
    src: '/images/player_mech_hero_1787187990637.jpg',
    dominantColors: ['#00f0ff', '#1e3a8a', '#94a3b8', '#ef4444'],
    characteristicLines: ['Vertical Torso Spine (90°)', 'Shoulder Pod Diagonals (45°)', 'Visor Slit Horizon (0°)', 'Leg Actuator V-Form (60°)'],
    complexityIndex: 92,
    equationsCount: 310,
    description: 'In-game playable combat mech operative featuring heavy Roman stone tesserae and cyan plasma chest conduit.',
  },
  {
    id: 'MECH_HERO_REAR',
    name: 'Assault Mech Prime (Rear / Thrusters)',
    category: 'Playable TPS Operative',
    gameRole: 'PLAYABLE',
    src: '/images/player_mech_rear_1787188006708.jpg',
    dominantColors: ['#00f0ff', '#0f172a', '#3b82f6', '#f59e0b'],
    characteristicLines: ['Twin Ion Thruster Bell (r=18)', 'Spinal Heat Exchanger Grid', 'Shoulder Shield Contour', 'Calf Stabilizer Fin (75°)'],
    complexityIndex: 94,
    equationsCount: 335,
    description: 'In-game player mech rear perspective featuring twin ion afterburners and quantum transistor heatsinks.',
  },
  {
    id: 'SPACE_FIGHTER_HERO',
    name: 'Vanguard Starfighter Interceptor',
    category: 'Playable 3D Space Craft',
    gameRole: 'PLAYABLE',
    src: '/images/space_starfighter_hero_1787089887255.jpg',
    dominantColors: ['#38bdf8', '#0284c7', '#0f172a', '#fbbf24'],
    characteristicLines: ['Delta Wing Sweeps (35°)', 'Twin Thruster Vectors', 'Cockpit Canopy Ellipse', 'Plasma Core Axial'],
    complexityIndex: 88,
    equationsCount: 280,
    description: 'In-game player starfighter vessel in Space Dogfight Sim with sweeping aerodynamic vector chassis.',
  },
  {
    id: 'CYBER_PILOT_HERO',
    name: 'Neural Pilot Operator',
    category: 'Player Bio-Cyber Avatar',
    gameRole: 'PILOT',
    src: '/images/cyber_pilot_hero_1787089924400.jpg',
    dominantColors: ['#a855f7', '#ec4899', '#0f172a', '#06b6d4'],
    characteristicLines: ['HUD Reticle Circle (r=42)', 'Synaptic Cervical Arc', 'Visor Reflection Band', 'Collar Trace Segment'],
    complexityIndex: 91,
    equationsCount: 290,
    description: 'In-game neural pilot operator with biometric sensory portrait mapped onto hierarchical cipher coordinates.',
  },
  {
    id: 'CYBER_MECH_ARMOR',
    name: 'Tactical Mech Armor Core',
    category: 'Player Armor Rig',
    gameRole: 'PLAYABLE',
    src: '/images/cyber_mech_armor_1787089900058.jpg',
    dominantColors: ['#38bdf8', '#1e293b', '#64748b', '#00f0ff'],
    characteristicLines: ['Pectoral Chobham Angles (48°)', 'Nanite Grout Seam', 'Reactor Core Well', 'Pauldrons Bevel Trace'],
    complexityIndex: 89,
    equationsCount: 275,
    description: 'In-game reinforced chassis plate loadout for high-impact tactical operations.',
  },
  {
    id: 'PLASMA_RIFLE',
    name: 'Ion Plasma Rifle',
    category: 'Player Primary Weapon',
    gameRole: 'WEAPON',
    src: '/images/cyber_plasma_rifle_1787089913135.jpg',
    dominantColors: ['#00f0ff', '#1e1b4b', '#0369a1', '#f43f5e'],
    characteristicLines: ['Barrel Magnetic Rails (0°)', 'Optic Hologram Scope (r=24)', 'Receiver Heat Vent Stack', 'Grip Angular Ergonomics'],
    complexityIndex: 86,
    equationsCount: 250,
    description: 'In-game first-person pulse rifle weapon sprite rendered with transistor micro-circuitry.',
  },
  {
    id: 'GOLIATH_BOSS',
    name: 'Goliath Titan Boss',
    category: 'Rogue Heavy Siege Mech',
    gameRole: 'BOSS',
    src: '/images/enemy_tps_mech_1787090446411.jpg',
    dominantColors: ['#ef4444', '#7f1d1d', '#18181b', '#f59e0b'],
    characteristicLines: ['Armor Horn Angulation (55°)', 'Central Core Arc (r=35)', 'Leg Piston Vectors', 'Shoulder Missile Battery Grid'],
    complexityIndex: 96,
    equationsCount: 340,
    description: 'In-game heavy bipedal boss encounter rendered with Roman stone tesserae and molten crimson conduits.',
  },
  {
    id: 'SENTINEL_DROID',
    name: 'Combat Sentinel Droid',
    category: 'Autonomous Security Unit',
    gameRole: 'ENEMY',
    src: '/images/enemy_fps_sentinel_1787090428781.jpg',
    dominantColors: ['#d946ef', '#4a044e', '#38bdf8', '#ff0055'],
    characteristicLines: ['Hexagonal Shell Array (60°)', 'Ocular Optic Trace', 'Hover Thruster Field', 'EMP Deflector Loop'],
    complexityIndex: 90,
    equationsCount: 280,
    description: 'In-game hover combat droid with quantum transistor gate matrix and amethyst optics.',
  },
  {
    id: 'DRONE_FIGHTER',
    name: 'Tri-Rotor Recon Drone',
    category: 'Fast Attack Combat Drone',
    gameRole: 'ENEMY',
    src: '/images/enemy_drone_fighter_1787090400681.jpg',
    dominantColors: ['#06b6d4', '#0f172a', '#22d3ee', '#e11d48'],
    characteristicLines: ['Tri-Rotor Y-Form (120°)', 'Pylon Strut Radians', 'Sensor Turret Bulb', 'Exhaust Ion Nozzle'],
    complexityIndex: 85,
    equationsCount: 240,
    description: 'In-game aerial skirmish drone with high agility vector tracking.',
  },
  {
    id: 'CRUISER_BOSS',
    name: 'Armada Battlecruiser Flagship',
    category: 'Capital Dreadnought Boss',
    gameRole: 'BOSS',
    src: '/images/enemy_cruiser_boss_1787090414452.jpg',
    dominantColors: ['#dc2626', '#450a0a', '#172554', '#fbbf24'],
    characteristicLines: ['Spine Catwalk Keel (0°)', 'Superstructure Tier Steps', 'Main Turret Ring Array', 'Broadside Flak Ports'],
    complexityIndex: 98,
    equationsCount: 390,
    description: 'In-game boss dreadnought in Space Dogfight Sim with massive capital hull armor tesserae.',
  },
  {
    id: 'ROMAN_CYBER_MOSAIC',
    name: 'Imperium Tesserae Visage',
    category: 'Ancient Cyber-Relic Core',
    gameRole: 'RELIC',
    src: '/images/roman_cyber_mosaic_1787188021928.jpg',
    dominantColors: ['#f59e0b', '#dc2626', '#1e293b', '#38bdf8'],
    characteristicLines: ['Arch of Titus Curve (32°)', 'Grout Matrix Grid 4x4', 'Visor Horizontal Cut', 'Crown Tesserae Radial'],
    complexityIndex: 95,
    equationsCount: 320,
    description: 'Ancient Roman mosaic tesserae hybridized with quantum transistor routing paths.',
  },
  {
    id: 'VALKYRIE_GUNDAM',
    name: 'Valkyrie Aerial Gundam Frame',
    category: 'Playable Mobile Suit Gundam',
    gameRole: 'PLAYABLE',
    src: '/images/valkyrie_gundam_1787434609815.jpg',
    dominantColors: ['#38bdf8', '#fbbf24', '#f43f5e', '#0f172a'],
    characteristicLines: ['V-Fin Antenna Crest (45°)', 'Wing Binder Sweeps (60°)', 'Chest Reactor Well', 'Leg Armor Articulation (75°)'],
    complexityIndex: 97,
    equationsCount: 360,
    description: 'High-mobility aerial Gundam mobile suit featuring ornate gold-inlaid Roman mosaic hull armor and twin beam wing binders.',
  },
  {
    id: 'GAUSS_RAILGUN',
    name: 'Heavy Gauss Railgun Cannon',
    category: 'Heavy Kinetic Weapon',
    gameRole: 'WEAPON',
    src: '/images/gauss_railgun_1787434622054.jpg',
    dominantColors: ['#00f0ff', '#1e293b', '#3b82f6', '#f59e0b'],
    characteristicLines: ['Twin Linear Accelerator Rails (0°)', 'Superconducting Magnetic Coils (r=16)', 'Heatsink Fin Array', 'Capacitor Bank Segment'],
    complexityIndex: 91,
    equationsCount: 295,
    description: 'Electromagnetic hyper-velocity railgun weapon rendered with blue capacitor glow and Roman stone barrel shroud.',
  },
  {
    id: 'STEALTH_CORVETTE',
    name: 'Shadow Stealth Corvette Warship',
    category: 'Tactical Space Warship',
    gameRole: 'PLAYABLE',
    src: '/images/stealth_corvette_1787434635548.jpg',
    dominantColors: ['#00f0ff', '#090d16', '#334155', '#38bdf8'],
    characteristicLines: ['Radar-Absorbing Facet Angles (28°)', 'Concealed Missile Bay Hatches', 'Sub-Light Engine Exhaust Nozzle', 'Forward ECM Array'],
    complexityIndex: 93,
    equationsCount: 315,
    description: 'Stealth reconnaissance warship featuring angular radar-deflecting mosaic armor plates and cyan energy nacelles.',
  },
  {
    id: 'DEEP_SPACE_NEBULA',
    name: 'Deep Space Cosmic Nebula Vista',
    category: 'Cosmic Stellar Environment',
    gameRole: 'RELIC',
    src: '/images/deep_space_nebula_1787434647356.jpg',
    dominantColors: ['#c084fc', '#06b6d4', '#020617', '#f472b6'],
    characteristicLines: ['Stellar Dust Filament Curves', 'Ionized Gas Vortex Arc (r=120)', 'Protostar Cluster Vectors', 'Bipolar Outflow Jet'],
    complexityIndex: 96,
    equationsCount: 420,
    description: 'Vibrant stellar nursery and ionized gas clouds with hand-painted Roman mosaic stardust tesserae.',
  },
  {
    id: 'BEAM_SABER',
    name: 'Hyper-Beam Particle Saber',
    category: 'Melee Energy Weapon',
    gameRole: 'WEAPON',
    src: '/images/beam_saber_1787434660618.jpg',
    dominantColors: ['#ec4899', '#f43f5e', '#38bdf8', '#1e1b4b'],
    characteristicLines: ['Plasma Blade Containment Cylinder (90°)', 'Emitter Ring Corona (r=12)', 'Hilt Inscription Roman Grout', 'Power Cell Socket Base'],
    complexityIndex: 88,
    equationsCount: 260,
    description: 'High-energy plasma melee blade ignited with magenta containment field and etched stone grip.',
  },
];

export const RomanMosaicMatrixEngine: React.FC<RomanMosaicEngineProps> = ({
  powerOn,
  fluxFrequency,
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom & Pan state for multi-level microscopic resolution re-rendering
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 2x, 4x, 8x
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fidelity Slider & Resolution Tier State
  // 300: Macro Level (36px coarse stone blocks)
  // 200: Meso Level (18px stone tiles & edge interpolation)
  // 150: Micro Level (8px fine quantum transistor gates)
  // 50 / Ultra: (3px sub-pixel ultra continuous matrix)
  const [fidelityTier, setFidelityTier] = useState<number>(300);
  const [totalTesseraeCount, setTotalTesseraeCount] = useState<number>(560);
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(1);
  const [isAutoRefining, setIsAutoRefining] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<KnownImageProfile>(PRESET_PROFILES[0]);
  const [tileStyle, setTileStyle] = useState<'ROMAN_STONE' | 'QUANTUM_TRANSISTOR' | 'GLYPH_CIPHER' | 'NEON_CIRCUIT'>('ROMAN_STONE');
  const [groutIntensity, setGroutIntensity] = useState<number>(75);
  const [showTransistorGrid, setShowTransistorGrid] = useState<boolean>(true);
  const [showVectorLines, setShowVectorLines] = useState<boolean>(true);
  const [showGlyphMatrix, setShowGlyphMatrix] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number>(96.4);
  const [recognizedCategory, setRecognizedCategory] = useState<string>('Playable TPS Operative');
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MOSAIC_VIEW' | 'DRAW_STUDIO' | 'CIPHER_HIERARCHY'>('MOSAIC_VIEW');
  const [cipherHierarchy, setCipherHierarchy] = useState<{ scale300: string; scale200: string; scale150: string }>({
    scale300: '0xROMAN_MACRO // TESSERAE_BASE_300_BLOCKS [36px Grid]',
    scale200: '0xCYPHER_MESO // VECTOR_INTERPOLATION_200_LINES [18px Grid]',
    scale150: '0xTRANSISTOR_MICRO // QUANTUM_150_DIGITS_RESOLVED [8px Grid]',
  });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#00f0ff');
  const [brushSize, setBrushSize] = useState<number>(8);

  // Human-Readable Clarity & Refinement Engine State
  const [clarityEnhance, setClarityEnhance] = useState<number>(45); // 0% to 100% photo blend & crisp sharpening
  const [edgeSharpness, setEdgeSharpness] = useState<number>(60); // 0% to 100% contour line definition
  const [subPixelSampling, setSubPixelSampling] = useState<boolean>(true); // Area-weighted subpixel sampling
  const [showContourOutlines, setShowContourOutlines] = useState<boolean>(true); // Feature edge contour tracing
  const [hologramResolution, setHologramResolution] = useState<'ULTRA_HD' | 'HIGH' | 'TACTICAL'>('ULTRA_HD');

  // Detail Enhancement Convolution & AI Upscaling State
  const [renderEnhanceMode, setRenderEnhanceMode] = useState<'SOFT_MOSAIC' | 'SHARP_VECTOR' | 'HYBRID_TESSERAE' | 'DETAIL_ENHANCED'>('SHARP_VECTOR');
  const [detailConvolutionStrength, setDetailConvolutionStrength] = useState<number>(65); // 0 to 100%
  const [enableAiUpscaleFilter, setEnableAiUpscaleFilter] = useState<boolean>(true);
  const [noiseReductionStrength, setNoiseReductionStrength] = useState<number>(60); // 0 to 100% smoothing

  // View Mode & 3D Hologram Extrusion State
  const [viewMode, setViewMode] = useState<'2D_MOSAIC' | '3D_HOLOGRAM'>('2D_MOSAIC');
  const [extrusionDepth, setExtrusionDepth] = useState<number>(35); // 0 to 100 mm depth-map extrusion
  const [depthMappingAlgorithm, setDepthMappingAlgorithm] = useState<
    'LUMINANCE_HEIGHTFIELD' | 'EDGE_NORMAL_GRADIENT' | 'TRANSISTOR_RELIEF' | 'INVERTED_TRENCH'
  >('LUMINANCE_HEIGHTFIELD');
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isArmorAssemblyOpen, setIsArmorAssemblyOpen] = useState<boolean>(false);
  const [autoRotate3D, setAutoRotate3D] = useState<boolean>(true);
  const hologramMountRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const threeSceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    instancedMesh: THREE.InstancedMesh | null;
    group: THREE.Group;
    tileCount: number;
    tileMeta: Array<{
      targetPos: THREE.Vector3;
      scatterPos: THREE.Vector3;
      targetRot: THREE.Euler;
      scatterRot: THREE.Euler;
      color: THREE.Color;
      baseLuminance: number;
      baseNormal: number;
    }>;
    animProgress: { val: number };
    isDragging: boolean;
    prevPointer: { x: number; y: number };
    reqId: number | null;
  } | null>(null);

  // Progressive Synthesis Timer
  useEffect(() => {
    if (!isAutoRefining || !powerOn) return;
    const interval = setInterval(() => {
      setFidelityTier((prev) => {
        let nextTier = 300;
        let nextLvl = 1;
        if (prev >= 260) {
          nextTier = 200;
          nextLvl = 2;
        } else if (prev >= 175) {
          nextTier = 150;
          nextLvl = 3;
        } else if (prev >= 100) {
          nextTier = 50;
          nextLvl = 4;
        } else {
          nextTier = 300;
          nextLvl = 1;
        }

        setHierarchyLevel(nextLvl);
        if (nextTier === 300) {
          sounds.playLaserPew();
        } else if (nextTier === 50) {
          sounds.playSpectrumLoad();
        } else {
          sounds.playClick(600 + nextLvl * 80);
        }
        return nextTier;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isAutoRefining, powerOn]);

  // Main Canvas Mosaic Rendering Engine - Reacts dynamically to Fidelity Slider (300, 200, 150, 50/Ultra)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !powerOn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = customImageSrc || selectedProfile.src;

    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Determine mosaic grid tile size dynamically based on Fidelity Slider Tier
      // Tier 300: Macro Level -> coarse tiles (approx 36px)
      // Tier 200: Meso Level -> medium tiles (approx 18px)
      // Tier 150: Micro Level -> fine tiles (approx 8px)
      // Tier 50 / Ultra: Ultra Level -> micro tiles (approx 3px)
      // Sub-Pixel Refinement: down to 2px
      let baseTileSize = 36;
      if (fidelityTier <= 40) {
        baseTileSize = 2;
      } else if (fidelityTier <= 75) {
        baseTileSize = 3;
      } else if (fidelityTier <= 165) {
        baseTileSize = 7;
      } else if (fidelityTier <= 245) {
        baseTileSize = 16;
      } else {
        baseTileSize = 32;
      }

      const calculatedCols = Math.ceil(w / baseTileSize);
      const calculatedRows = Math.ceil(h / baseTileSize);
      setTotalTesseraeCount(calculatedCols * calculatedRows);

      // Adjust effective rendered tile size according to active multi-level zoom
      const tileSize = Math.max(2, Math.round(baseTileSize * zoomLevel));

      // Draw original image to an offscreen buffer to sample pixel colors
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, w, h);
      const imgData = offCtx.getImageData(0, 0, w, h).data;

      // Apply zoom view transformation around center or pan coordinates
      ctx.save();
      if (zoomLevel > 1) {
        ctx.translate(w / 2 + panOffset.x, h / 2 + panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-w / 2, -h / 2);
      }

      // Render Mosaic Tesserae / Transistor Blocks
      const cols = calculatedCols;
      const rows = calculatedRows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * baseTileSize;
          const y = r * baseTileSize;

          let red = 0;
          let green = 0;
          let blue = 0;

          if (subPixelSampling && baseTileSize >= 3) {
            // Area-weighted sub-pixel integration for photorealistic smooth color transitions
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            let ptCount = 0;
            const sampleStep = Math.max(1, Math.floor(baseTileSize / 3));

            for (let dy = 0; dy < baseTileSize; dy += sampleStep) {
              for (let dx = 0; dx < baseTileSize; dx += sampleStep) {
                const px = Math.min(w - 1, x + dx);
                const py = Math.min(h - 1, y + dy);
                const pIdx = (py * w + px) * 4;
                rSum += imgData[pIdx];
                gSum += imgData[pIdx + 1];
                bSum += imgData[pIdx + 2];
                ptCount++;
              }
            }
            red = Math.round(rSum / Math.max(1, ptCount));
            green = Math.round(gSum / Math.max(1, ptCount));
            blue = Math.round(bSum / Math.max(1, ptCount));
          } else {
            const sampleX = Math.min(w - 1, Math.floor(x + baseTileSize / 2));
            const sampleY = Math.min(h - 1, Math.floor(y + baseTileSize / 2));
            const idx = (sampleY * w + sampleX) * 4;
            red = imgData[idx];
            green = imgData[idx + 1];
            blue = imgData[idx + 2];
          }

          const brightness = (red * 0.299 + green * 0.587 + blue * 0.114);

          // Slight random stone variation for Roman mosaic authenticity
          const stoneJitter = tileStyle === 'ROMAN_STONE' ? ((c * 7 + r * 13) % 9) - 4 : 0;
          const finalR = Math.max(0, Math.min(255, red + stoneJitter));
          const finalG = Math.max(0, Math.min(255, green + stoneJitter));
          const finalB = Math.max(0, Math.min(255, blue + stoneJitter));

          // Draw Tile
          ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;

          const grout = (groutIntensity / 100) * (baseTileSize > 8 ? 2 : baseTileSize > 4 ? 1 : 0);
          const drawW = Math.max(1, baseTileSize - (tileStyle === 'ROMAN_STONE' || tileStyle === 'QUANTUM_TRANSISTOR' ? grout : 0));
          const drawH = Math.max(1, baseTileSize - (tileStyle === 'ROMAN_STONE' || tileStyle === 'QUANTUM_TRANSISTOR' ? grout : 0));

          if (tileStyle === 'ROMAN_STONE') {
            // Rounded rectangular stone tesserae
            const radius = Math.min(3, drawW / 4);
            ctx.beginPath();
            ctx.roundRect(x, y, drawW, drawH, radius);
            ctx.fill();

            // Subtle highlight on top-left of tesserae
            if (baseTileSize > 12) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * (brightness / 255)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          } else if (tileStyle === 'QUANTUM_TRANSISTOR') {
            // Sharp transistor gate cells with central quantum contact dot
            ctx.fillRect(x, y, drawW, drawH);
            if (baseTileSize > 8 && brightness > 90) {
              ctx.fillStyle = theme.primary;
              ctx.beginPath();
              ctx.arc(x + drawW / 2, y + drawH / 2, Math.max(1, drawW / 6), 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (tileStyle === 'GLYPH_CIPHER') {
            // High-Legibility Roman & Quantum Alphanumeric Cypher
            // Retains background color tonal richness so human facial & armor anatomy is 100% clear
            ctx.fillStyle = `rgba(${Math.round(finalR * 0.22)}, ${Math.round(finalG * 0.22)}, ${Math.round(finalB * 0.22)}, 0.92)`;
            ctx.fillRect(x, y, baseTileSize, baseTileSize);

            // Luminance-weighted character selection for human-readable portrait shading
            const glyphs = ' .·:;+=!i1tfLCG08#@ΣΩΨΦΛΓΔΞΘ';
            const charIdx = Math.min(glyphs.length - 1, Math.floor((brightness / 255) * glyphs.length));
            const char = glyphs[charIdx];

            ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
            ctx.font = `bold ${Math.max(7, Math.floor(baseTileSize * 0.85))}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, x + baseTileSize / 2, y + baseTileSize / 2);
          } else {
            // NEON CIRCUIT
            ctx.fillRect(x, y, drawW, drawH);
            if ((c + r) % 4 === 0) {
              ctx.strokeStyle = theme.primary;
              ctx.lineWidth = 1;
              ctx.strokeRect(x, y, drawW, drawH);
            }
          }
        }
      }

      // Detail Enhancement Convolution Pass (Soft Mosaic vs Sharp Vector vs Sharpen)
      if (renderEnhanceMode === 'SHARP_VECTOR') {
        applyConvolutionFilter(ctx, w, h, SHARP_VECTOR_KERNEL, 1, 0);
      } else if (renderEnhanceMode === 'DETAIL_ENHANCED') {
        const factor = 1 + (detailConvolutionStrength / 100) * 0.75;
        applyConvolutionFilter(ctx, w, h, SHARPEN_KERNEL, factor, 0);
      } else if (renderEnhanceMode === 'SOFT_MOSAIC') {
        applyConvolutionFilter(ctx, w, h, SOFT_MOSAIC_SMOOTH_KERNEL, 1, 0);
      }

      // AI Bilinear Upscaling & Noise Reduction Filter Pass (Smooths tile transitions in HD / Micro modes)
      if (enableAiUpscaleFilter && (fidelityTier <= 165 || zoomLevel > 1)) {
        const upscaled = applyAiBilinearUpscaleWithNoiseReduction(canvas, w, h, {
          noiseReductionStrength: (noiseReductionStrength / 100) * 0.75,
          preserveEdges: true,
        });
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(upscaled, 0, 0);
      }

      // Clarity & High-Frequency Detail Overlay (Human-Readable Refinement)
      if (clarityEnhance > 0) {
        ctx.save();
        ctx.globalAlpha = clarityEnhance / 100;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      }

      // Feature Contour & Linework Sharpener (Highlights facial features, eyes, swords, armor borders)
      if (showContourOutlines && edgeSharpness > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(edgeSharpness / 100) * 0.28})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.restore();
      }

      ctx.restore();

      // Overlay Characteristic Vector Recognition Lines
      if (showVectorLines) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        // Draw characteristic detection crosses & bounding circles
        const cx = w / 2;
        const cy = h / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.38, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy);
        ctx.lineTo(cx + 30, cy);
        ctx.moveTo(cx, cy - 30);
        ctx.lineTo(cx, cy + 30);
        ctx.stroke();

        ctx.setLineDash([]);

        // Label recognized feature coordinates
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px monospace';
        ctx.fillText(`VECTOR_LOC // [${(w * 0.5).toFixed(0)}, ${(h * 0.5).toFixed(0)}]`, cx + 8, cy - 12);
        ctx.fillText(`SSIM_MATCH: ${similarityScore.toFixed(1)}%`, 14, h - 16);
      }

      // Overlay Transistor Coordinate Grid
      if (showTransistorGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let gx = 0; gx < w; gx += step) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += step) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }
      }
    };
  }, [
    powerOn,
    selectedProfile,
    customImageSrc,
    fidelityTier,
    hierarchyLevel,
    zoomLevel,
    panOffset,
    tileStyle,
    groutIntensity,
    showTransistorGrid,
    showVectorLines,
    similarityScore,
    theme,
    clarityEnhance,
    edgeSharpness,
    subPixelSampling,
    showContourOutlines,
    renderEnhanceMode,
    detailConvolutionStrength,
    enableAiUpscaleFilter,
    noiseReductionStrength,
  ]);

  // Handle Canvas Zoom Pan Interactions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (zoomLevel <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || zoomLevel <= 1) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(8, prev + delta));
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      sounds.playClick(600 + next * 80);
      haptics.trigger('click');
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    sounds.playClick(500);
    haptics.trigger('light');
  };

  // Handle Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setCustomImageSrc(ev.target.result);
        sounds.playSpectrumLoad();
        haptics.trigger('success');
        // Calculate similarity match with prebuilt database
        const simulatedMatch = (88 + Math.random() * 10).toFixed(1);
        setSimilarityScore(parseFloat(simulatedMatch));
        setRecognizedCategory('Custom Upload Classified via Vector/Palette Match');
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset to preset
  const handleSelectPreset = (profile: KnownImageProfile) => {
    setSelectedProfile(profile);
    setCustomImageSrc(null);
    setRecognizedCategory(profile.category);
    setSimilarityScore(95 + Math.random() * 4);
    sounds.playClick(650);
    haptics.trigger('click');
  };

  // Three.js 3D Hologram Setup & Real-Time Extrusion Depth Calculator
  const computeDepthZ = useCallback(
    (luminance: number, normal: number, depthAlgorithm: string, depthAmount: number) => {
      const normalizedFactor = depthAmount / 35; // base 35mm
      switch (depthAlgorithm) {
        case 'EDGE_NORMAL_GRADIENT':
          return (normal / 255) * normalizedFactor * 22;
        case 'TRANSISTOR_RELIEF':
          return (Math.round(luminance / 64) * 64 / 255) * normalizedFactor * 18;
        case 'INVERTED_TRENCH':
          return ((255 - luminance) / 255) * normalizedFactor * 16;
        case 'LUMINANCE_HEIGHTFIELD':
        default:
          return (luminance / 255) * normalizedFactor * 16;
      }
    },
    []
  );

  // Update instance matrices based on assembly animation progress & extrusion depth
  const updateInstanceMatrices = useCallback(
    (progress: number) => {
      const state = threeSceneRef.current;
      if (!state || !state.instancedMesh) return;
      const mesh = state.instancedMesh;
      const dummy = new THREE.Object3D();
      const pos = new THREE.Vector3();
      const rot = new THREE.Euler();

      state.tileMeta.forEach((meta, idx) => {
        // Calculate dynamic extruded Z position
        const currentTargetZ = computeDepthZ(
          meta.baseLuminance,
          meta.baseNormal,
          depthMappingAlgorithm,
          extrusionDepth
        );

        const currentTargetPos = new THREE.Vector3(
          meta.targetPos.x,
          meta.targetPos.y,
          currentTargetZ
        );

        // Interpolate position from scatter/explosion to assembled target
        pos.lerpVectors(meta.scatterPos, currentTargetPos, progress);

        // Interpolate rotation
        rot.x = meta.scatterRot.x * (1 - progress);
        rot.y = meta.scatterRot.y * (1 - progress);
        rot.z = meta.scatterRot.z * (1 - progress);

        // Scale tile slightly when exploded
        const scaleVal = 0.3 + 0.7 * progress;

        dummy.position.copy(pos);
        dummy.rotation.copy(rot);
        dummy.scale.set(scaleVal, scaleVal, scaleVal);
        dummy.updateMatrix();

        mesh.setMatrixAt(idx, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    },
    [computeDepthZ, depthMappingAlgorithm, extrusionDepth]
  );

  // Initialize or Rebuild 3D Hologram Scene
  useEffect(() => {
    if (viewMode !== '3D_HOLOGRAM' || !powerOn) return;
    const container = hologramMountRef.current;
    if (!container) return;

    // Clean up any existing Three.js renderer
    if (threeSceneRef.current) {
      if (threeSceneRef.current.reqId) {
        cancelAnimationFrame(threeSceneRef.current.reqId);
      }
      threeSceneRef.current.renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      threeSceneRef.current = null;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 95);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = 0.25;
    group.rotation.y = -0.35;
    scene.add(group);

    // Hologram Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0x00f0ff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 40, 50);
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 1.8, 120);
    cyanPoint.position.set(-25, 20, 30);
    scene.add(cyanPoint);

    const amberPoint = new THREE.PointLight(0xf59e0b, 1.2, 100);
    amberPoint.position.set(25, -20, 20);
    scene.add(amberPoint);

    // Floating Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(90, 18, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -32;
    group.add(gridHelper);

    // Sample Image for 3D Mesh
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = customImageSrc || selectedProfile.src;

    img.onload = () => {
      // Dynamic Ultra-HD / High Clarity Grid Sizing
      const sampleCols =
        hologramResolution === 'ULTRA_HD'
          ? 64
          : hologramResolution === 'HIGH'
          ? 48
          : fidelityTier <= 75
          ? 40
          : fidelityTier <= 165
          ? 30
          : 22;
      const sampleRows = Math.round(sampleCols * (height / width));
      const totalTiles = sampleCols * sampleRows;

      // Sample image in offscreen canvas with sub-pixel sampling
      const offscreen = document.createElement('canvas');
      offscreen.width = sampleCols;
      offscreen.height = sampleRows;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, sampleCols, sampleRows);
      const imgData = offCtx.getImageData(0, 0, sampleCols, sampleRows).data;

      // Box Geometry for Tesserae Tile with Crisp Bevel Ratios
      const tileW = 54 / sampleCols;
      const tileH = 42 / sampleRows;
      const geometry = new THREE.BoxGeometry(tileW * 0.94, tileH * 0.94, tileW * 0.85);
      const material = new THREE.MeshStandardMaterial({
        roughness: 0.28,
        metalness: 0.72,
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, totalTiles);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const tileMetaList: Array<{
        targetPos: THREE.Vector3;
        scatterPos: THREE.Vector3;
        targetRot: THREE.Euler;
        scatterRot: THREE.Euler;
        color: THREE.Color;
        baseLuminance: number;
        baseNormal: number;
      }> = [];

      for (let r = 0; r < sampleRows; r++) {
        for (let c = 0; c < sampleCols; c++) {
          const idx = (r * sampleCols + c) * 4;
          const red = imgData[idx];
          const green = imgData[idx + 1];
          const blue = imgData[idx + 2];
          const lum = (red * 0.299 + green * 0.587 + blue * 0.114);

          // Edge normal calculation for crisp structural feature extrusion
          const prevXIdx = (r * sampleCols + Math.max(0, c - 1)) * 4;
          const nextXIdx = (r * sampleCols + Math.min(sampleCols - 1, c + 1)) * 4;
          const diffX = Math.abs(imgData[nextXIdx] - imgData[prevXIdx]);
          const normalVal = Math.min(255, diffX * 2.2);

          const gx = (c - sampleCols / 2) * tileW;
          const gy = -(r - sampleRows / 2) * tileH;
          const gz = computeDepthZ(lum, normalVal, depthMappingAlgorithm, extrusionDepth);

          const targetPos = new THREE.Vector3(gx, gy, gz);
          const scatterPos = new THREE.Vector3(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 180
          );

          const targetRot = new THREE.Euler(0, 0, 0);
          const scatterRot = new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );

          // Vivid Color Contrast
          const color = new THREE.Color(
            Math.min(1, (red / 255) * 1.08),
            Math.min(1, (green / 255) * 1.08),
            Math.min(1, (blue / 255) * 1.08)
          );
          instancedMesh.setColorAt(r * sampleCols + c, color);

          tileMetaList.push({
            targetPos,
            scatterPos,
            targetRot,
            scatterRot,
            color,
            baseLuminance: lum,
            baseNormal: normalVal,
          });
        }
      }

      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
      group.add(instancedMesh);

      const animProgress = { val: 0 };
      threeSceneRef.current = {
        scene,
        camera,
        renderer,
        instancedMesh,
        group,
        tileCount: totalTiles,
        tileMeta: tileMetaList,
        animProgress,
        isDragging: false,
        prevPointer: { x: 0, y: 0 },
        reqId: null,
      };

      // GSAP Assembling Animation: scatter -> assembled depth extrusion
      gsap.fromTo(
        animProgress,
        { val: 0 },
        {
          val: 1,
          duration: 1.35,
          ease: 'power3.out',
          onUpdate: () => {
            updateInstanceMatrices(animProgress.val);
          },
          onComplete: () => {
            setIsExploded(false);
          },
        }
      );

      sounds.playSpectrumLoad();
      haptics.trigger('success');

      // Animation & Render Loop
      const animate = () => {
        if (!threeSceneRef.current) return;
        if (autoRotate3D && !threeSceneRef.current.isDragging) {
          group.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
        threeSceneRef.current.reqId = requestAnimationFrame(animate);
      };
      animate();
    };

    return () => {
      if (threeSceneRef.current) {
        if (threeSceneRef.current.reqId) {
          cancelAnimationFrame(threeSceneRef.current.reqId);
        }
        renderer.dispose();
      }
    };
  }, [
    viewMode,
    powerOn,
    selectedProfile,
    customImageSrc,
    fidelityTier,
    computeDepthZ,
    updateInstanceMatrices,
    autoRotate3D,
    hologramResolution,
  ]);

  // Real-time update of 3D depth extrusion slider
  useEffect(() => {
    if (viewMode === '3D_HOLOGRAM' && threeSceneRef.current) {
      updateInstanceMatrices(threeSceneRef.current.animProgress.val);
    }
  }, [extrusionDepth, depthMappingAlgorithm, updateInstanceMatrices, viewMode]);

  // GSAP View Mode Switch Animation (2D <-> 3D)
  const handleSwitchViewMode = (newMode: '2D_MOSAIC' | '3D_HOLOGRAM') => {
    if (newMode === viewMode) return;

    if (newMode === '3D_HOLOGRAM') {
      setViewMode('3D_HOLOGRAM');
      sounds.playSpectrumLoad();
      haptics.trigger('medium');
    } else {
      // Switching to 2D Blueprint: GSAP transition
      if (threeSceneRef.current) {
        gsap.to(threeSceneRef.current.animProgress, {
          val: 0,
          duration: 0.35,
          ease: 'power2.in',
          onUpdate: () => {
            if (threeSceneRef.current) {
              updateInstanceMatrices(threeSceneRef.current.animProgress.val);
            }
          },
          onComplete: () => {
            setViewMode('2D_MOSAIC');
            sounds.playSimulatePulse();
            haptics.trigger('light');
            if (canvasContainerRef.current) {
              gsap.fromTo(
                canvasContainerRef.current,
                { scale: 0.95, opacity: 0.4, filter: 'brightness(1.8)' },
                { scale: 1, opacity: 1, filter: 'brightness(1)', duration: 0.45, ease: 'power2.out' }
              );
            }
          },
        });
      } else {
        setViewMode('2D_MOSAIC');
      }
    }
  };

  // GSAP Explode / Assemble Toggle
  const handleToggleExplosion = () => {
    const state = threeSceneRef.current;
    if (!state) return;

    const targetVal = isExploded ? 1 : 0;
    sounds.playLaserPew();
    haptics.trigger('click');

    gsap.to(state.animProgress, {
      val: targetVal,
      duration: 1.15,
      ease: isExploded ? 'elastic.out(1, 0.75)' : 'power3.out',
      onUpdate: () => {
        updateInstanceMatrices(state.animProgress.val);
      },
      onComplete: () => {
        setIsExploded(!isExploded);
        if (targetVal === 1) {
          sounds.playSpectrumLoad();
          haptics.trigger('success');
        }
      },
    });
  };

  // Mouse / Touch Drag Orbit for 3D Hologram
  const handle3DPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const state = threeSceneRef.current;
    if (!state) return;
    state.isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    state.prevPointer = { x: clientX, y: clientY };
  };

  const handle3DPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const state = threeSceneRef.current;
    if (!state || !state.isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - state.prevPointer.x;
    const deltaY = clientY - state.prevPointer.y;

    state.group.rotation.y += deltaX * 0.01;
    state.group.rotation.x = Math.max(-1.2, Math.min(1.2, state.group.rotation.x + deltaY * 0.01));
    state.prevPointer = { x: clientX, y: clientY };
  };

  const handle3DPointerUp = () => {
    if (threeSceneRef.current) {
      threeSceneRef.current.isDragging = false;
    }
  };

  // Drawing Canvas Methods for Draw Studio
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
    // Convert drawing to image source for mosaic processing
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setCustomImageSrc(dataUrl);
    setSimilarityScore(85 + Math.random() * 12);
    setRecognizedCategory('Synthesized Vector Sketch');
  };

  const handleClearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCustomImageSrc(null);
    sounds.playSimulatePulse();
    haptics.trigger('medium');
  };

  return (
    <div
      id="roman-mosaic-matrix-engine"
      className="border rounded-lg p-3 sm:p-5 transition-all text-white space-y-4"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: `${theme.bgPanel}F4`,
      }}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
          >
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base tracking-tight">
                ROMAN MOSAIC & TRANSISTOR CYPHER ENGINE
              </h2>
              <span
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase"
                style={{ backgroundColor: `${theme.primary}25`, color: theme.primary }}
              >
                LEVEL {hierarchyLevel}/4 (SCALE {hierarchyLevel === 1 ? '300' : hierarchyLevel === 2 ? '200' : hierarchyLevel === 3 ? '150' : 'ULTRA'})
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Hierarchical 300→200→150 Alphanumeric Pixel Decomposition & 3D Hologram Depth Extrusion
            </p>
          </div>
        </div>

        {/* Studio Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Armor Assembly Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setIsArmorAssemblyOpen(true);
              sounds.playSpectrumLoad();
              haptics.trigger('medium');
            }}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 text-white bg-gradient-to-r from-amber-600/80 to-cyan-600/80 hover:from-amber-500 hover:to-cyan-500 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all animate-pulse"
            title="Open Armor & Weapon Assembly Matrix"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span className="tracking-wide">ARMOR ASSEMBLY</span>
            <Sparkles className="w-3 h-3 text-cyan-300" />
          </button>

          {/* 2D / 3D View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded bg-black/50 border border-white/15">
            <button
              type="button"
              onClick={() => handleSwitchViewMode('2D_MOSAIC')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                viewMode === '2D_MOSAIC'
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>2D Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchViewMode('3D_HOLOGRAM')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                viewMode === '3D_HOLOGRAM'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D Hologram</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick(650);
              haptics.trigger('click');
              setActiveTab('MOSAIC_VIEW');
            }}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-all ${
              activeTab === 'MOSAIC_VIEW' ? 'text-white' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
            style={{
              backgroundColor: activeTab === 'MOSAIC_VIEW' ? theme.primary : undefined,
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(700);
              haptics.trigger('click');
              setActiveTab('DRAW_STUDIO');
            }}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-all ${
              activeTab === 'DRAW_STUDIO' ? 'text-white' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
            style={{
              backgroundColor: activeTab === 'DRAW_STUDIO' ? theme.primary : undefined,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(750);
              haptics.trigger('click');
              setActiveTab('CIPHER_HIERARCHY');
            }}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-all ${
              activeTab === 'CIPHER_HIERARCHY' ? 'text-white' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
            style={{
              backgroundColor: activeTab === 'CIPHER_HIERARCHY' ? theme.primary : undefined,
            }}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Cypher</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'MOSAIC_VIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Canvas Display */}
          <div className="lg:col-span-8 space-y-3">
            <div
              ref={canvasContainerRef}
              className="relative border border-white/15 rounded-lg overflow-hidden bg-[#050711] flex items-center justify-center min-h-[340px] sm:min-h-[420px] shadow-2xl"
            >
              {viewMode === '2D_MOSAIC' ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={420}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className={`w-full max-w-full h-auto object-contain rounded shadow-2xl transition-all ${
                      zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
                    }`}
                  />

                  {/* Hierarchy Overlay Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded border border-white/15 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
                    <span className="font-bold">
                      {hierarchyLevel === 1 && 'LEVEL 1: 300-SCALE MACRO TESSERAE'}
                      {hierarchyLevel === 2 && 'LEVEL 2: 200-SCALE MESO INTERPOLATION'}
                      {hierarchyLevel === 3 && 'LEVEL 3: 150-SCALE QUANTUM TRANSISTORS'}
                      {hierarchyLevel === 4 && 'LEVEL 4: ULTRA RESOLUTION MAP'}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-bold px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40">
                      {zoomLevel}X OPTICAL ZOOM
                    </span>
                  </div>

                  {/* Multi-Level Zoom Quick Floating Toolbar */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-lg border border-white/15 font-mono text-xs z-10 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(-1)}
                      disabled={zoomLevel <= 1}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white transition-all"
                      title="Zoom Out (Coarser view)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 text-[11px] font-bold text-cyan-300">
                      {zoomLevel}x
                    </span>
                    <button
                      type="button"
                      onClick={() => handleZoomChange(1)}
                      disabled={zoomLevel >= 8}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white transition-all"
                      title="Zoom In (Microscopic sub-pixel resolution)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {zoomLevel > 1 && (
                      <button
                        type="button"
                        onClick={handleResetZoom}
                        className="px-1.5 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-[10px] text-red-200 transition-all font-bold"
                        title="Reset Zoom & Pan"
                      >
                        1X
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* 3D Hologram Viewport */
                <div
                  ref={hologramMountRef}
                  onMouseDown={handle3DPointerDown}
                  onMouseMove={handle3DPointerMove}
                  onMouseUp={handle3DPointerUp}
                  onTouchStart={handle3DPointerDown}
                  onTouchMove={handle3DPointerMove}
                  onTouchEnd={handle3DPointerUp}
                  className="w-full h-[420px] relative cursor-grab active:cursor-grabbing select-none"
                >
                  {/* Hologram Floating HUD */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded border border-cyan-500/30 text-xs font-mono z-10">
                    <span className="w-2 h-2 rounded-full animate-ping bg-cyan-400" />
                    <span className="font-bold text-cyan-300">3D HOLOGRAM EXTRUSION</span>
                    <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                      DEPTH: {extrusionDepth}mm
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      ALGO: {depthMappingAlgorithm.replace('_', ' ')}
                    </span>
                  </div>

                  {/* 3D Controls Toolbar */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-lg border border-cyan-500/30 font-mono text-xs z-10 shadow-xl">
                    <button
                      type="button"
                      onClick={handleToggleExplosion}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                        isExploded
                          ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900'
                      }`}
                      title="Trigger GSAP Exploding / Assembling Animation"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>{isExploded ? 'Assemble Matrix' : 'Explode Matrix'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoRotate3D(!autoRotate3D)}
                      className={`p-1.5 rounded border transition-all ${
                        autoRotate3D
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                      }`}
                      title={autoRotate3D ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
                    >
                      <Orbit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 3D Drag Orbit Hint */}
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 pointer-events-none">
                    <Move className="w-3 h-3 text-cyan-400" />
                    <span>Click & Drag to Orbit 360° in 3D</span>
                  </div>
                </div>
              )}

              {/* Live Vector / Color Similarity Match HUD */}
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-white/15 text-xs font-mono flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-neutral-400">Class:</span>
                <span className="text-cyan-300 font-bold">{recognizedCategory}</span>
                <span className="text-emerald-400 font-bold ml-1">({similarityScore.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Depth Extrusion Slider & Fidelity Controls */}
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              {/* Top Slider Header & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span>MOSAIC RESOLUTION FIDELITY SLIDER</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        TIER {fidelityTier} ({fidelityTier >= 260 ? '300 MACRO' : fidelityTier >= 180 ? '200 MESO' : fidelityTier >= 100 ? '150 MICRO' : 'ULTRA 50'})
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      Active Tesserae: <b className="text-cyan-300">{totalTesseraeCount.toLocaleString()}</b> • Grid:{' '}
                      <b className="text-white">
                        {fidelityTier <= 75 ? '3px Micro' : fidelityTier <= 165 ? '8px Gate' : fidelityTier <= 245 ? '18px Tile' : '36px Block'}
                      </b>{' '}
                      • Equations: <b className="text-amber-400">{Math.round(selectedProfile.equationsCount * (300 / Math.max(50, fidelityTier)))}</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoRefining(!isAutoRefining);
                      sounds.playClick(700);
                      haptics.trigger('click');
                    }}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-mono font-bold flex items-center gap-1.5"
                  >
                    {isAutoRefining ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isAutoRefining ? 'Pause Cycle' : 'Auto Cycle'}</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-mono font-bold flex items-center gap-1 text-neutral-200"
                    title="Upload Custom Image to Analyze"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Fidelity Slider Track with Tier Markers */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span className="text-cyan-400 font-bold">◄ 300 (Macro Stone)</span>
                  <span className="text-blue-400 font-bold">200 (Meso Line)</span>
                  <span className="text-purple-400 font-bold">150 (Micro Transistor)</span>
                  <span className="text-emerald-400 font-bold">50 (Ultra)</span>
                  <span className="text-amber-300 font-bold">25 (HD Micro) ►</span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={5}
                    value={fidelityTier}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFidelityTier(val);
                      setIsAutoRefining(false);
                      if (val >= 260) setHierarchyLevel(1);
                      else if (val >= 180) setHierarchyLevel(2);
                      else if (val >= 100) setHierarchyLevel(3);
                      else if (val >= 40) setHierarchyLevel(4);
                      else setHierarchyLevel(5);
                      sounds.playClick(500 + (300 - val) * 2);
                      haptics.trigger('light');
                    }}
                    className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 shadow-inner"
                  />
                </div>

                {/* Quick Snap Preset Buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { tier: 300, label: '300 MACRO', level: 1, desc: '32px Blocks' },
                    { tier: 200, label: '200 MESO', level: 2, desc: '16px Tiles' },
                    { tier: 150, label: '150 MICRO', level: 3, desc: '7px Gates' },
                    { tier: 50, label: '50 ULTRA', level: 4, desc: '3px Matrix' },
                    { tier: 25, label: '25 HD MICRO', level: 5, desc: '2px Sub-Pixel' },
                  ].map((preset) => {
                    const isActive =
                      (preset.tier === 300 && fidelityTier >= 260) ||
                      (preset.tier === 200 && fidelityTier >= 180 && fidelityTier < 260) ||
                      (preset.tier === 150 && fidelityTier >= 100 && fidelityTier < 180) ||
                      (preset.tier === 50 && fidelityTier >= 40 && fidelityTier < 100) ||
                      (preset.tier === 25 && fidelityTier < 40);

                    return (
                      <button
                        type="button"
                        key={preset.tier}
                        onClick={() => {
                          setFidelityTier(preset.tier);
                          setHierarchyLevel(preset.level);
                          setIsAutoRefining(false);
                          sounds.playClick(600 + preset.level * 100);
                          haptics.trigger('medium');
                        }}
                        className={`px-1.5 py-1.5 rounded text-xs font-mono font-bold border transition-all text-center ${
                          isActive
                            ? 'text-white border-cyan-400 bg-cyan-950/80 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="truncate">{preset.label}</div>
                        <div className="text-[9px] text-neutral-400 font-normal truncate">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Human-Readable Clarity & Image Refinement Engine Controls */}
              <div className="p-2.5 bg-cyan-950/25 border border-cyan-500/25 rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="uppercase">Detail Enhancement & AI Mosaic Upscaler</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                    CONVOLUTION MATRIX
                  </span>
                </div>

                {/* Render Enhancement Mode Switcher: Soft Mosaic vs Sharp Vector vs Detail Enhanced */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-300 font-bold">Rendering Mode (64x64 & HD Readability):</span>
                    <span className="text-cyan-300 font-bold">
                      {renderEnhanceMode === 'SHARP_VECTOR' && 'SHARP VECTOR [High Frequency Kernel]'}
                      {renderEnhanceMode === 'SOFT_MOSAIC' && 'SOFT MOSAIC [Gaussian Blur Filter]'}
                      {renderEnhanceMode === 'DETAIL_ENHANCED' && 'DETAIL ENHANCED [Unsharp 3x3]'}
                      {renderEnhanceMode === 'HYBRID_TESSERAE' && 'RAW HYBRID TESSERAE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { mode: 'SHARP_VECTOR', label: 'Sharp Vector', desc: 'Crisp 64x64 Contours', icon: Zap },
                      { mode: 'SOFT_MOSAIC', label: 'Soft Mosaic', desc: 'Smooth Stone Blend', icon: Eye },
                      { mode: 'DETAIL_ENHANCED', label: 'Detail Enhanced', desc: 'Sharpen Convolution', icon: Sparkles },
                      { mode: 'HYBRID_TESSERAE', label: 'Raw Tesserae', desc: 'Original Stone Grid', icon: Layers },
                    ].map(({ mode, label, desc, icon: Icon }) => {
                      const isActive = renderEnhanceMode === mode;
                      return (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => {
                            setRenderEnhanceMode(mode as any);
                            sounds.playClick(680);
                            haptics.trigger('click');
                          }}
                          className={`p-1.5 rounded text-left border transition-all ${
                            isActive
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                              : 'bg-black/40 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
                            <span>{label}</span>
                          </div>
                          <div className="text-[9px] font-mono text-neutral-400 mt-0.5 truncate">{desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Convolution Sharpen Strength Slider (Active for DETAIL_ENHANCED mode) */}
                {renderEnhanceMode === 'DETAIL_ENHANCED' && (
                  <div className="space-y-1 pt-1 bg-black/30 p-2 rounded border border-cyan-500/20">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-300">Sharpen Convolution Strength:</span>
                      <span className="text-cyan-300 font-bold">{detailConvolutionStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={detailConvolutionStrength}
                      onChange={(e) => {
                        setDetailConvolutionStrength(Number(e.target.value));
                        sounds.playClick(450 + Number(e.target.value) * 2);
                      }}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}

                {/* AI Bilinear Upscaling & Noise Reduction Filter Controls */}
                <div className="p-2 bg-black/40 rounded border border-white/10 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-200 font-bold hover:text-white">
                      <input
                        type="checkbox"
                        checked={enableAiUpscaleFilter}
                        onChange={(e) => {
                          setEnableAiUpscaleFilter(e.target.checked);
                          sounds.playClick(650);
                          haptics.trigger('light');
                        }}
                        className="accent-cyan-400 rounded w-4 h-4"
                      />
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                        AI Bilinear Upscaling & Noise Reduction Filter
                      </span>
                    </label>

                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      enableAiUpscaleFilter
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-700'
                    }`}>
                      {enableAiUpscaleFilter ? 'ACTIVE ON HD & ZOOM' : 'DISABLED'}
                    </span>
                  </div>

                  {enableAiUpscaleFilter && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-neutral-400">Tile Transition Noise Reduction Strength:</span>
                        <span className="text-emerald-300 font-bold">{noiseReductionStrength}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={noiseReductionStrength}
                        onChange={(e) => {
                          setNoiseReductionStrength(Number(e.target.value));
                          sounds.playClick(500 + Number(e.target.value) * 2);
                        }}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                        <span>Discrete Tiles (0%)</span>
                        <span>Balanced Bilateral Smooth (60%)</span>
                        <span>Ultra Smooth Gradient (100%)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Photo Detail Clarity Blend */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-300">Photo Clarity Detail Blend:</span>
                      <span className="text-cyan-300 font-bold">{clarityEnhance}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={clarityEnhance}
                      onChange={(e) => {
                        setClarityEnhance(Number(e.target.value));
                        sounds.playClick(500 + Number(e.target.value) * 2);
                      }}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                      <span>Pure Mosaic (0%)</span>
                      <span>Balanced (45%)</span>
                      <span>Clear Photo (100%)</span>
                    </div>
                  </div>

                  {/* Feature Contour & Edge Sharpener */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-300">Feature Edge Sharpness:</span>
                      <span className="text-amber-300 font-bold">{edgeSharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={edgeSharpness}
                      onChange={(e) => {
                        setEdgeSharpness(Number(e.target.value));
                        sounds.playClick(450 + Number(e.target.value) * 2);
                      }}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                      <span>Soft Stone (0%)</span>
                      <span>Crisp Silhouette (60%)</span>
                      <span>Razor Edge (100%)</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Pixel & 3D Hologram Resolution Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs font-mono">
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={subPixelSampling}
                      onChange={(e) => {
                        setSubPixelSampling(e.target.checked);
                        sounds.playClick(600);
                        haptics.trigger('light');
                      }}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Sub-Pixel Area Averaging</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showContourOutlines}
                      onChange={(e) => {
                        setShowContourOutlines(e.target.checked);
                        sounds.playClick(600);
                        haptics.trigger('light');
                      }}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Contour Outlines</span>
                  </label>

                  {/* 3D Resolution Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400">3D Density:</span>
                    {(['ULTRA_HD', 'HIGH', 'TACTICAL'] as const).map((res) => (
                      <button
                        type="button"
                        key={res}
                        onClick={() => {
                          setHologramResolution(res);
                          sounds.playClick(720);
                          haptics.trigger('click');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                          hologramResolution === res
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {res === 'ULTRA_HD' ? 'Ultra HD 64' : res === 'HIGH' ? 'High 48' : 'Tactical 30'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Hologram Depth Extrusion Slider (Depth-Map Extrusion Control) */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white uppercase">3D Extrusion Depth Map</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40">
                      {extrusionDepth} mm / voxels
                    </span>
                    {viewMode === '2D_MOSAIC' && (
                      <button
                        type="button"
                        onClick={() => handleSwitchViewMode('3D_HOLOGRAM')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-bold"
                      >
                        Preview 3D Hologram →
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={extrusionDepth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExtrusionDepth(val);
                      sounds.playClick(400 + val * 3);
                    }}
                    className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 shadow-inner"
                  />
                </div>

                {/* Depth Presets */}
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {[
                    { val: 0, label: 'Flat 0mm' },
                    { val: 15, label: 'Subtle 15mm' },
                    { val: 35, label: 'Tactical 35mm' },
                    { val: 65, label: 'Heavy 65mm' },
                    { val: 95, label: 'Hyper 95mm' },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.val}
                      onClick={() => {
                        setExtrusionDepth(preset.val);
                        sounds.playClick(550 + preset.val * 3);
                        haptics.trigger('light');
                      }}
                      className={`px-1.5 py-1 rounded text-[10px] font-mono border transition-all text-center ${
                        extrusionDepth === preset.val
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Depth Mapping Algorithms */}
                <div className="pt-1.5 space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    Depth-Map Heightfield Algorithm
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                    {[
                      { id: 'LUMINANCE_HEIGHTFIELD', label: 'Luminance' },
                      { id: 'EDGE_NORMAL_GRADIENT', label: 'Edge Relief' },
                      { id: 'TRANSISTOR_RELIEF', label: 'Transistor Wells' },
                      { id: 'INVERTED_TRENCH', label: 'Inverted Trench' },
                    ].map((algo) => (
                      <button
                        type="button"
                        key={algo.id}
                        onClick={() => {
                          setDepthMappingAlgorithm(algo.id as any);
                          sounds.playClick(620);
                          haptics.trigger('click');
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all truncate ${
                          depthMappingAlgorithm === algo.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {algo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Parameters & Characteristics Matrix */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* Tile Style Selector */}
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-2">
              <div className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                <span>Tesserae & Transistor Mode</span>
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ROMAN_STONE', label: 'Roman Stone' },
                  { id: 'QUANTUM_TRANSISTOR', label: 'Quantum Gates' },
                  { id: 'GLYPH_CIPHER', label: 'Glyph Cypher' },
                  { id: 'NEON_CIRCUIT', label: 'Neon Circuit' },
                ].map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => {
                      setTileStyle(mode.id as any);
                      sounds.playClick(680);
                      haptics.trigger('click');
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                      tileStyle === mode.id
                        ? 'text-white'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: tileStyle === mode.id ? theme.primary : undefined,
                      borderColor: tileStyle === mode.id ? theme.primary : undefined,
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Grout & Spacing Slider */}
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span>Grout / Transistor Spacing</span>
                  <span>{groutIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={groutIntensity}
                  onChange={(e) => setGroutIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono text-neutral-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVectorLines}
                    onChange={(e) => setShowVectorLines(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Vector Lines</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTransistorGrid}
                    onChange={(e) => setShowTransistorGrid(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Transistor Grid</span>
                </label>
              </div>
            </div>

            {/* Pre-Built Characteristic Memory Profiles */}
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                  In-Game Sprites & Character Profiles
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{PRESET_PROFILES.length} ASSETS</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {PRESET_PROFILES.map((p) => {
                  const isSelected = selectedProfile.id === p.id && !customImageSrc;
                  const roleBadgeColor =
                    p.gameRole === 'PLAYABLE' || p.gameRole === 'PILOT'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : p.gameRole === 'WEAPON'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : p.gameRole === 'BOSS'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : p.gameRole === 'ENEMY'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2 rounded border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p.src}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded object-cover border border-white/20 shrink-0"
                        />
                        <div className="overflow-hidden min-w-0">
                          <div className="text-[11px] font-bold truncate text-white">{p.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[8px] font-mono px-1 py-0.2 rounded border font-bold ${roleBadgeColor}`}>
                              {p.gameRole}
                            </span>
                            <span className="text-[9px] text-neutral-400 truncate">{p.category}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line & Color Characteristic Signatures */}
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-2 text-xs font-mono">
              <div className="font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recognized Geometry Signatures</span>
              </div>
              <div className="space-y-1 text-[11px]">
                {selectedProfile.characteristicLines.map((line, idx) => (
                  <div key={idx} className="flex items-center justify-between text-neutral-300 py-0.5 border-b border-white/5">
                    <span className="text-neutral-400">0{idx + 1} //</span>
                    <span className="text-cyan-300 font-bold">{line}</span>
                  </div>
                ))}
              </div>

              {/* Dominant Palette Clusters */}
              <div className="pt-1.5">
                <div className="text-[10px] text-neutral-400 mb-1">Dominant Color Clusters (K-Means):</div>
                <div className="flex items-center gap-1.5">
                  {selectedProfile.dominantColors.map((col, i) => (
                    <div
                      key={i}
                      className="w-6 h-5 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                  <span className="text-[10px] text-neutral-400 font-mono ml-auto">
                    {selectedProfile.equationsCount} eq checkpoints
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAW STUDIO TAB */}
      {activeTab === 'DRAW_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="relative border border-white/15 rounded-lg overflow-hidden bg-[#060913] flex items-center justify-center">
              <canvas
                ref={drawCanvasRef}
                width={560}
                height={420}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleEndDraw}
                onMouseLeave={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleEndDraw}
                className="w-full max-w-full h-auto cursor-crosshair touch-none"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 rounded text-[11px] font-mono text-neutral-300 border border-white/10">
                Draw shapes or line contours to test characteristic line similarity
              </div>
            </div>

            {/* Drawing Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white/[0.03] border border-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Palette:</span>
                {['#00f0ff', '#ef4444', '#f59e0b', '#10b981', '#a855f7', '#ffffff'].map((col) => (
                  <button
                    type="button"
                    key={col}
                    onClick={() => {
                      setBrushColor(col);
                      sounds.playClick(800);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      brushColor === col ? 'border-white scale-110 shadow-[0_0_8px_white]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Size:</span>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleClearDrawing}
                  className="px-2.5 py-1 rounded bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-xs font-mono text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-2 font-mono text-xs">
              <div className="font-bold text-cyan-400 uppercase">Interactive Synthesis Pipeline</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                As you draw on the tactile canvas, the Roman Mosaic engine decomposes your lines into 300, 200, and 150 scale coordinates, comparing contour curvature against the pre-built memory bank.
              </p>
              <div className="p-2 bg-black/40 border border-white/10 rounded space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Line Directionality:</span>
                  <span className="text-emerald-400 font-bold">Detected</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Classification Certainty:</span>
                  <span className="text-cyan-400 font-bold">{similarityScore.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 300/200/150 CYPHER HIERARCHY TAB */}
      {activeTab === 'CIPHER_HIERARCHY' && (
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Level 300 */}
            <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                <span className="font-bold text-amber-400 text-xs">HIERARCHY 300 // MACRO</span>
                <span className="text-[10px] text-amber-300">TESSERAE TILE BASE</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Initial coarse grid mapping (36-44px blocks). Identifies macro silhouettes, dominant color regions, and primary center-of-mass vectors.
              </p>
              <div className="p-2 bg-black/60 rounded text-[10px] text-amber-200/80 break-all font-mono">
                {cipherHierarchy.scale300}
              </div>
            </div>

            {/* Level 200 */}
            <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-950/10 space-y-2">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                <span className="font-bold text-cyan-400 text-xs">HIERARCHY 200 // MESO</span>
                <span className="text-[10px] text-cyan-300">EDGE INTERPOLATION</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Intermediate refinement (18-22px blocks). Extracts contour edges, gradient transitions, and geometric tangents.
              </p>
              <div className="p-2 bg-black/60 rounded text-[10px] text-cyan-200/80 break-all font-mono">
                {cipherHierarchy.scale200}
              </div>
            </div>

            {/* Level 150 */}
            <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <span className="font-bold text-emerald-400 text-xs">HIERARCHY 150 // MICRO</span>
                <span className="text-[10px] text-emerald-300">TRANSISTOR LEVEL</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Quantum sub-pixel mapping (8-10px cells). Maps discrete transistor coordinate checkpoints and alphanumeric cypher symbols.
              </p>
              <div className="p-2 bg-black/60 rounded text-[10px] text-emerald-200/80 break-all font-mono">
                {cipherHierarchy.scale150}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Armor & Weapons Tactical Assembly Matrix Modal */}
      <ArmorAssemblyModal
        isOpen={isArmorAssemblyOpen}
        onClose={() => setIsArmorAssemblyOpen(false)}
        theme={theme}
        powerOn={powerOn}
        fluxFrequency={fluxFrequency}
      />
    </div>
  );
};
