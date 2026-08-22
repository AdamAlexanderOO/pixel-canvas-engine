import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Crosshair,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  Sliders,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
  Check,
  Plus,
  Trash2,
  Flame,
  Rocket,
  Compass,
} from 'lucide-react';
import gsap from 'gsap';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { AppThemeConfig } from '../utils/theme';

export interface LoadoutSlot {
  id: 'HEAD' | 'CHEST' | 'RIGHT_ARM' | 'LEFT_ARM' | 'SHOULDERS' | 'LEGS';
  name: string;
  category: string;
  icon: any;
  equippedItem: EquippedTileItem | null;
}

export interface EquippedTileItem {
  id: string;
  name: string;
  parentSet: string;
  slot: 'HEAD' | 'CHEST' | 'RIGHT_ARM' | 'LEFT_ARM' | 'SHOULDERS' | 'LEGS';
  color: string;
  tileType: 'ROMAN_STONE' | 'QUANTUM_GATE' | 'GOLD_INLAY' | 'PLASMA_CELL';
  stats: {
    armor: number;
    shields: number;
    firepower: number;
    mobility: number;
    energyEfficiency: number;
  };
  description: string;
  tileCoord?: { col: number; row: number };
}

export interface ArmorAssemblySet {
  id: string;
  name: string;
  category: string;
  src: string;
  description: string;
  dominantColors: string[];
  tiles: {
    id: string;
    name: string;
    slot: 'HEAD' | 'CHEST' | 'RIGHT_ARM' | 'LEFT_ARM' | 'SHOULDERS' | 'LEGS';
    col: number;
    row: number;
    color: string;
    tileType: 'ROMAN_STONE' | 'QUANTUM_GATE' | 'GOLD_INLAY' | 'PLASMA_CELL';
    stats: {
      armor: number;
      shields: number;
      firepower: number;
      mobility: number;
      energyEfficiency: number;
    };
    description: string;
  }[];
}

const ARMOR_ASSEMBLY_SETS: ArmorAssemblySet[] = [
  {
    id: 'VALKYRIE_GUNDAM',
    name: 'Valkyrie Aerial Gundam Frame',
    category: 'High-Mobility Mobile Suit',
    src: '/images/valkyrie_gundam_1787434609815.jpg',
    description: 'Gold-inlaid Roman mosaic mobile suit with quantum aerodynamic wing binders and hyper-plasma chest core.',
    dominantColors: ['#38bdf8', '#fbbf24', '#f43f5e', '#0f172a'],
    tiles: [
      {
        id: 'VALK_VFIN',
        name: 'V-Fin Tactical Sensor Crest',
        slot: 'HEAD',
        col: 5,
        row: 2,
        color: '#fbbf24',
        tileType: 'GOLD_INLAY',
        stats: { armor: 45, shields: 70, firepower: 30, mobility: 90, energyEfficiency: 85 },
        description: 'Gold mosaic antenna array providing 360° radar targeting and ECM jamming.',
      },
      {
        id: 'VALK_CHEST_REACTOR',
        name: 'Solar Plasma Arc Reactor',
        slot: 'CHEST',
        col: 5,
        row: 5,
        color: '#38bdf8',
        tileType: 'PLASMA_CELL',
        stats: { armor: 120, shields: 150, firepower: 80, mobility: 60, energyEfficiency: 95 },
        description: 'Superconducting Roman stone containment vessel housing an ionized plasma singularity.',
      },
      {
        id: 'VALK_WING_BINDERS',
        name: 'Aerodynamic Vector Wing Binders',
        slot: 'SHOULDERS',
        col: 8,
        row: 3,
        color: '#38bdf8',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 60, shields: 90, firepower: 40, mobility: 160, energyEfficiency: 80 },
        description: 'Articulated mosaic wing vanes generating antigravity levitation and mach-4 burst thrust.',
      },
      {
        id: 'VALK_BEAM_SABER_MOUNT',
        name: 'Twin Particle Beam Saber Emitter',
        slot: 'LEFT_ARM',
        col: 2,
        row: 6,
        color: '#f43f5e',
        tileType: 'PLASMA_CELL',
        stats: { armor: 30, shields: 40, firepower: 140, mobility: 70, energyEfficiency: 75 },
        description: 'High-temperature plasma blade generator mounted on forearm stone gauntlet.',
      },
      {
        id: 'VALK_LINEAR_RIFLE',
        name: 'Hyper-Velocity Beam Rifle',
        slot: 'RIGHT_ARM',
        col: 9,
        row: 6,
        color: '#00f0ff',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 40, shields: 30, firepower: 175, mobility: 50, energyEfficiency: 80 },
        description: 'Long-range particle accelerator rifle with ceramic Roman stone barrel shrouds.',
      },
      {
        id: 'VALK_JET_GREAVES',
        name: 'Vectored Vernier Leg Boosters',
        slot: 'LEGS',
        col: 5,
        row: 9,
        color: '#38bdf8',
        tileType: 'ROMAN_STONE',
        stats: { armor: 85, shields: 60, firepower: 20, mobility: 140, energyEfficiency: 85 },
        description: 'Reinforced tesserae leg plating with multi-axis reaction control vernier thrusters.',
      },
    ],
  },
  {
    id: 'ASSAULT_MECH_PRIME',
    name: 'Assault Mech Prime Exo-Chassis',
    category: 'Heavy Tactical Armor',
    src: '/images/player_mech_hero_1787187990637.jpg',
    description: 'Chobham-reinforced heavy stone tesserae chassis built for frontline breach warfare.',
    dominantColors: ['#00f0ff', '#1e3a8a', '#94a3b8', '#ef4444'],
    tiles: [
      {
        id: 'MECH_VISOR',
        name: 'Cyan Tactical Battle Visor',
        slot: 'HEAD',
        col: 5,
        row: 2,
        color: '#00f0ff',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 60, shields: 80, firepower: 25, mobility: 70, energyEfficiency: 90 },
        description: 'Thermal imaging and structural weakness analyzer with holographic HUD readout.',
      },
      {
        id: 'MECH_CHEST_CHOBHAM',
        name: 'Reinforced Roman Chobham Chestplate',
        slot: 'CHEST',
        col: 5,
        row: 5,
        color: '#1e3a8a',
        tileType: 'ROMAN_STONE',
        stats: { armor: 180, shields: 110, firepower: 30, mobility: 40, energyEfficiency: 85 },
        description: 'Multi-layer composite ceramic tesserae capable of absorbing hyper-kinetic artillery impacts.',
      },
      {
        id: 'MECH_MISSILE_PODS',
        name: 'Shoulder Micro-Missile Pod Grid',
        slot: 'SHOULDERS',
        col: 2,
        row: 3,
        color: '#ef4444',
        tileType: 'ROMAN_STONE',
        stats: { armor: 50, shields: 40, firepower: 150, mobility: 45, energyEfficiency: 70 },
        description: '12-tube swarming missile silo with smart homing seeker warheads.',
      },
      {
        id: 'MECH_GAUSS_CANNON',
        name: 'Overcharged Gauss Rail Cannon',
        slot: 'RIGHT_ARM',
        col: 9,
        row: 6,
        color: '#00f0ff',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 45, shields: 30, firepower: 190, mobility: 35, energyEfficiency: 75 },
        description: 'Twin electromagnetic acceleration rails firing depleted uranium flechettes.',
      },
      {
        id: 'MECH_ENERGY_AEGIS',
        name: 'Hexagonal Force Aegis Shield',
        slot: 'LEFT_ARM',
        col: 1,
        row: 6,
        color: '#3b82f6',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 90, shields: 180, firepower: 15, mobility: 55, energyEfficiency: 80 },
        description: 'Deployable solid-state energy barrier deflecting incoming directed energy beams.',
      },
      {
        id: 'MECH_HYDRAULIC_PISTONS',
        name: 'Titanium Hydraulic Leg Actuators',
        slot: 'LEGS',
        col: 5,
        row: 9,
        color: '#64748b',
        tileType: 'ROMAN_STONE',
        stats: { armor: 110, shields: 50, firepower: 30, mobility: 85, energyEfficiency: 90 },
        description: 'High-torque hydraulic suspension for ground shock dampening and seismic stomps.',
      },
    ],
  },
  {
    id: 'GAUSS_RAILGUN_RIG',
    name: 'Heavy Gauss Railgun Weapon Set',
    category: 'Kinetic Weapon Arsenal',
    src: '/images/gauss_railgun_1787434622054.jpg',
    description: 'Hyper-kinetic linear accelerator battery engineered with superconducting quantum transistor gates.',
    dominantColors: ['#00f0ff', '#1e293b', '#3b82f6', '#f59e0b'],
    tiles: [
      {
        id: 'RAIL_ACCELERATOR_BARREL',
        name: 'Linear Superconducting Rails',
        slot: 'RIGHT_ARM',
        col: 5,
        row: 4,
        color: '#00f0ff',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 35, shields: 25, firepower: 210, mobility: 40, energyEfficiency: 70 },
        description: 'Cryogenically cooled magnetic rails yielding 12,000 m/s muzzle velocity.',
      },
      {
        id: 'RAIL_CAPACITOR_CORE',
        name: 'High-Flux Capacitor Storage Bank',
        slot: 'CHEST',
        col: 3,
        row: 6,
        color: '#f59e0b',
        tileType: 'PLASMA_CELL',
        stats: { armor: 70, shields: 80, firepower: 90, mobility: 50, energyEfficiency: 90 },
        description: 'Rapid-discharge solid state energy cell enabling continuous burst fire.',
      },
      {
        id: 'RAIL_OPTIC_SENSOR',
        name: 'Quantum Rangefinder Holographic Scope',
        slot: 'HEAD',
        col: 7,
        row: 2,
        color: '#38bdf8',
        tileType: 'QUANTUM_GATE',
        stats: { armor: 20, shields: 40, firepower: 60, mobility: 80, energyEfficiency: 95 },
        description: 'Sub-millimeter targeting reticle compensating for planetary curvature and atmospheric drift.',
      },
      {
        id: 'RAIL_HEATSINK_FINS',
        name: 'Ceramic Heat Dissipation Radiator',
        slot: 'SHOULDERS',
        col: 8,
        row: 5,
        color: '#64748b',
        tileType: 'ROMAN_STONE',
        stats: { armor: 50, shields: 40, firepower: 40, mobility: 75, energyEfficiency: 110 },
        description: 'Micro-channeled stone radiator fins expelling thermal buildup during sustained fire.',
      },
    ],
  },
  {
    id: 'BEAM_SABER_RIG',
    name: 'Hyper-Beam Saber & Melee Rig',
    category: 'Energy Melee Arsenal',
    src: '/images/beam_saber_1787434660618.jpg',
    description: 'High-frequency thermal plasma blade with etched Roman mosaic hilt and force barrier.',
    dominantColors: ['#ec4899', '#f43f5e', '#38bdf8', '#1e1b4b'],
    tiles: [
      {
        id: 'SABER_PLASMA_EMITTER',
        name: 'Magnetic Plasma Blade Emitter',
        slot: 'LEFT_ARM',
        col: 5,
        row: 3,
        color: '#ec4899',
        tileType: 'PLASMA_CELL',
        stats: { armor: 25, shields: 60, firepower: 180, mobility: 110, energyEfficiency: 80 },
        description: 'Cohesive I-field containment shaping pure plasma into an indestructible edge.',
      },
      {
        id: 'SABER_HILT_INSCRIPTION',
        name: 'Inscribed Roman Stone Grip',
        slot: 'RIGHT_ARM',
        col: 5,
        row: 7,
        color: '#fbbf24',
        tileType: 'GOLD_INLAY',
        stats: { armor: 40, shields: 30, firepower: 70, mobility: 90, energyEfficiency: 100 },
        description: 'Ergonomic stone hilt with gold inlaid cyphers stabilizing energy conduit resonance.',
      },
    ],
  },
];

interface ArmorAssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppThemeConfig;
  powerOn: boolean;
  fluxFrequency: number;
}

export const ArmorAssemblyModal: React.FC<ArmorAssemblyModalProps> = ({
  isOpen,
  onClose,
  theme,
  powerOn,
  fluxFrequency,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSet, setSelectedSet] = useState<ArmorAssemblySet>(ARMOR_ASSEMBLY_SETS[0]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Select a set, then tap any glowing mosaic tile to equip it.');

  // Tactical Loadout Slots
  const [loadout, setLoadout] = useState<Record<LoadoutSlot['id'], EquippedTileItem | null>>({
    HEAD: null,
    CHEST: null,
    RIGHT_ARM: null,
    LEFT_ARM: null,
    SHOULDERS: null,
    LEGS: null,
  });

  // Default Equip initial set
  useEffect(() => {
    if (isOpen && !loadout.CHEST) {
      // Auto populate basic starter loadout
      const valk = ARMOR_ASSEMBLY_SETS[0];
      const initialMap: Record<LoadoutSlot['id'], EquippedTileItem | null> = {
        HEAD: { ...valk.tiles[0], parentSet: valk.name },
        CHEST: { ...valk.tiles[1], parentSet: valk.name },
        SHOULDERS: { ...valk.tiles[2], parentSet: valk.name },
        LEFT_ARM: { ...valk.tiles[3], parentSet: valk.name },
        RIGHT_ARM: { ...valk.tiles[4], parentSet: valk.name },
        LEGS: { ...valk.tiles[5], parentSet: valk.name },
      };
      setLoadout(initialMap);
    }
  }, [isOpen]);

  // Render Interactive Mosaic on Canvas with Tappable Tiles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedSet.src;

    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Offscreen sample
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0, w, h);
      const imgData = offCtx.getImageData(0, 0, w, h).data;

      const gridSize = 11;
      const tileW = w / gridSize;
      const tileH = h / gridSize;

      // Render base mosaic stones with subpixel area averaging
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const x = c * tileW;
          const y = r * tileH;

          // Area-weighted subpixel sampling for smooth color transitions
          let rSum = 0, gSum = 0, bSum = 0, ptCount = 0;
          const sampleStep = Math.max(1, Math.floor(tileW / 3));
          for (let dy = 0; dy < tileH; dy += sampleStep) {
            for (let dx = 0; dx < tileW; dx += sampleStep) {
              const px = Math.min(w - 1, Math.floor(x + dx));
              const py = Math.min(h - 1, Math.floor(y + dy));
              const pIdx = (py * w + px) * 4;
              rSum += imgData[pIdx];
              gSum += imgData[pIdx + 1];
              bSum += imgData[pIdx + 2];
              ptCount++;
            }
          }
          const red = Math.round(rSum / Math.max(1, ptCount));
          const green = Math.round(gSum / Math.max(1, ptCount));
          const blue = Math.round(bSum / Math.max(1, ptCount));

          // Check if this grid cell is an equippable armor tile
          const matchedTile = selectedSet.tiles.find((t) => t.col === c && t.row === r);
          const isSelected = matchedTile && selectedTileId === matchedTile.id;
          const isHovered = matchedTile && hoveredTileId === matchedTile.id;
          const isEquipped = matchedTile && loadout[matchedTile.slot]?.id === matchedTile.id;

          const grout = 2;
          const drawW = tileW - grout;
          const drawH = tileH - grout;

          if (matchedTile) {
            // Equippable Tile Highlight
            ctx.save();
            if (isSelected || isHovered) {
              ctx.shadowColor = matchedTile.color;
              ctx.shadowBlur = 15;
            }

            ctx.fillStyle = matchedTile.color;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, drawW, drawH, 4);
            ctx.fill();

            // Border
            ctx.strokeStyle = isSelected ? '#ffffff' : isEquipped ? '#10b981' : matchedTile.color;
            ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
            ctx.stroke();

            // Icon indicator inside tile
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(matchedTile.slot.slice(0, 3), x + drawW / 2, y + drawH / 2);

            if (isEquipped) {
              ctx.fillStyle = '#10b981';
              ctx.beginPath();
              ctx.arc(x + drawW - 4, y + 4, 3, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          } else {
            // Standard Roman Stone with bevel highlight
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, drawW, drawH, 2);
            ctx.fill();

            // Subtle highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Crisp Image Clarity Overlay for Human-Readable Armor & Weapon Contours
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Draw characteristic alignment crosshair lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };
  }, [selectedSet, selectedTileId, hoveredTileId, loadout, isOpen]);

  // Calculate Cumulative Loadout Stats
  const totalStats = (Object.values(loadout) as (EquippedTileItem | null)[]).reduce(
    (acc, item) => {
      if (!item) return acc;
      return {
        armor: acc.armor + item.stats.armor,
        shields: acc.shields + item.stats.shields,
        firepower: acc.firepower + item.stats.firepower,
        mobility: acc.mobility + item.stats.mobility,
        energyEfficiency: acc.energyEfficiency + item.stats.energyEfficiency,
      };
    },
    { armor: 0, shields: 0, firepower: 0, mobility: 0, energyEfficiency: 0 }
  );

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridSize = 11;
    const col = Math.floor((x / rect.width) * gridSize);
    const row = Math.floor((y / rect.height) * gridSize);

    const clickedTile = selectedSet.tiles.find((t) => t.col === col && t.row === row);
    if (clickedTile) {
      setSelectedTileId(clickedTile.id);
      equipTile(clickedTile);
    } else {
      sounds.playClick(400);
      setFeedbackMessage(`Grid cell [${col}, ${row}] is baseline armor plating. Tap glowing colored tiles to equip specific subsystem modules.`);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridSize = 11;
    const col = Math.floor((x / rect.width) * gridSize);
    const row = Math.floor((y / rect.height) * gridSize);

    const hovered = selectedSet.tiles.find((t) => t.col === col && t.row === row);
    setHoveredTileId(hovered ? hovered.id : null);
  };

  const equipTile = (tile: ArmorAssemblySet['tiles'][0]) => {
    const equippedItem: EquippedTileItem = {
      ...tile,
      parentSet: selectedSet.name,
      tileCoord: { col: tile.col, row: tile.row },
    };

    setLoadout((prev) => ({
      ...prev,
      [tile.slot]: equippedItem,
    }));

    sounds.playLaserPew();
    haptics.trigger('success');
    setFeedbackMessage(`★ EQUIPPED: ${tile.name} socketed into [${tile.slot}] slot!`);

    // GSAP flash animation on equipped slot
    gsap.fromTo(
      `#slot-${tile.slot}`,
      { scale: 0.88, backgroundColor: 'rgba(0, 240, 255, 0.4)' },
      { scale: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', duration: 0.45, ease: 'back.out(2)' }
    );
  };

  const equipFullSet = (set: ArmorAssemblySet) => {
    const newLoadout: Record<LoadoutSlot['id'], EquippedTileItem | null> = { ...loadout };
    set.tiles.forEach((t) => {
      newLoadout[t.slot] = { ...t, parentSet: set.name, tileCoord: { col: t.col, row: t.row } };
    });
    setLoadout(newLoadout);
    sounds.playSpectrumLoad();
    haptics.trigger('heavy');
    setFeedbackMessage(`★ FULL SET EQUIPPED: All ${set.tiles.length} mosaic components of ${set.name} assembled!`);

    gsap.fromTo(
      '.slot-card',
      { scale: 0.9, opacity: 0.7 },
      { scale: 1, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
    );
  };

  const unequipSlot = (slotKey: LoadoutSlot['id']) => {
    setLoadout((prev) => ({
      ...prev,
      [slotKey]: null,
    }));
    sounds.playClick(450);
    haptics.trigger('light');
    setFeedbackMessage(`Unequipped module from [${slotKey}] slot.`);
  };

  const clearAllSlots = () => {
    setLoadout({
      HEAD: null,
      CHEST: null,
      RIGHT_ARM: null,
      LEFT_ARM: null,
      SHOULDERS: null,
      LEGS: null,
    });
    sounds.playSimulatePulse();
    haptics.trigger('medium');
    setFeedbackMessage('All tactical slots cleared. Assemble new custom mosaic armor.');
  };

  if (!isOpen) return null;

  const slotsList: { id: LoadoutSlot['id']; label: string; icon: any }[] = [
    { id: 'HEAD', label: 'Tactical Visor / Helm', icon: Eye },
    { id: 'CHEST', label: 'Reactor Core / Chest', icon: Cpu },
    { id: 'RIGHT_ARM', label: 'Primary Weapon Arm', icon: Crosshair },
    { id: 'LEFT_ARM', label: 'Shield / Melee Arm', icon: Shield },
    { id: 'SHOULDERS', label: 'Wing Binders / Pods', icon: Rocket },
    { id: 'LEGS', label: 'Vernier Leg Boosters', icon: Activity },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-xl border border-white/20 bg-[#070a14] text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0c101d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base tracking-tight uppercase">
                  ARMOR & WEAPONS MOSAIC ASSEMBLY STUDIO
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  TACTICAL LOADOUT BUILDER
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Tap individual mosaic tesserae to extract and socket modules into tactical slots
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick(600);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Feedback Banner */}
          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 font-mono text-xs text-cyan-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <div className="text-[10px] text-neutral-400 shrink-0 hidden sm:block">
              FLUX: <b className="text-white">{fluxFrequency.toFixed(1)} GHz</b>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Set Selector & Interactive Canvas */}
            <div className="lg:col-span-7 space-y-3">
              {/* Set Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {ARMOR_ASSEMBLY_SETS.map((set) => {
                  const isCur = selectedSet.id === set.id;
                  return (
                    <button
                      type="button"
                      key={set.id}
                      onClick={() => {
                        setSelectedSet(set);
                        setSelectedTileId(null);
                        sounds.playClick(650);
                        haptics.trigger('click');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                        isCur
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{set.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Canvas Viewport */}
              <div className="relative border border-white/15 rounded-xl overflow-hidden bg-[#04060c] flex flex-col items-center justify-center p-2 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={440}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  className="w-full max-w-[400px] h-auto object-contain rounded-lg cursor-pointer transition-all border border-white/10"
                />

                {/* Overlay Tooltip & Instructions */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/15 text-[10px] font-mono text-cyan-300">
                  TAP GLOWING MOSAIC TILES TO EQUIP
                </div>

                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/15 text-[10px] font-mono text-neutral-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{selectedSet.tiles.length} Equippable Nodes</span>
                </div>
              </div>

              {/* Set Action Toolbar */}
              <div className="flex items-center justify-between gap-2 p-2 bg-white/[0.02] border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => equipFullSet(selectedSet)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Equip Complete {selectedSet.name.split(' ')[0]} Set</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllSlots}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-mono font-bold flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Selected Tile Details Card */}
              {selectedTileId && (
                <div className="p-3 rounded-lg border border-cyan-500/40 bg-cyan-950/30 space-y-2 font-mono text-xs animate-in fade-in duration-150">
                  {(() => {
                    const tile = selectedSet.tiles.find((t) => t.id === selectedTileId);
                    if (!tile) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: tile.color }}
                            />
                            <span className="font-bold text-white">{tile.name}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">
                            SLOT: {tile.slot}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-[11px] leading-relaxed">
                          {tile.description}
                        </p>
                        <div className="grid grid-cols-5 gap-1 pt-1 text-[10px] text-center">
                          <div className="p-1 bg-black/40 rounded border border-white/5">
                            <div className="text-neutral-400">ARMOR</div>
                            <div className="font-bold text-cyan-300">+{tile.stats.armor}</div>
                          </div>
                          <div className="p-1 bg-black/40 rounded border border-white/5">
                            <div className="text-neutral-400">SHIELDS</div>
                            <div className="font-bold text-blue-300">+{tile.stats.shields}</div>
                          </div>
                          <div className="p-1 bg-black/40 rounded border border-white/5">
                            <div className="text-neutral-400">FIREPOWER</div>
                            <div className="font-bold text-amber-300">+{tile.stats.firepower}</div>
                          </div>
                          <div className="p-1 bg-black/40 rounded border border-white/5">
                            <div className="text-neutral-400">MOBILITY</div>
                            <div className="font-bold text-emerald-300">+{tile.stats.mobility}</div>
                          </div>
                          <div className="p-1 bg-black/40 rounded border border-white/5">
                            <div className="text-neutral-400">EFFICIENCY</div>
                            <div className="font-bold text-purple-300">{tile.stats.energyEfficiency}%</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right Column: Active Tactical Loadout & Aggregated Stats */}
            <div className="lg:col-span-5 space-y-3.5">
              {/* Aggregated Tactical Telemetry Stats */}
              <div className="p-3.5 rounded-xl border border-white/15 bg-white/[0.03] space-y-2.5 font-mono">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>LOADOUT PERFORMANCE TELEMETRY</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {Object.values(loadout).filter(Boolean).length}/6 SLOTS MOUNTED
                  </span>
                </div>

                {/* Progress Bar Stats */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-cyan-300 font-bold">ARMOR CHASSIS INTEGRITY</span>
                      <span className="text-white font-bold">{totalStats.armor} HP</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                      <div
                        className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalStats.armor / 600) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-blue-300 font-bold">ENERGY FORCE SHIELD</span>
                      <span className="text-white font-bold">{totalStats.shields} MW</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-blue-500/30">
                      <div
                        className="h-full bg-blue-400 shadow-[0_0_8px_#3b82f6] transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalStats.shields / 600) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-amber-300 font-bold">BALLISTIC & ION FIREPOWER</span>
                      <span className="text-white font-bold">{totalStats.firepower} DPS</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/30">
                      <div
                        className="h-full bg-amber-400 shadow-[0_0_8px_#f59e0b] transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalStats.firepower / 700) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-300 font-bold">VERNIER MOBILITY / SPEED</span>
                      <span className="text-white font-bold">{totalStats.mobility} M/S</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-emerald-500/30">
                      <div
                        className="h-full bg-emerald-400 shadow-[0_0_8px_#10b981] transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalStats.mobility / 600) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Tactical Loadout Slots */}
              <div className="space-y-2 font-mono">
                <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Tactical Loadout Slots
                </div>

                <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                  {slotsList.map((slot) => {
                    const equipped = loadout[slot.id];
                    const IconComponent = slot.icon;

                    return (
                      <div
                        key={slot.id}
                        id={`slot-${slot.id}`}
                        className={`slot-card p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          equipped
                            ? 'border-cyan-500/40 bg-cyan-950/20'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded ${
                              equipped
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-white/5 text-neutral-500'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="text-[10px] text-neutral-400 uppercase">
                              {slot.label}
                            </div>
                            {equipped ? (
                              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: equipped.color }}
                                />
                                <span>{equipped.name}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-500 italic">
                                [ Empty Socket - Tap Mosaic Tile ]
                              </div>
                            )}
                          </div>
                        </div>

                        {equipped && (
                          <button
                            type="button"
                            onClick={() => unequipSlot(slot.id)}
                            className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-all shrink-0 ml-2"
                            title="Unequip Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#0c101d]">
          <div className="text-xs font-mono text-neutral-400">
            LOADOUT CIPHER: <b className="text-cyan-300">0x{(totalStats.armor + totalStats.firepower).toString(16).toUpperCase()}</b>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(750);
              haptics.trigger('success');
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all"
          >
            Confirm & Save Tactical Loadout
          </button>
        </div>
      </div>
    </div>
  );
};
