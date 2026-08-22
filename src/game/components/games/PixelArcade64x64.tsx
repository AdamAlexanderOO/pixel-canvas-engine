import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Crosshair,
  Shield,
  Rocket,
  Flame,
  Layers,
  Sliders,
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronRight,
  Swords,
  Info,
  Eye,
  Cpu,
  Monitor,
  Box,
  Camera,
  Orbit,
  Move,
  Wand2,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import {
  generateMosaicSpriteMultiRes,
  generatePixelSprite64,
  MosaicCharacterType,
  createLevel4MosaicTexture,
} from '../../utils/mosaicCharacterRenderer';
import {
  getEquippedAssetForSlot,
  convertImageToMultiResMosaicSpriteCanvas,
  convertImageToPixelSprite64Canvas,
  subscribeToCustomAssetChanges,
  createCustomAssetThreeTexture,
} from '../../utils/customCharacterStore';
import { InGameModulesAssetOverlay } from './InGameModulesAssetOverlay';
import { getModulesForGame } from '../../data/gameModulesMetadata';

export type PixelGameType =
  | 'PIXEL_SPACE_SIM'
  | 'PIXEL_GUNDAM_MECH'
  | 'PIXEL_CYBER_FPS'
  | 'PIXEL_PHOTON_RUNNER'
  | 'PIXEL_RADAR_DEFENSE';

export type ArcadeFidelityResolution = 64 | 128 | 256 | 512 | 1024;
export type ArcadeEngineMode = '3D_TRUE_MESH' | '2D_PIXEL_BUFFER';
export type CameraViewAngle = 'CHASE_CAM' | 'COCKPIT_CAM' | 'ISOMETRIC' | 'ORBIT_360';

interface PixelArcade64x64Props {
  initialGame?: PixelGameType;
  onSwitchTo3D?: () => void;
  onClose?: () => void;
}

export const PixelArcade64x64: React.FC<PixelArcade64x64Props> = ({
  initialGame = 'PIXEL_SPACE_SIM',
  onSwitchTo3D,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const [activeGame, setActiveGame] = useState<PixelGameType>(initialGame);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('PLAYING');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(14250);
  const [health, setHealth] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(100);
  const [wave, setWave] = useState<number>(1);
  const [fidelity, setFidelity] = useState<ArcadeFidelityResolution>(64);
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [tesseraeGrid, setTesseraeGrid] = useState<boolean>(false);
  const [hdrGlint, setHdrGlint] = useState<boolean>(true);
  const [paletteMode, setPaletteMode] = useState<
    'ORIGINAL' | 'CYBER_CYAN' | 'ROMAN_GOLD' | 'CRIMSON_NEO' | 'EMERALD_QUANTUM' | 'AMETHYST'
  >('ORIGINAL');

  // 3D True Mesh Engine & Camera View State
  const [arcadeEngineMode, setArcadeEngineMode] = useState<ArcadeEngineMode>('3D_TRUE_MESH');
  const [cameraView, setCameraView] = useState<CameraViewAngle>('CHASE_CAM');
  const [renderEnhanceMode, setRenderEnhanceMode] = useState<'SOFT_MOSAIC' | 'SHARP_VECTOR' | 'HYBRID_TESSERAE' | 'DETAIL_ENHANCED'>('SHARP_VECTOR');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Game Engine Internal State (stored in ref for smooth 60fps loop)
  const engineRef = useRef<{
    // Space Sim State (0..64 logical coordinate bounds)
    playerX: number;
    playerY: number;
    playerVx: number;
    playerVy: number;
    bullets: Array<{ x: number; y: number; vx: number; vy: number; color: string }>;
    enemies: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      hp: number;
      maxHp: number;
      type: 'DRONE' | 'CORVETTE' | 'BOSS';
      spriteType: MosaicCharacterType;
      frame: number;
    }>;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }>;
    stars: Array<{ x: number; y: number; speed: number; brightness: number; layer: number }>;
    bossSpawned: boolean;

    // Gundam / Mech State
    mechX: number;
    mechY: number;
    mechFacing: 'LEFT' | 'RIGHT';
    mechIsBoosting: boolean;
    mechGrounded: boolean;
    mechVy: number;
    beamSaberActive: boolean;
    mechMissiles: Array<{ x: number; y: number; vx: number; vy: number; targetX: number; targetY: number }>;
    groundEnemies: Array<{
      x: number;
      y: number;
      hp: number;
      vx: number;
      type: 'TITAN' | 'DROID';
      spriteType: MosaicCharacterType;
    }>;

    // FPS Raycaster State
    fpsX: number;
    fpsY: number;
    fpsAngle: number;
    fpsMap: number[][];
    fpsEnemies: Array<{ x: number; y: number; hp: number; active: boolean }>;

    // Runner State
    runnerY: number;
    runnerVy: number;
    runnerObstacles: Array<{ x: number; width: number; height: number; type: 'LASER' | 'BLOCK' }>;
    runnerSpeed: number;

    lastShotTime: number;
    frameCounter: number;
  }>({
    playerX: 32,
    playerY: 50,
    playerVx: 0,
    playerVy: 0,
    bullets: [],
    enemies: [],
    particles: [],
    stars: Array.from({ length: 60 }, () => ({
      x: Math.random() * 64,
      y: Math.random() * 64,
      speed: 0.15 + Math.random() * 0.85,
      brightness: Math.random(),
      layer: Math.floor(Math.random() * 3),
    })),
    bossSpawned: false,

    mechX: 32,
    mechY: 48,
    mechFacing: 'RIGHT',
    mechIsBoosting: false,
    mechGrounded: true,
    mechVy: 0,
    beamSaberActive: false,
    mechMissiles: [],
    groundEnemies: [],

    fpsX: 3.5,
    fpsY: 3.5,
    fpsAngle: 0,
    fpsMap: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
    fpsEnemies: [
      { x: 5.5, y: 2.5, hp: 3, active: true },
      { x: 2.5, y: 5.5, hp: 4, active: true },
    ],

    runnerY: 48,
    runnerVy: 0,
    runnerObstacles: [],
    runnerSpeed: 1.0,

    lastShotTime: 0,
    frameCounter: 0,
  });

  // Pre-rendered multi-resolution sprites cache
  const spritesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [modulesOverlayOpen, setModulesOverlayOpen] = useState<boolean>(false);
  const [activeModules, setActiveModules] = useState(() =>
    getModulesForGame('SPACE_SIM').filter((m) => m.isEquipped)
  );

  // Generate multi-fidelity sprites on mount, fidelity change, or palette change
  useEffect(() => {
    const map = new Map<string, HTMLCanvasElement>();
    const types: MosaicCharacterType[] = [
      'STARFIGHTER_INTERCEPTOR',
      'STEALTH_CORVETTE',
      'CRUISER_BOSS',
      'CYBER_DRONE',
      'HERO_MECH_FRONT',
      'VALKYRIE_GUNDAM',
      'GOLIATH_TITAN',
      'SENTINEL_DROID',
      'PLASMA_RIFLE',
      'GAUSS_RAILGUN',
      'BEAM_SABER',
    ];

    types.forEach((t) => {
      map.set(
        t,
        generateMosaicSpriteMultiRes(t, fidelity, {
          palette: paletteMode,
          hdrGlint,
          tileStyle: 'ROMAN_STONE',
        })
      );
    });

    // Check if custom character asset is equipped
    const equippedCustom = getEquippedAssetForSlot('PIXEL_SPRITE');
    if (equippedCustom) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = equippedCustom.imageUrl;
      img.onload = () => {
        const customSprite = convertImageToMultiResMosaicSpriteCanvas(
          img,
          equippedCustom.settings,
          fidelity
        );
        map.set('CUSTOM_HERO_SPRITE', customSprite);
        map.set('STARFIGHTER_INTERCEPTOR', customSprite);
        map.set('HERO_MECH_FRONT', customSprite);
        map.set('VALKYRIE_GUNDAM', customSprite);
        spritesRef.current = map;
      };
    }

    spritesRef.current = map;

    const unsubscribe = subscribeToCustomAssetChanges(() => {
      const updatedCustom = getEquippedAssetForSlot('PIXEL_SPRITE');
      if (updatedCustom) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = updatedCustom.imageUrl;
        img.onload = () => {
          const customSprite = convertImageToMultiResMosaicSpriteCanvas(
            img,
            updatedCustom.settings,
            fidelity
          );
          spritesRef.current.set('CUSTOM_HERO_SPRITE', customSprite);
          spritesRef.current.set('STARFIGHTER_INTERCEPTOR', customSprite);
          spritesRef.current.set('HERO_MECH_FRONT', customSprite);
          spritesRef.current.set('VALKYRIE_GUNDAM', customSprite);
        };
      }
    });

    return () => unsubscribe();
  }, [paletteMode, fidelity, hdrGlint]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60FPS Game Loop with Dynamic Multi-Resolution Buffer
  useEffect(() => {
    let animId: number;

    const gameCanvas = canvasRef.current;
    if (!gameCanvas) return;
    const ctx = gameCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Dynamically sized internal resolution buffer based on active fidelity level
    const buffer = document.createElement('canvas');
    buffer.width = fidelity;
    buffer.height = fidelity;
    const bCtx = buffer.getContext('2d', { willReadFrequently: true })!;
    bCtx.imageSmoothingEnabled = fidelity >= 256;

    // Coordinate multiplier to map 0..64 logical coordinates to fidelity resolution
    const S = fidelity / 64;

    const spawnEnemiesForSpace = () => {
      const state = engineRef.current;
      if (state.enemies.length < 4 + wave) {
        const isCorvette = Math.random() > 0.6;
        state.enemies.push({
          x: 4 + Math.random() * 56,
          y: -8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.2 + Math.random() * 0.3,
          hp: isCorvette ? 4 : 2,
          maxHp: isCorvette ? 4 : 2,
          type: isCorvette ? 'CORVETTE' : 'DRONE',
          spriteType: isCorvette ? 'STEALTH_CORVETTE' : 'CYBER_DRONE',
          frame: 0,
        });
      }
    };

    const spawnEnemiesForMech = () => {
      const state = engineRef.current;
      if (state.groundEnemies.length < 3) {
        const isTitan = Math.random() > 0.7;
        state.groundEnemies.push({
          x: 64,
          y: 48,
          hp: isTitan ? 8 : 3,
          vx: isTitan ? -0.2 : -0.4,
          type: isTitan ? 'TITAN' : 'DROID',
          spriteType: isTitan ? 'GOLIATH_TITAN' : 'SENTINEL_DROID',
        });
      }
    };

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      const state = engineRef.current;
      state.frameCounter++;

      if (gameState !== 'PLAYING') {
        // Draw paused or game over banner
        bCtx.fillStyle = '#050712';
        bCtx.fillRect(0, 0, fidelity, fidelity);
        bCtx.fillStyle = '#00f0ff';
        const fontSize = Math.max(6, Math.floor(6 * S));
        bCtx.font = `bold ${fontSize}px monospace`;
        bCtx.fillText(gameState === 'GAMEOVER' ? 'GAME OVER' : 'PAUSED', 16 * S, 32 * S);
        bCtx.font = `${Math.max(5, Math.floor(5 * S))}px monospace`;
        bCtx.fillStyle = '#ffffff';
        bCtx.fillText(`SCORE: ${score}`, 16 * S, 40 * S);
        bCtx.fillText(`FIDELITY: ${fidelity}x${fidelity}`, 16 * S, 48 * S);

        ctx.imageSmoothingEnabled = fidelity >= 256;
        ctx.drawImage(buffer, 0, 0, gameCanvas.width, gameCanvas.height);
        return;
      }

      // Clear dynamic buffer canvas
      bCtx.fillStyle = '#050711';
      bCtx.fillRect(0, 0, fidelity, fidelity);

      // ==========================================
      // GAME 1: MULTI-FIDELITY SPACE DOGFIGHT SIM
      // ==========================================
      if (activeGame === 'PIXEL_SPACE_SIM') {
        // Render Multi-layer Parallax Stars
        state.stars.forEach((s) => {
          s.y += s.speed;
          if (s.y > 64) {
            s.y = 0;
            s.x = Math.random() * 64;
          }

          const starX = s.x * S;
          const starY = s.y * S;
          const starSize = Math.max(1, s.speed > 0.6 ? 1.5 * S : 0.8 * S);

          if (s.speed > 0.6) {
            bCtx.fillStyle = '#00f0ff';
            if (fidelity >= 256 && hdrGlint) {
              // Sub-pixel star glow
              bCtx.fillStyle = 'rgba(0, 240, 255, 0.4)';
              bCtx.fillRect(starX - S, starY - S, starSize + 2 * S, starSize + 2 * S);
              bCtx.fillStyle = '#ffffff';
            }
          } else {
            bCtx.fillStyle = '#475569';
          }
          bCtx.fillRect(Math.floor(starX), Math.floor(starY), Math.ceil(starSize), Math.ceil(starSize));
        });

        // Player Controls
        const speed = 0.8;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) state.playerX = Math.max(4, state.playerX - speed);
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) state.playerX = Math.min(60, state.playerX + speed);
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) state.playerY = Math.max(6, state.playerY - speed);
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) state.playerY = Math.min(58, state.playerY + speed);

        // Shoot lasers
        if ((keysRef.current['Space'] || keysRef.current['KeyZ']) && timestamp - state.lastShotTime > 160) {
          state.lastShotTime = timestamp;
          state.bullets.push({ x: state.playerX - 2.5, y: state.playerY - 4, vx: 0, vy: -1.8, color: '#00f0ff' });
          state.bullets.push({ x: state.playerX + 2.5, y: state.playerY - 4, vx: 0, vy: -1.8, color: '#00f0ff' });
          sounds.playLaserPew();
          haptics.trigger('light');
        }

        // Spawn Enemies
        spawnEnemiesForSpace();

        // Update & Render Bullets with High-Fidelity Energy Cores
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          const bx = b.x * S;
          const by = b.y * S;
          const bw = Math.max(1, 1.2 * S);
          const bh = Math.max(2, 3.5 * S);

          if (fidelity >= 256 && hdrGlint) {
            bCtx.fillStyle = 'rgba(0, 240, 255, 0.35)';
            bCtx.fillRect(bx - S * 0.5, by - S * 0.5, bw + S, bh + S);
            bCtx.fillStyle = '#ffffff';
            bCtx.fillRect(bx, by, bw, bh);
          } else {
            bCtx.fillStyle = b.color;
            bCtx.fillRect(Math.floor(bx), Math.floor(by), Math.ceil(bw), Math.ceil(bh));
          }

          if (b.y < -4 || b.y > 68) {
            state.bullets.splice(i, 1);
          }
        }

        // Update & Render Enemies with Mosaic Tesserae Sprites
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          e.x += e.vx;
          e.y += e.vy;
          if (e.x < 4 || e.x > 60) e.vx = -e.vx;

          const ex = e.x * S;
          const ey = e.y * S;
          const enemySpriteSize = (e.type === 'CORVETTE' ? 12 : 9) * S;

          const sprite = spritesRef.current.get(e.spriteType);
          if (sprite) {
            bCtx.drawImage(
              sprite,
              Math.floor(ex - enemySpriteSize / 2),
              Math.floor(ey - enemySpriteSize / 2),
              enemySpriteSize,
              enemySpriteSize
            );
          } else {
            bCtx.fillStyle = e.type === 'CORVETTE' ? '#ef4444' : '#a855f7';
            bCtx.fillRect(Math.floor(ex - 4 * S), Math.floor(ey - 4 * S), 8 * S, 8 * S);
          }

          // Bullet Collisions
          for (let j = state.bullets.length - 1; j >= 0; j--) {
            const b = state.bullets[j];
            if (Math.abs(b.x - e.x) < 4.5 && Math.abs(b.y - e.y) < 4.5) {
              state.bullets.splice(j, 1);
              e.hp--;

              // Spark particles
              const pCount = fidelity >= 256 ? 6 : 3;
              for (let p = 0; p < pCount; p++) {
                state.particles.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  life: 14,
                  maxLife: 14,
                  color: p % 2 === 0 ? '#00f0ff' : '#fbbf24',
                  size: fidelity >= 256 ? 1.5 : 1,
                });
              }

              if (e.hp <= 0) {
                sounds.playExplosionBoom();
                haptics.trigger('medium');
                setScore((s) => s + (e.type === 'CORVETTE' ? 250 : 100));
                state.enemies.splice(i, 1);
                break;
              }
            }
          }

          if (e.y > 68) {
            state.enemies.splice(i, 1);
          }
        }

        // Draw Player Starfighter (Multi-Res Mosaic Sprite)
        const px = state.playerX * S;
        const py = state.playerY * S;
        const playerSpriteSize = 12 * S;

        const playerSprite =
          spritesRef.current.get('CUSTOM_HERO_SPRITE') ||
          spritesRef.current.get('STARFIGHTER_INTERCEPTOR');

        if (playerSprite) {
          bCtx.drawImage(
            playerSprite,
            Math.floor(px - playerSpriteSize / 2),
            Math.floor(py - playerSpriteSize / 2),
            playerSpriteSize,
            playerSpriteSize
          );
        } else {
          bCtx.fillStyle = '#00f0ff';
          bCtx.fillRect(Math.floor(px - 3 * S), Math.floor(py - 4 * S), 6 * S, 8 * S);
        }

        // Animated Thruster Plume with High-Fidelity Glow
        const flameH = (state.frameCounter % 2 === 0 ? 3 : 2) * S;
        if (fidelity >= 256 && hdrGlint) {
          bCtx.fillStyle = 'rgba(255, 170, 0, 0.4)';
          bCtx.fillRect(px - 2.5 * S, py + 5 * S, 5 * S, flameH + 2 * S);
        }
        bCtx.fillStyle = state.frameCounter % 2 === 0 ? '#ffaa00' : '#ff3300';
        bCtx.fillRect(px - 1.5 * S, py + 5 * S, 3 * S, flameH);
      }

      // ==========================================
      // GAME 2: MULTI-FIDELITY GUNDAM & MECH BATTLE
      // ==========================================
      else if (activeGame === 'PIXEL_GUNDAM_MECH') {
        // Ground line & Cyber Matrix Lattice
        bCtx.fillStyle = '#1e293b';
        bCtx.fillRect(0, 54 * S, fidelity, 10 * S);
        bCtx.fillStyle = '#00f0ff';
        bCtx.fillRect(0, 53 * S, fidelity, Math.max(1, S));

        if (fidelity >= 256) {
          // Perspective grid lines on ground
          bCtx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          bCtx.lineWidth = 1;
          for (let gx = 0; gx < fidelity; gx += 16 * S) {
            bCtx.beginPath();
            bCtx.moveTo(gx, 54 * S);
            bCtx.lineTo(gx + (gx - fidelity / 2) * 0.5, fidelity);
            bCtx.stroke();
          }
        }

        // Mech Movement
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
          state.mechX = Math.max(6, state.mechX - 0.6);
          state.mechFacing = 'LEFT';
        }
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
          state.mechX = Math.min(58, state.mechX + 0.6);
          state.mechFacing = 'RIGHT';
        }

        // Boost Jump
        if ((keysRef.current['ArrowUp'] || keysRef.current['KeyW']) && state.mechGrounded) {
          state.mechVy = -1.8;
          state.mechGrounded = false;
          sounds.playLaserPew();
          haptics.trigger('light');
        }

        // Gravity & Vertical Physics
        state.mechY += state.mechVy;
        if (state.mechY < 46) {
          state.mechVy += 0.1;
          state.mechGrounded = false;
        } else {
          state.mechY = 46;
          state.mechVy = 0;
          state.mechGrounded = true;
        }

        // Beam Saber Swing
        if ((keysRef.current['Space'] || keysRef.current['KeyZ']) && timestamp - state.lastShotTime > 180) {
          state.lastShotTime = timestamp;
          state.beamSaberActive = true;
          sounds.playSimulatePulse();
          haptics.trigger('medium');

          state.groundEnemies.forEach((ge) => {
            if (Math.abs(ge.x - state.mechX) < 14) {
              ge.hp -= 2;
              sounds.playExplosionBoom();
              for (let p = 0; p < (fidelity >= 256 ? 8 : 4); p++) {
                state.particles.push({
                  x: ge.x,
                  y: ge.y,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: -Math.random() * 2,
                  life: 12,
                  maxLife: 12,
                  color: '#00f0ff',
                  size: fidelity >= 256 ? 1.5 : 1,
                });
              }
            }
          });
        } else {
          state.beamSaberActive = false;
        }

        // Spawn Ground Enemies
        spawnEnemiesForMech();

        // Update Ground Enemies
        for (let i = state.groundEnemies.length - 1; i >= 0; i--) {
          const ge = state.groundEnemies[i];
          ge.x += ge.vx;

          const gex = ge.x * S;
          const gey = ge.y * S;
          const enemyMechSize = (ge.type === 'TITAN' ? 14 : 10) * S;

          const sprite = spritesRef.current.get(ge.spriteType);
          if (sprite) {
            bCtx.drawImage(
              sprite,
              Math.floor(gex - enemyMechSize / 2),
              Math.floor(gey - enemyMechSize / 2),
              enemyMechSize,
              enemyMechSize
            );
          } else {
            bCtx.fillStyle = '#ef4444';
            bCtx.fillRect(Math.floor(gex - 4 * S), Math.floor(gey - 6 * S), 8 * S, 8 * S);
          }

          if (ge.hp <= 0) {
            setScore((s) => s + (ge.type === 'TITAN' ? 300 : 120));
            sounds.playExplosionBoom();
            state.groundEnemies.splice(i, 1);
          } else if (ge.x < -10) {
            state.groundEnemies.splice(i, 1);
          }
        }

        // Draw Gundam Mech Sprite
        const mx = state.mechX * S;
        const my = state.mechY * S;
        const mechSpriteSize = 14 * S;

        const mechSprite =
          spritesRef.current.get('CUSTOM_HERO_SPRITE') ||
          spritesRef.current.get('VALKYRIE_GUNDAM') ||
          spritesRef.current.get('HERO_MECH_FRONT');

        if (mechSprite) {
          bCtx.drawImage(
            mechSprite,
            Math.floor(mx - mechSpriteSize / 2),
            Math.floor(my - mechSpriteSize / 2),
            mechSpriteSize,
            mechSpriteSize
          );
        } else {
          bCtx.fillStyle = '#38bdf8';
          bCtx.fillRect(Math.floor(mx - 4 * S), Math.floor(my - 5 * S), 8 * S, 10 * S);
        }

        // Draw Beam Saber Blade
        if (state.beamSaberActive) {
          const saberX = state.mechFacing === 'RIGHT' ? mx + 8 * S : mx - 8 * S;
          if (fidelity >= 256 && hdrGlint) {
            bCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            bCtx.lineWidth = 4 * S;
            bCtx.beginPath();
            bCtx.moveTo(mx, my);
            bCtx.lineTo(saberX, my - 6 * S);
            bCtx.stroke();
          }
          bCtx.strokeStyle = '#ffffff';
          bCtx.lineWidth = Math.max(1.5, 2 * S);
          bCtx.beginPath();
          bCtx.moveTo(mx, my);
          bCtx.lineTo(saberX, my - 6 * S);
          bCtx.stroke();
        }
      }

      // ==========================================
      // GAME 3: MULTI-FIDELITY PSEUDO-3D CYBER FPS
      // ==========================================
      else if (activeGame === 'PIXEL_CYBER_FPS') {
        const rotSpeed = 0.05;
        const moveSpeed = 0.06;

        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) state.fpsAngle -= rotSpeed;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) state.fpsAngle += rotSpeed;

        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) {
          const nx = state.fpsX + Math.cos(state.fpsAngle) * moveSpeed;
          const ny = state.fpsY + Math.sin(state.fpsAngle) * moveSpeed;
          if (state.fpsMap[Math.floor(ny)]?.[Math.floor(nx)] === 0) {
            state.fpsX = nx;
            state.fpsY = ny;
          }
        }
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) {
          const nx = state.fpsX - Math.cos(state.fpsAngle) * moveSpeed;
          const ny = state.fpsY - Math.sin(state.fpsAngle) * moveSpeed;
          if (state.fpsMap[Math.floor(ny)]?.[Math.floor(nx)] === 0) {
            state.fpsX = nx;
            state.fpsY = ny;
          }
        }

        // Slices scale with target fidelity: 64 rays for 64, 128 for 128, up to 1024 rays for Ultra-HD!
        const totalRays = fidelity;
        const fov = Math.PI / 3;

        for (let x = 0; x < totalRays; x++) {
          const rayAngle = state.fpsAngle - fov / 2 + (x / totalRays) * fov;
          let dist = 0;
          let hit = false;
          const cos = Math.cos(rayAngle);
          const sin = Math.sin(rayAngle);

          while (!hit && dist < 12) {
            dist += 0.06;
            const checkX = Math.floor(state.fpsX + cos * dist);
            const checkY = Math.floor(state.fpsY + sin * dist);
            if (state.fpsMap[checkY]?.[checkX] === 1) {
              hit = true;
            }
          }

          // Correct fisheye
          const correctedDist = dist * Math.cos(rayAngle - state.fpsAngle);
          const wallHeight = Math.min(fidelity, Math.floor((fidelity / 2) / correctedDist));

          const wallTop = Math.floor(fidelity / 2 - wallHeight / 2);
          const wallBottom = Math.floor(fidelity / 2 + wallHeight / 2);

          // Ceiling & Floor
          bCtx.fillStyle = '#050711';
          bCtx.fillRect(x, 0, 1, wallTop);
          bCtx.fillStyle = '#0f172a';
          bCtx.fillRect(x, wallBottom, 1, fidelity - wallBottom);

          // Wall shading with Roman mosaic depth
          const shade = Math.max(18, Math.floor(255 - correctedDist * 22));
          bCtx.fillStyle = `rgb(0, ${Math.floor(shade * 0.85)}, ${shade})`;
          bCtx.fillRect(x, wallTop, 1, wallHeight);

          // High-fidelity mortar line for Roman stone wall feel
          if (fidelity >= 256 && x % Math.floor(8 * S) === 0) {
            bCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            bCtx.fillRect(x, wallTop, 1, wallHeight);
          }
        }

        // Draw Gun Sprite in Center
        const gunSprite = spritesRef.current.get('PLASMA_RIFLE');
        const gunSize = 20 * S;
        if (gunSprite) {
          bCtx.drawImage(
            gunSprite,
            Math.floor(fidelity / 2 - gunSize / 2),
            Math.floor(fidelity - gunSize),
            gunSize,
            gunSize
          );
        }

        // Crosshair
        bCtx.fillStyle = '#ffffff';
        const chSize = Math.max(2, 2 * S);
        bCtx.fillRect(fidelity / 2 - chSize / 2, fidelity / 2 - chSize / 2, chSize, chSize);

        // Shoot action
        if ((keysRef.current['Space'] || keysRef.current['KeyZ']) && timestamp - state.lastShotTime > 200) {
          state.lastShotTime = timestamp;
          sounds.playLaserPew();
          haptics.trigger('medium');
          setScore((s) => s + 50);

          // Muzzle flash with bloom
          const mfSize = 6 * S;
          if (fidelity >= 256 && hdrGlint) {
            bCtx.fillStyle = 'rgba(0, 240, 255, 0.6)';
            bCtx.fillRect(fidelity / 2 - mfSize, fidelity - 18 * S, mfSize * 2, mfSize * 2);
          }
          bCtx.fillStyle = '#ffffff';
          bCtx.fillRect(fidelity / 2 - mfSize / 2, fidelity - 16 * S, mfSize, mfSize);
        }
      }

      // ==========================================
      // GAME 4: MULTI-FIDELITY PHOTON RUNNER
      // ==========================================
      else {
        bCtx.fillStyle = '#0f172a';
        bCtx.fillRect(0, 0, fidelity, fidelity);

        bCtx.fillStyle = '#00f0ff';
        bCtx.fillRect(0, 52 * S, fidelity, Math.max(1, 2 * S));

        if ((keysRef.current['Space'] || keysRef.current['ArrowUp']) && state.runnerY >= 44) {
          state.runnerVy = -1.8;
          sounds.playLaserPew();
        }

        state.runnerY += state.runnerVy;
        if (state.runnerY < 44) {
          state.runnerVy += 0.12;
        } else {
          state.runnerY = 44;
          state.runnerVy = 0;
        }

        if (state.frameCounter % 60 === 0) {
          state.runnerObstacles.push({ x: 64, width: 4, height: 8, type: 'LASER' });
        }

        for (let i = state.runnerObstacles.length - 1; i >= 0; i--) {
          const ob = state.runnerObstacles[i];
          ob.x -= 1.2;

          const ox = ob.x * S;
          const ow = ob.width * S;
          const oh = ob.height * S;

          bCtx.fillStyle = '#ef4444';
          bCtx.fillRect(Math.floor(ox), 52 * S - oh, ow, oh);

          if (Math.abs(ob.x - 16) < 4 && state.runnerY > 40) {
            setHealth((h) => Math.max(0, h - 5));
            sounds.playExplosionBoom();
          }

          if (ob.x < -10) {
            state.runnerObstacles.splice(i, 1);
            setScore((s) => s + 80);
          }
        }

        // Runner Character
        bCtx.fillStyle = '#38bdf8';
        bCtx.fillRect(14 * S, Math.floor(state.runnerY * S), 6 * S, 8 * S);
      }

      // Render Common Particle System
      for (let p = state.particles.length - 1; p >= 0; p--) {
        const pt = state.particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;

        const ptx = pt.x * S;
        const pty = pt.y * S;
        const pts = Math.max(1, (pt.size || 1) * S);

        bCtx.fillStyle = pt.color;
        bCtx.fillRect(Math.floor(ptx), Math.floor(pty), Math.ceil(pts), Math.ceil(pts));
        if (pt.life <= 0) state.particles.splice(p, 1);
      }

      // Tesserae Stone Grid / Micro-Grout Overlay
      if (tesseraeGrid) {
        bCtx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
        bCtx.lineWidth = 1;
        const gridStep = Math.max(4, 4 * S);
        for (let g = 0; g < fidelity; g += gridStep) {
          bCtx.beginPath();
          bCtx.moveTo(g, 0);
          bCtx.lineTo(g, fidelity);
          bCtx.stroke();
          bCtx.beginPath();
          bCtx.moveTo(0, g);
          bCtx.lineTo(fidelity, g);
          bCtx.stroke();
        }
      }

      // Blit internal buffer to display viewport canvas
      ctx.imageSmoothingEnabled = fidelity >= 256;
      ctx.drawImage(buffer, 0, 0, gameCanvas.width, gameCanvas.height);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeGame, gameState, wave, tesseraeGrid, fidelity, hdrGlint, arcadeEngineMode, renderEnhanceMode]);

  // ==========================================
  // TRUE 3D HOLOGRAPHIC ARCADE GAME ENGINE (THREE.JS)
  // ==========================================
  useEffect(() => {
    if (arcadeEngineMode !== '3D_TRUE_MESH' || !threeMountRef.current) return;
    const container = threeMountRef.current;
    const width = container.clientWidth || 420;
    const height = container.clientHeight || 420;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020308);
    scene.fog = new THREE.FogExp2(0x020308, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const thrusterLight = new THREE.PointLight(0x00f0ff, 2.5, 18);
    thrusterLight.position.set(0, 0, 2);
    scene.add(thrusterLight);

    // Groups
    const playerGroup = new THREE.Group();
    const enemiesGroup = new THREE.Group();
    const bulletsGroup = new THREE.Group();
    const envGroup = new THREE.Group();
    const particlesGroup = new THREE.Group();

    scene.add(playerGroup);
    scene.add(enemiesGroup);
    scene.add(bulletsGroup);
    scene.add(envGroup);
    scene.add(particlesGroup);

    // Textures & Materials from Roman Mosaic Processor
    const heroTex = createLevel4MosaicTexture('STARFIGHTER_INTERCEPTOR', 128);
    const mechTex = createLevel4MosaicTexture('VALKYRIE_GUNDAM', 128);
    const enemyTex = createLevel4MosaicTexture('STEALTH_CORVETTE', 128);
    const bossTex = createLevel4MosaicTexture('CRUISER_BOSS', 128);

    const heroMat = new THREE.MeshStandardMaterial({
      map: heroTex,
      metalness: 0.6,
      roughness: 0.35,
      wireframe: wireframeMode,
    });

    const mechMat = new THREE.MeshStandardMaterial({
      map: mechTex,
      metalness: 0.7,
      roughness: 0.3,
      wireframe: wireframeMode,
    });

    const enemyMat = new THREE.MeshStandardMaterial({
      map: enemyTex,
      color: 0xef4444,
      metalness: 0.5,
      roughness: 0.4,
      wireframe: wireframeMode,
    });

    const bossMat = new THREE.MeshStandardMaterial({
      map: bossTex,
      color: 0xa855f7,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: wireframeMode,
    });

    // ==========================================
    // 3D GAME 1: SPACE DOGFIGHT SIM (3D ASSETS)
    // ==========================================
    if (activeGame === 'PIXEL_SPACE_SIM') {
      // 3D Starfighter Mesh Assembly
      // Fuselage
      const fuselageGeo = new THREE.ConeGeometry(0.7, 3.2, 8);
      fuselageGeo.rotateX(Math.PI / 2);
      const fuselage = new THREE.Mesh(fuselageGeo, heroMat);
      playerGroup.add(fuselage);

      // Delta Wings
      const wingGeo = new THREE.BoxGeometry(4.8, 0.12, 1.8);
      wingGeo.translate(0, 0, 0.4);
      const wings = new THREE.Mesh(wingGeo, heroMat);
      playerGroup.add(wings);

      // Wingtip Cannons
      const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
      cannonGeo.rotateX(Math.PI / 2);
      const leftCannon = new THREE.Mesh(cannonGeo, new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.5 }));
      leftCannon.position.set(-2.4, 0, 0.4);
      const rightCannon = leftCannon.clone();
      rightCannon.position.set(2.4, 0, 0.4);
      playerGroup.add(leftCannon);
      playerGroup.add(rightCannon);

      // Cockpit Canopy
      const canopyGeo = new THREE.SphereGeometry(0.42, 12, 12);
      canopyGeo.scale(0.9, 0.55, 1.6);
      const canopyMat = new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        transmission: 0.7,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
        ior: 1.5,
      });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(0, 0.3, -0.3);
      playerGroup.add(canopy);

      // Twin Thruster Nozzles & Glowing Plumes
      const thrusterGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 8);
      thrusterGeo.rotateX(Math.PI / 2);
      const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      leftThruster.position.set(-0.4, 0, 1.5);
      const rightThruster = leftThruster.clone();
      rightThruster.position.set(0.4, 0, 1.5);
      playerGroup.add(leftThruster);
      playerGroup.add(rightThruster);

      // Glowing Ion Plumes
      const plumeGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
      plumeGeo.rotateX(-Math.PI / 2);
      const plumeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const leftPlume = new THREE.Mesh(plumeGeo, plumeMat);
      leftPlume.position.set(-0.4, 0, 2.2);
      const rightPlume = leftPlume.clone();
      rightPlume.position.set(0.4, 0, 2.2);
      playerGroup.add(leftPlume);
      playerGroup.add(rightPlume);

      // 3D Starfield Environment
      const starGeo = new THREE.BufferGeometry();
      const starCount = 500;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 120;
        starPos[i + 1] = (Math.random() - 0.5) * 120;
        starPos[i + 2] = (Math.random() - 0.5) * 180;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.6, transparent: true, opacity: 0.8 });
      const starField = new THREE.Points(starGeo, starMat);
      envGroup.add(starField);

      // Floating 3D Asteroids
      for (let a = 0; a < 8; a++) {
        const astGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.5, 1);
        const astMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true });
        const asteroid = new THREE.Mesh(astGeo, astMat);
        asteroid.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 30, -30 - Math.random() * 60);
        envGroup.add(asteroid);
      }
    }

    // ==========================================
    // 3D GAME 2: GUNDAM MECH ARENA (3D ASSETS)
    // ==========================================
    else if (activeGame === 'PIXEL_GUNDAM_MECH') {
      // 3D Mobile Suit Gundam Mesh
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.2), mechMat);
      playerGroup.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mechMat);
      head.position.set(0, 1.4, 0);
      playerGroup.add(head);

      // Gold V-Fin Antenna
      const vFinL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.9, 4), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      vFinL.rotation.z = Math.PI / 4;
      vFinL.position.set(-0.35, 1.85, 0.3);
      const vFinR = vFinL.clone();
      vFinR.rotation.z = -Math.PI / 4;
      vFinR.position.set(0.35, 1.85, 0.3);
      playerGroup.add(vFinL);
      playerGroup.add(vFinR);

      // Pauldrons
      const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.1), mechMat);
      pauldronL.position.set(-1.3, 0.6, 0);
      const pauldronR = pauldronL.clone();
      pauldronR.position.set(1.3, 0.6, 0);
      playerGroup.add(pauldronL);
      playerGroup.add(pauldronR);

      // 3D Glowing Beam Saber
      const saberHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      const saberBlade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      saberBlade.position.set(0, 1.7, 0);
      const beamSaber = new THREE.Group();
      beamSaber.add(saberHilt);
      beamSaber.add(saberBlade);
      beamSaber.position.set(1.5, 0.2, 0.8);
      beamSaber.rotation.x = Math.PI / 3;
      playerGroup.add(beamSaber);

      // Cyber Grid Floor
      const grid = new THREE.GridHelper(80, 40, 0x00f0ff, 0x1e293b);
      grid.position.y = -2.5;
      envGroup.add(grid);

      // Distant Cyber Skyscrapers
      for (let b = 0; b < 12; b++) {
        const bh = 10 + Math.random() * 25;
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 3, bh, 3 + Math.random() * 3), new THREE.MeshStandardMaterial({ color: 0x0f172a, wireframe: true }));
        bMesh.position.set((Math.random() - 0.5) * 60, bh / 2 - 2.5, -20 - Math.random() * 30);
        envGroup.add(bMesh);
      }
    }

    // ==========================================
    // 3D GAME 3: CYBER FPS DUNGEON (3D ASSETS)
    // ==========================================
    else if (activeGame === 'PIXEL_CYBER_FPS') {
      // Dungeon Corridor Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
      for (let x = -8; x <= 8; x += 4) {
        for (let z = -20; z <= 20; z += 4) {
          if (Math.abs(x) === 8 || (Math.abs(x) === 4 && Math.abs(z) % 8 === 0)) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5, 3.8), wallMat);
            wall.position.set(x, 0, z);
            envGroup.add(wall);
          }
        }
      }

      // Ceiling & Floor Grids
      const dungeonFloor = new THREE.GridHelper(40, 20, 0x00f0ff, 0x0f172a);
      dungeonFloor.position.y = -2.5;
      envGroup.add(dungeonFloor);

      // First-Person 3D Plasma Rifle in Camera View
      const gunGroup = new THREE.Group();
      const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
      const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 }));
      gunBarrel.rotation.x = Math.PI / 2;
      gunBarrel.position.set(0, 0.05, -0.8);
      const gunScope = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      gunScope.rotation.x = Math.PI / 2;
      gunScope.position.set(0, 0.28, -0.2);
      gunGroup.add(gunBody);
      gunGroup.add(gunBarrel);
      gunGroup.add(gunScope);
      gunGroup.position.set(0.6, -0.6, -1.2);
      camera.add(gunGroup);
      scene.add(camera);
    }

    // ==========================================
    // 3D GAME 4: PHOTON RUNNER (3D ASSETS)
    // ==========================================
    else {
      // 3D Synthwave Highway
      const roadGeo = new THREE.PlaneGeometry(16, 200, 16, 100);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, -2, -80);
      envGroup.add(road);

      const neonLines = new THREE.GridHelper(16, 8, 0x00f0ff, 0xec4899);
      neonLines.position.set(0, -1.98, -80);
      envGroup.add(neonLines);

      // 3D Cyber Runner Character
      const runnerBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), heroMat);
      runnerBody.position.set(0, -1.2, 0);
      playerGroup.add(runnerBody);

      // Neon Horizon Sun
      const sunGeo = new THREE.CircleGeometry(14, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(0, 8, -140);
      envGroup.add(sun);
    }

    // Interactive 3D Render Loop
    let animId: number;
    let clock = new THREE.Clock();
    let playerX3D = 0;
    let playerY3D = 0;
    let rollAngle = 0;
    let pitchAngle = 0;
    let lastFireTime3D = 0;

    // Active 3D Entities
    interface Enemy3D {
      mesh: THREE.Object3D;
      hp: number;
      speed: number;
      type: 'DRONE' | 'CORVETTE' | 'BOSS';
    }
    const enemies3D: Enemy3D[] = [];

    interface Laser3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
    }
    const lasers3D: Laser3D[] = [];

    // Spawn 3D Enemies
    const spawnEnemy3D = () => {
      if (enemies3D.length > 8) return;
      const isBoss = Math.random() < 0.15;
      const isCorvette = !isBoss && Math.random() < 0.4;

      let enemyMesh: THREE.Object3D;
      if (isBoss) {
        const bg = new THREE.Group();
        const bCore = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 3.2), bossMat);
        const bWings = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 4), bossMat);
        bWings.rotation.z = Math.PI;
        bg.add(bCore);
        bg.add(bWings);
        enemyMesh = bg;
      } else if (isCorvette) {
        const cg = new THREE.Group();
        const cBody = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.0, 6), enemyMat);
        cBody.rotation.x = Math.PI / 2;
        cg.add(cBody);
        enemyMesh = cg;
      } else {
        enemyMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 1), enemyMat);
      }

      enemyMesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, -50 - Math.random() * 20);
      enemiesGroup.add(enemyMesh);

      enemies3D.push({
        mesh: enemyMesh,
        hp: isBoss ? 6 : isCorvette ? 3 : 1,
        speed: 0.18 + Math.random() * 0.15,
        type: isBoss ? 'BOSS' : isCorvette ? 'CORVETTE' : 'DRONE',
      });
    };

    const render3D = () => {
      animId = requestAnimationFrame(render3D);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (gameState === 'PAUSED') return;

      // Read Keyboard / Virtual D-Pad Inputs
      const isLeft = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'];
      const isRight = keysRef.current['ArrowRight'] || keysRef.current['KeyD'];
      const isUp = keysRef.current['ArrowUp'] || keysRef.current['KeyW'];
      const isDown = keysRef.current['ArrowDown'] || keysRef.current['KeyS'];
      const isFire = keysRef.current['Space'] || keysRef.current['KeyZ'];

      // Physics & Movement
      const moveSpeed = 9 * delta;
      if (isLeft) playerX3D = Math.max(-8, playerX3D - moveSpeed);
      if (isRight) playerX3D = Math.min(8, playerX3D + moveSpeed);
      if (isUp) playerY3D = Math.min(5, playerY3D + moveSpeed);
      if (isDown) playerY3D = Math.max(-4, playerY3D - moveSpeed);

      // Banking Roll & Tilt Physics
      const targetRoll = isLeft ? 0.45 : isRight ? -0.45 : 0;
      const targetPitch = isUp ? -0.25 : isDown ? 0.25 : 0;
      rollAngle += (targetRoll - rollAngle) * 0.12;
      pitchAngle += (targetPitch - pitchAngle) * 0.12;

      playerGroup.position.set(playerX3D, playerY3D, 0);
      playerGroup.rotation.z = rollAngle;
      playerGroup.rotation.x = pitchAngle;

      // Thruster Flicker
      thrusterLight.intensity = 2.0 + Math.sin(time * 30) * 0.8;
      thrusterLight.position.set(playerX3D, playerY3D, 1.5);

      // Weapon Fire (3D Lasers)
      if (isFire && time - lastFireTime3D > 0.18) {
        lastFireTime3D = time;
        sounds.playLaserPew();
        haptics.trigger('light');

        // Spawn Dual 3D Lasers
        const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
        laserGeo.rotateX(Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

        const laserL = new THREE.Mesh(laserGeo, laserMat);
        laserL.position.set(playerX3D - 1.8, playerY3D, -1.0);
        bulletsGroup.add(laserL);
        lasers3D.push({ mesh: laserL, vx: 0, vy: 0, vz: -48 });

        const laserR = new THREE.Mesh(laserGeo, laserMat);
        laserR.position.set(playerX3D + 1.8, playerY3D, -1.0);
        bulletsGroup.add(laserR);
        lasers3D.push({ mesh: laserR, vx: 0, vy: 0, vz: -48 });
      }

      // Update Lasers
      for (let i = lasers3D.length - 1; i >= 0; i--) {
        const l = lasers3D[i];
        l.mesh.position.z += l.vz * delta;

        // Hit Detection with Enemies
        for (let j = enemies3D.length - 1; j >= 0; j--) {
          const e = enemies3D[j];
          if (l.mesh.position.distanceTo(e.mesh.position) < 2.2) {
            e.hp--;
            sounds.playExplosionBoom();
            haptics.trigger('medium');

            // Remove laser
            bulletsGroup.remove(l.mesh);
            lasers3D.splice(i, 1);

            if (e.hp <= 0) {
              setScore((s) => s + (e.type === 'BOSS' ? 500 : e.type === 'CORVETTE' ? 250 : 100));
              enemiesGroup.remove(e.mesh);
              enemies3D.splice(j, 1);
            }
            break;
          }
        }

        if (l.mesh.position.z < -80) {
          bulletsGroup.remove(l.mesh);
          lasers3D.splice(i, 1);
        }
      }

      // Spawn and Advance Enemies
      if (Math.random() < 0.04) spawnEnemy3D();

      for (let i = enemies3D.length - 1; i >= 0; i--) {
        const e = enemies3D[i];
        e.mesh.position.z += e.speed * (40 * delta);
        e.mesh.rotation.y += delta * 1.5;
        e.mesh.rotation.z += delta * 0.8;

        // Player Collision
        if (e.mesh.position.distanceTo(playerGroup.position) < 2.0) {
          setHealth((h) => Math.max(0, h - 15));
          sounds.playExplosionBoom();
          haptics.trigger('heavy');
          enemiesGroup.remove(e.mesh);
          enemies3D.splice(i, 1);
        } else if (e.mesh.position.z > 15) {
          enemiesGroup.remove(e.mesh);
          enemies3D.splice(i, 1);
        }
      }

      // Camera Angle Control Modes
      if (cameraView === 'CHASE_CAM') {
        camera.position.x += (playerX3D * 0.4 - camera.position.x) * 0.08;
        camera.position.y += (playerY3D * 0.4 + 3.2 - camera.position.y) * 0.08;
        camera.position.z = 9;
        camera.lookAt(playerX3D * 0.2, playerY3D * 0.2, -15);
      } else if (cameraView === 'COCKPIT_CAM') {
        camera.position.set(playerX3D, playerY3D + 0.3, -0.3);
        camera.rotation.set(pitchAngle * 0.6, 0, rollAngle * 0.6);
      } else if (cameraView === 'ISOMETRIC') {
        camera.position.set(12, 16, 16);
        camera.lookAt(playerX3D * 0.5, playerY3D * 0.5, -5);
      } else if (cameraView === 'ORBIT_360') {
        const orbR = 12;
        camera.position.set(Math.sin(time * 0.6) * orbR, 5, Math.cos(time * 0.6) * orbR);
        camera.lookAt(playerX3D, playerY3D, 0);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(render3D);

    const handleResize = () => {
      if (!threeMountRef.current) return;
      const w = threeMountRef.current.clientWidth;
      const h = threeMountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [arcadeEngineMode, activeGame, gameState, cameraView, wireframeMode, renderEnhanceMode]);

  return (
    <div className="bg-[#050711] border border-cyan-500/40 rounded-xl p-3 sm:p-5 text-white font-mono flex flex-col items-center space-y-4 shadow-2xl relative">
      {/* Top Banner Navigation */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base tracking-wider text-white">
                3D HOLOGRAPHIC & MULTI-FIDELITY ARCADE CABINET
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                {arcadeEngineMode === '3D_TRUE_MESH' ? '3D TRUE MESH ENGINE' : `${fidelity}x${fidelity} 2D BUFFER`}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Featuring fully fledged 3D image assets and real-time Three.js spatial meshes powered by Roman Mosaic synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Custom Character & Theme Studio Button */}
          <button
            type="button"
            onClick={() => {
              setModulesOverlayOpen(true);
              sounds.playClick(800);
              haptics.trigger('medium');
            }}
            className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-200 text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.3)] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            <span>CUSTOM ASSET STUDIO</span>
          </button>

          {/* Engine Mode Toggle: 3D True Mesh vs 2D Multi-Res */}
          <button
            type="button"
            onClick={() => {
              setArcadeEngineMode((m) => (m === '3D_TRUE_MESH' ? '2D_PIXEL_BUFFER' : '3D_TRUE_MESH'));
              sounds.playClick(750);
              haptics.trigger('medium');
            }}
            className={`px-3 py-1 rounded text-xs font-bold tracking-wider flex items-center gap-1.5 border transition-all ${
              arcadeEngineMode === '3D_TRUE_MESH'
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.6)] font-black'
                : 'bg-white/10 text-cyan-300 border-white/20 hover:bg-white/20'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{arcadeEngineMode === '3D_TRUE_MESH' ? '3D TRUE MESH ACTIVE' : 'SWITCH TO 3D MESH'}</span>
          </button>

          {/* CRT scanline toggle */}
          <button
            type="button"
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-2 py-1 rounded border text-[10px] font-bold ${
              crtEffect
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            CRT: {crtEffect ? 'ON' : 'OFF'}
          </button>

          {/* Wireframe Mode toggle */}
          <button
            type="button"
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-1 rounded border text-[10px] font-bold ${
              wireframeMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            WIREFRAME: {wireframeMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3D Camera Controls & Rendering Modes Bar */}
      {arcadeEngineMode === '3D_TRUE_MESH' ? (
        <div className="w-full bg-neutral-950/90 border border-cyan-500/30 rounded-lg p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="text-neutral-300 font-bold">3D CAMERA PERSPECTIVE:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'CHASE_CAM', label: 'Third-Person Chase', icon: Camera },
                { id: 'COCKPIT_CAM', label: 'Cockpit / 1st Person', icon: Eye },
                { id: 'ISOMETRIC', label: 'Tactical Isometric', icon: Box },
                { id: 'ORBIT_360', label: '360° Orbit Cam', icon: Orbit },
              ] as const
            ).map((cam) => {
              const isSel = cameraView === cam.id;
              const Icon = cam.icon;
              return (
                <button
                  type="button"
                  key={cam.id}
                  onClick={() => {
                    setCameraView(cam.id);
                    sounds.playClick(650);
                    haptics.trigger('light');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 border ${
                    isSel
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 text-cyan-400" />
                  <span>{cam.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Dynamic Pixel Fidelity Resolution Selector Bar (2D Mode) */
        <div className="w-full bg-neutral-950/80 border border-white/10 rounded-lg p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-neutral-300 font-bold">PIXEL FIDELITY SCALING:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { res: 64, label: '64x64 Lo-Fi Crunch', badge: '8-Bit', color: 'border-cyan-500' },
                { res: 128, label: '128x128 Neo-Geo', badge: '32-Bit', color: 'border-blue-500' },
                { res: 256, label: '256x256 Hi-Bit HD', badge: 'HD', color: 'border-emerald-500' },
                { res: 512, label: '512x512 Full HD', badge: 'FHD', color: 'border-purple-500' },
                { res: 1024, label: '1024x1024 Ultra-HD & Beyond', badge: '4K', color: 'border-amber-500' },
              ] as const
            ).map((item) => {
              const isSel = fidelity === item.res;
              return (
                <button
                  type="button"
                  key={item.res}
                  onClick={() => {
                    setFidelity(item.res);
                    sounds.playClick(900);
                    haptics.trigger('medium');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 border ${
                    isSel
                      ? `bg-cyan-950 text-white ${item.color} shadow-[0_0_12px_rgba(0,240,255,0.4)]`
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  <span className="px-1 py-0.2 rounded bg-black/60 text-[8px] font-black text-cyan-300">
                    {item.badge}
                  </span>
                  <span>{item.res}x{item.res}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Selector Tabs */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { id: 'PIXEL_SPACE_SIM', name: 'Space Dogfight Sim', icon: Rocket, color: 'text-cyan-400' },
          { id: 'PIXEL_GUNDAM_MECH', name: 'Gundam Mech Battle', icon: Swords, color: 'text-blue-400' },
          { id: 'PIXEL_CYBER_FPS', name: 'Pseudo-3D Cyber FPS', icon: Crosshair, color: 'text-emerald-400' },
          { id: 'PIXEL_PHOTON_RUNNER', name: 'Photon Runner', icon: Zap, color: 'text-amber-400' },
        ].map((g) => {
          const Icon = g.icon;
          const isSel = activeGame === g.id;
          return (
            <button
              type="button"
              key={g.id}
              onClick={() => {
                setActiveGame(g.id as PixelGameType);
                sounds.playClick(700);
                haptics.trigger('click');
              }}
              className={`p-2 rounded border text-left transition-all flex items-center gap-2 ${
                isSel
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${g.color}`} />
              <span className="text-xs font-bold">{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Arcade Screen Container */}
      <div className="relative border-4 border-neutral-800 rounded-2xl p-2 bg-[#020308] shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col items-center">
        {/* Top Header Marquee */}
        <div className="w-full flex items-center justify-between text-[11px] px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-t-lg text-cyan-300">
          <div>
            1UP <b className="text-white">{score.toString().padStart(6, '0')}</b>
          </div>
          <div>
            HIGH <b className="text-amber-400">{highScore.toString().padStart(6, '0')}</b>
          </div>
          <div>
            HEALTH <b className="text-emerald-400">{health}%</b>
          </div>
          <div>
            MODE <b className="text-purple-300">{arcadeEngineMode === '3D_TRUE_MESH' ? 'TRUE 3D' : `${fidelity}x${fidelity}`}</b>
          </div>
        </div>

        {/* Dynamic Display Viewport (3D WebGL Three.js or 2D Multi-Res Buffer) */}
        <div className="relative overflow-hidden rounded-lg bg-black my-2 aspect-square w-[280px] sm:w-[380px] md:w-[420px] max-w-full">
          {arcadeEngineMode === '3D_TRUE_MESH' ? (
            <div ref={threeMountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          ) : (
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="w-full h-full block"
              style={{ imageRendering: fidelity <= 128 ? 'pixelated' : 'auto' }}
            />
          )}

          {/* CRT Scanline and Phosphor Glow Layer */}
          {crtEffect && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen"
              style={{
                backgroundImage:
                  fidelity <= 128
                    ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.75) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 255, 0, 0.06))'
                    : 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
                backgroundSize: fidelity <= 128 ? '100% 4px, 6px 100%' : '100% 2px',
              }}
            />
          )}
        </div>

        {/* Virtual Arcade D-Pad & Controls for Touch or Quick Clicks */}
        <div className="w-full grid grid-cols-2 gap-4 p-2 bg-neutral-900/60 border border-neutral-800 rounded-b-lg">
          {/* D-Pad Buttons */}
          <div className="flex flex-col items-center justify-center gap-1">
            <button
              type="button"
              onMouseDown={() => (keysRef.current['ArrowUp'] = true)}
              onMouseUp={() => (keysRef.current['ArrowUp'] = false)}
              onTouchStart={() => (keysRef.current['ArrowUp'] = true)}
              onTouchEnd={() => (keysRef.current['ArrowUp'] = false)}
              className="w-10 h-10 rounded bg-neutral-800 active:bg-cyan-500 border border-neutral-700 text-white font-bold flex items-center justify-center text-xs"
            >
              ▲
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onMouseDown={() => (keysRef.current['ArrowLeft'] = true)}
                onMouseUp={() => (keysRef.current['ArrowLeft'] = false)}
                onTouchStart={() => (keysRef.current['ArrowLeft'] = true)}
                onTouchEnd={() => (keysRef.current['ArrowLeft'] = false)}
                className="w-10 h-10 rounded bg-neutral-800 active:bg-cyan-500 border border-neutral-700 text-white font-bold flex items-center justify-center text-xs"
              >
                ◀
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current['ArrowDown'] = true)}
                onMouseUp={() => (keysRef.current['ArrowDown'] = false)}
                onTouchStart={() => (keysRef.current['ArrowDown'] = true)}
                onTouchEnd={() => (keysRef.current['ArrowDown'] = false)}
                className="w-10 h-10 rounded bg-neutral-800 active:bg-cyan-500 border border-neutral-700 text-white font-bold flex items-center justify-center text-xs"
              >
                ▼
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current['ArrowRight'] = true)}
                onMouseUp={() => (keysRef.current['ArrowRight'] = false)}
                onTouchStart={() => (keysRef.current['ArrowRight'] = true)}
                onTouchEnd={() => (keysRef.current['ArrowRight'] = false)}
                className="w-10 h-10 rounded bg-neutral-800 active:bg-cyan-500 border border-neutral-700 text-white font-bold flex items-center justify-center text-xs"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onMouseDown={() => (keysRef.current['Space'] = true)}
              onMouseUp={() => (keysRef.current['Space'] = false)}
              onTouchStart={() => (keysRef.current['Space'] = true)}
              onTouchEnd={() => (keysRef.current['Space'] = false)}
              className="w-12 h-12 rounded-full bg-red-600 active:bg-red-400 border-2 border-red-400 text-white font-black shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center text-xs"
            >
              FIRE
            </button>
            <button
              type="button"
              onClick={() => {
                setGameState((s) => (s === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
                sounds.playClick(600);
              }}
              className="w-10 h-10 rounded-full bg-amber-600 active:bg-amber-400 border border-amber-400 text-black font-bold flex items-center justify-center text-[10px]"
            >
              PAUSE
            </button>
          </div>
        </div>
      </div>

      {/* In-Game Modules & Custom Asset Studio Overlay */}
      {modulesOverlayOpen && (
        <InGameModulesAssetOverlay
          isOpen={modulesOverlayOpen}
          onClose={() => setModulesOverlayOpen(false)}
          gameMode="SPACE_SIM"
          activeModules={activeModules}
          onToggleModuleEquip={(modId) => {
            setActiveModules((prev) => {
              const isEq = prev.some((m) => m.id === modId);
              if (isEq) return prev.filter((m) => m.id !== modId);
              const all = getModulesForGame('SPACE_SIM');
              const found = all.find((m) => m.id === modId);
              return found ? [...prev, found] : prev;
            });
          }}
        />
      )}
    </div>
  );
};
