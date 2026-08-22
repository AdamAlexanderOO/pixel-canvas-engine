import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Zap,
  Radio,
  Cpu,
  RefreshCw,
  Play,
  Pause,
  Trophy,
  Activity,
  Crosshair,
  Shield,
  Clock,
  Sparkles,
  Rocket,
  Flame,
  Eye,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Swords,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { SpaceDogfightSim3D } from './games/SpaceDogfightSim3D';
import { CyberFpsShooter3D } from './games/CyberFpsShooter3D';
import { ThirdPersonTacticalShooter3D } from './games/ThirdPersonTacticalShooter3D';
import { PixelArcade64x64 } from './games/PixelArcade64x64';

// Images generated for space sim, armor, weapon, and character
const ASSET_STARFIGHTER = '/images/space_starfighter_hero_1787089887255.jpg';
const ASSET_STEALTH_CORVETTE = '/images/stealth_corvette_1787434635548.jpg';
const ASSET_VALKYRIE_GUNDAM = '/images/valkyrie_gundam_1787434609815.jpg';
const ASSET_MECH_ARMOR = '/images/cyber_mech_armor_1787089900058.jpg';
const ASSET_PLASMA_RIFLE = '/images/cyber_plasma_rifle_1787089913135.jpg';
const ASSET_GAUSS_RAILGUN = '/images/gauss_railgun_1787434622054.jpg';
const ASSET_BEAM_SABER = '/images/beam_saber_1787434660618.jpg';
const ASSET_PILOT_HERO = '/images/cyber_pilot_hero_1787089924400.jpg';

type GameMode =
  | 'SPACE_SIM_3D'
  | 'PIXEL_ARCADE_64'
  | 'CYBER_FPS_3D'
  | 'TACTICAL_TPS_3D'
  | 'ARSENAL_LOADOUT'
  | 'PHOTON_RUNNER'
  | 'GEAR_SYNC'
  | 'RADAR_DEFENSE'
  | 'HEX_DECRYPT';

export const MiniGamesSuite: React.FC<{
  powerOn: boolean;
  fluxFrequency: number;
  onExitToMenu?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}> = ({ powerOn, fluxFrequency, onExitToMenu, isFullscreen: externalFullscreen, onToggleFullscreen }) => {
  const [activeGame, setActiveGame] = useState<GameMode>('SPACE_SIM_3D');
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const [selectedLoadoutCategory, setSelectedLoadoutCategory] = useState<'STARFIGHTER' | 'MECH' | 'WEAPON' | 'PILOT'>('STARFIGHTER');

  const isSuiteFullscreen = externalFullscreen !== undefined ? externalFullscreen : internalFullscreen;

  const toggleFullscreenMode = () => {
    const nextState = !isSuiteFullscreen;
    if (onToggleFullscreen) {
      onToggleFullscreen(nextState);
    } else {
      setInternalFullscreen(nextState);
    }
  };

  // Keyboard shortcut ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSuiteFullscreen) {
        if (onToggleFullscreen) {
          onToggleFullscreen(false);
        } else {
          setInternalFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuiteFullscreen, onToggleFullscreen]);

  const handleReturnToConsole = () => {
    haptics.trigger('click');
    if (isSuiteFullscreen) {
      if (onToggleFullscreen) {
        onToggleFullscreen(false);
      } else {
        setInternalFullscreen(false);
      }
    }
    if (onExitToMenu) {
      onExitToMenu();
    }
  };

  return (
    <div
      id="arcade-games-suite"
      className={`border border-white/10 bg-[#0A0A0A] text-neutral-200 font-mono transition-all duration-300 ${
        isSuiteFullscreen
          ? 'fixed inset-0 z-50 bg-[#050712] w-screen h-screen overflow-y-auto p-4 sm:p-6 rounded-none'
          : 'p-4 sm:p-7 rounded-xl'
      }`}
    >
      {/* Top Fullscreen Banner / Suite Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
                  3D ACTION ARCADE & FLIGHT SIM SUITE
                </h2>
                {isSuiteFullscreen && (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded uppercase tracking-wider animate-pulse">
                    FULLSCREEN DECK
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Full 3D space dogfighting, 1st-person cyber FPS arena, 3rd-person tactical mech shooters, and hangar arsenal loadouts.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Primary Game Selector Categories */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 border border-white/10 rounded-lg">
          {/* Back to Console Button */}
          {onExitToMenu && (
            <button
              type="button"
              onClick={handleReturnToConsole}
              className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 active:scale-95"
              title="Return to Main Hardware Console"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MAIN MENU</span>
            </button>
          )}

          {/* 3D Action & Sim Group */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(600);
              haptics.trigger('click');
              setActiveGame('SPACE_SIM_3D');
            }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              activeGame === 'SPACE_SIM_3D'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>3D Space Sim</span>
          </button>

          {/* 64x64 Retro Pixel Arcade Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(630);
              haptics.trigger('medium');
              setActiveGame('PIXEL_ARCADE_64');
            }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              activeGame === 'PIXEL_ARCADE_64'
                ? 'bg-amber-600 text-white shadow-[0_0_14px_rgba(245,158,11,0.6)] border border-amber-400'
                : 'text-amber-300 hover:text-white bg-amber-950/40 border border-amber-500/30'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span>64x64 Pixel Arcade</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick(650);
              haptics.trigger('click');
              setActiveGame('CYBER_FPS_3D');
            }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              activeGame === 'CYBER_FPS_3D'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>1st-Person FPS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick(700);
              haptics.trigger('click');
              setActiveGame('TACTICAL_TPS_3D');
            }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              activeGame === 'TACTICAL_TPS_3D'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-300 hover:text-white bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3rd-Person TPS</span>
          </button>

          {/* Arsenal & Hangar Loadouts */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(720);
              haptics.trigger('medium');
              setActiveGame('ARSENAL_LOADOUT');
            }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              activeGame === 'ARSENAL_LOADOUT'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                : 'text-cyan-300 hover:text-white bg-cyan-950/40 border border-cyan-500/30'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hangar & Arsenal</span>
          </button>

          {/* Retro Micro-Sims */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(750);
              haptics.trigger('light');
              setActiveGame('PHOTON_RUNNER');
            }}
            className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
              activeGame === 'PHOTON_RUNNER'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Runner
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(800);
              haptics.trigger('light');
              setActiveGame('GEAR_SYNC');
            }}
            className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
              activeGame === 'GEAR_SYNC'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Gear
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick(850);
              haptics.trigger('light');
              setActiveGame('RADAR_DEFENSE');
            }}
            className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
              activeGame === 'RADAR_DEFENSE'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Radar
          </button>

          {/* Suite Dedicated Full-Screen Toggle */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick(900);
              haptics.trigger('warning');
              toggleFullscreenMode();
            }}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all border ${
              isSuiteFullscreen
                ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title="Toggle Dedicated Fullscreen Gaming Mode"
          >
            {isSuiteFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">EXIT FULLSCREEN</span>
                <span className="sm:hidden">EXIT</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">FULLSCREEN DECK</span>
                <span className="sm:hidden">FULL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!powerOn ? (
        <div className="py-16 text-center text-neutral-500 flex flex-col items-center justify-center">
          <Activity className="w-8 h-8 mb-2 animate-pulse text-neutral-600" />
          <div className="font-bold text-sm tracking-widest">CONSOLE POWER OFFLINE</div>
          <span className="text-xs text-neutral-600 mt-1">Activate Hardware Deck Power to boot simulation engines</span>
        </div>
      ) : (
        <div>
          {activeGame === 'SPACE_SIM_3D' && (
            <SpaceDogfightSim3D
              powerOn={powerOn}
              fluxFrequency={fluxFrequency}
              onExitToMenu={handleReturnToConsole}
              onSwitchToPixelArcade={() => setActiveGame('PIXEL_ARCADE_64')}
            />
          )}
          {activeGame === 'PIXEL_ARCADE_64' && (
            <PixelArcade64x64
              onSwitchTo3D={() => setActiveGame('SPACE_SIM_3D')}
              onClose={handleReturnToConsole}
            />
          )}
          {activeGame === 'CYBER_FPS_3D' && (
            <CyberFpsShooter3D
              powerOn={powerOn}
              fluxFrequency={fluxFrequency}
              onExitToMenu={handleReturnToConsole}
            />
          )}
          {activeGame === 'TACTICAL_TPS_3D' && (
            <ThirdPersonTacticalShooter3D
              powerOn={powerOn}
              fluxFrequency={fluxFrequency}
              onExitToMenu={handleReturnToConsole}
            />
          )}
          {activeGame === 'ARSENAL_LOADOUT' && (
            <HangarArsenalView
              category={selectedLoadoutCategory}
              onSelectCategory={setSelectedLoadoutCategory}
              onLaunchGame={(mode) => {
                setActiveGame(mode);
                sounds.playClick(900);
              }}
            />
          )}
          {activeGame === 'PHOTON_RUNNER' && <PhotonRunnerGame flux={fluxFrequency} />}
          {activeGame === 'GEAR_SYNC' && <GearSyncGame flux={fluxFrequency} />}
          {activeGame === 'RADAR_DEFENSE' && <RadarDefenseGame />}
          {activeGame === 'HEX_DECRYPT' && <HexDecryptGame />}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   GAME 1: PHOTON FLUX RUNNER (PCB Grid Circuit Navigation)
   ========================================================================= */
const PhotonRunnerGame: React.FC<{ flux: number }> = ({ flux }) => {
  const [playerLane, setPlayerLane] = useState<number>(1); // 0, 1, 2
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [obstacles, setObstacles] = useState<Array<{ id: number; lane: number; y: number; type: 'GATE' | 'ORB' }>>([]);
  const nextId = useRef(0);

  const startGame = () => {
    sounds.playSimulatePulse();
    setScore(0);
    setObstacles([]);
    setPlayerLane(1);
    setGameOver(false);
    setIsPlaying(true);
  };

  // Game Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const interval = setInterval(() => {
      setObstacles((prev) => {
        // Move down
        const moved = prev
          .map((o) => ({ ...o, y: o.y + 8 }))
          .filter((o) => o.y < 100);

        // Check collisions near bottom (y between 78 and 92)
        for (const obs of moved) {
          if (obs.y >= 78 && obs.y <= 92 && obs.lane === playerLane) {
            if (obs.type === 'GATE') {
              sounds.playClick(220, 'sawtooth');
              setGameOver(true);
              setIsPlaying(false);
              setHighScore((h) => Math.max(h, score));
              return prev;
            } else if (obs.type === 'ORB') {
              sounds.playClick(1200, 'sine');
              setScore((s) => s + 50);
              return moved.filter((o) => o.id !== obs.id);
            }
          }
        }

        // Spawn new obstacle
        if (Math.random() < 0.35) {
          const lane = Math.floor(Math.random() * 3);
          const type = Math.random() < 0.65 ? 'GATE' : 'ORB';
          moved.push({ id: nextId.current++, lane, y: 0, type });
        }

        return moved;
      });

      setScore((s) => s + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, playerLane, score]);

  return (
    <div className="space-y-4">
      {/* HUD Bar */}
      <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-neutral-400">SCORE:</span>{' '}
            <span className="font-bold text-white text-sm">{score}</span>
          </div>
          <div>
            <span className="text-neutral-400">BEST:</span>{' '}
            <span className="font-bold text-red-500">{highScore}</span>
          </div>
          <div>
            <span className="text-neutral-400">BUS FLUX:</span>{' '}
            <span className="text-white">{flux.toFixed(0)} GHz</span>
          </div>
        </div>

        {!isPlaying ? (
          <button
            onClick={startGame}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-neutral-200"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{gameOver ? 'RETRY RUN' : 'INITIATE BEAM'}</span>
          </button>
        ) : (
          <span className="text-red-500 animate-pulse font-bold tracking-widest text-[11px]">
            ● QUANTUM FLUX ACTIVE
          </span>
        )}
      </div>

      {/* Game Stage (PCB Runway) */}
      <div className="relative h-64 border border-white/20 bg-[#050505] overflow-hidden select-none">
        {/* PCB Trace Lines (3 vertical lanes) */}
        <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/10">
          <div className="relative flex justify-center">
            <div className="w-0.5 h-full bg-white/5" />
          </div>
          <div className="relative flex justify-center">
            <div className="w-0.5 h-full bg-white/5" />
          </div>
          <div className="relative flex justify-center">
            <div className="w-0.5 h-full bg-white/5" />
          </div>
        </div>

        {/* Moving obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-75"
            style={{
              left: `${obs.lane * 33.33 + 16.66}%`,
              top: `${obs.y}%`,
            }}
          >
            {obs.type === 'GATE' ? (
              <div className="w-16 h-4 bg-red-950/80 border border-red-500 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)] rounded-sm">
                <span className="text-[8px] font-bold text-red-200 tracking-widest uppercase">ENERGY GATE</span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded border border-red-500/80 overflow-hidden shadow-[0_0_10px_rgba(239,68,68,0.6)] bg-black">
                <img
                  src="/images/enemy_drone_fighter_1787090400681.jpg"
                  alt="Enemy Drone"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}

        {/* Player Starfighter Ship */}
        <motion.div
          animate={{
            left: `${playerLane * 33.33 + 16.66}%`,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute bottom-4 transform -translate-x-1/2 flex flex-col items-center"
        >
          <div className="w-10 h-10 rounded border-2 border-cyan-400 overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.8)] bg-black">
            <img
              src="/images/space_starfighter_hero_1787089887255.jpg"
              alt="Player Starfighter"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-1.5 h-6 bg-gradient-to-t from-transparent via-cyan-400 to-blue-600 mt-0.5 rounded-full shadow-[0_0_8px_#00f0ff]" />
        </motion.div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-4">
            <div className="text-red-500 font-black text-xl tracking-widest mb-1">
              CIRCUIT TRACE OVERLOAD
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Photon packet ruptured against circuit gate. Final Score: {score}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-neutral-200"
            >
              REBOOT TRACE
            </button>
          </div>
        )}
      </div>

      {/* Touch & Keyboard Controls */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            sounds.playClick(700);
            setPlayerLane(0);
          }}
          className="py-3 border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white transition-all"
        >
          LANE 01 [LEFT]
        </button>
        <button
          onClick={() => {
            sounds.playClick(800);
            setPlayerLane(1);
          }}
          className="py-3 border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white transition-all"
        >
          LANE 02 [CENTER]
        </button>
        <button
          onClick={() => {
            sounds.playClick(900);
            setPlayerLane(2);
          }}
          className="py-3 border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white transition-all"
        >
          LANE 03 [RIGHT]
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   GAME 2: CHRONO-GEAR ESCAPEMENT SYNCHRONIZER
   ========================================================================= */
const GearSyncGame: React.FC<{ flux: number }> = ({ flux }) => {
  const [targetRpm, setTargetRpm] = useState<number>(1400);
  const [currentRpm, setCurrentRpm] = useState<number>(800);
  const [gearRatio, setGearRatio] = useState<number>(2.0);
  const [syncScore, setSyncScore] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('Calibrate gear ratios to lock harmonic frequency.');

  const randomizeTarget = () => {
    sounds.playGearTick();
    const newTarget = Math.floor(600 + Math.random() * 1600);
    setTargetRpm(newTarget);
    setIsLocked(false);
    setFeedback(`Target recalibrated to ${newTarget} RPM. Adjust drive ratios!`);
  };

  const handleAdjustRatio = (delta: number) => {
    sounds.playGearTick();
    const nextRatio = Math.max(0.5, Math.min(5.0, +(gearRatio + delta).toFixed(1)));
    setGearRatio(nextRatio);
    const calculatedRpm = Math.round(flux * 18.5 * nextRatio);
    setCurrentRpm(calculatedRpm);

    if (Math.abs(calculatedRpm - targetRpm) <= 80) {
      sounds.playSimulatePulse();
      setIsLocked(true);
      setSyncScore((s) => s + 100);
      setFeedback('★ HARMONIC LOCK ACHIEVED! Escapement meshed perfectly.');
    } else {
      setIsLocked(false);
      setFeedback(
        calculatedRpm > targetRpm ? 'OVER-TORQUE: Reduce gear ratio.' : 'UNDER-TORQUE: Increase gear ratio.'
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Status */}
      <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5 text-xs">
        <div>
          <span className="text-neutral-400">SYNC STREAK:</span>{' '}
          <span className="font-bold text-red-500">{syncScore} PTS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">HARMONIC STATUS:</span>
          <span className={`font-bold ${isLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isLocked ? 'SYNCHRONIZED' : 'MISALIGNED'}
          </span>
        </div>
        <button
          onClick={randomizeTarget}
          className="px-3 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white"
        >
          NEW TARGET
        </button>
      </div>

      {/* Visual Gear Animation & Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gear Visualizer */}
        <div className="h-56 border border-white/20 bg-[#050505] p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="flex items-center gap-6">
            {/* Drive Gear */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: Math.max(0.2, 4000 / (currentRpm || 100)), ease: 'linear' }}
              className="w-24 h-24 rounded-full border-4 border-dashed border-white flex items-center justify-center relative"
            >
              <div className="w-8 h-8 rounded-full border border-white/40 bg-neutral-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600" />
              </div>
              <span className="absolute -bottom-4 text-[9px] text-neutral-400">DRIVE 36T</span>
            </motion.div>

            {/* Meshed Pinion Gear */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                repeat: Infinity,
                duration: Math.max(0.1, 4000 / ((currentRpm * gearRatio) || 100)),
                ease: 'linear',
              }}
              className="w-16 h-16 rounded-full border-4 border-dashed border-red-600 flex items-center justify-center relative"
            >
              <div className="w-5 h-5 rounded-full border border-red-500 bg-neutral-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white" />
              </div>
              <span className="absolute -bottom-4 text-[9px] text-neutral-400">PINION</span>
            </motion.div>
          </div>

          <div className="absolute bottom-2 text-center text-[10px] font-mono text-neutral-300">
            {feedback}
          </div>
        </div>

        {/* RPM Dials & Ratio Slider */}
        <div className="border border-white/20 bg-[#050505] p-4 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 border border-white/10 bg-white/5">
              <div className="text-[10px] text-neutral-400">TARGET RPM</div>
              <div className="text-base font-black text-red-500">{targetRpm}</div>
            </div>
            <div className="p-2 border border-white/10 bg-white/5">
              <div className="text-[10px] text-neutral-400">CURRENT RPM</div>
              <div className="text-base font-black text-white">{currentRpm}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">GEAR RATIO</span>
              <span className="font-bold text-white">{gearRatio.toFixed(1)} : 1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAdjustRatio(-0.2)}
                className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-white font-bold"
              >
                -
              </button>
              <div className="flex-1 h-2 bg-neutral-800 relative">
                <div
                  className="h-full bg-red-600"
                  style={{ width: `${((gearRatio - 0.5) / 4.5) * 100}%` }}
                />
              </div>
              <button
                onClick={() => handleAdjustRatio(0.2)}
                className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-white font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (isLocked) {
                randomizeTarget();
              } else {
                sounds.playClick(300);
                setFeedback('RATIO MISMATCH: Adjust ratio to match Target RPM.');
              }
            }}
            className={`w-full py-2 font-bold uppercase tracking-wider text-xs transition-all ${
              isLocked
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white/10 text-neutral-400 hover:bg-white/20'
            }`}
          >
            {isLocked ? 'NEXT CALIBRATION CYCLE' : 'CHECK ENGAGEMENT'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   GAME 3: RADAR SECTOR INTERCEPTOR
   ========================================================================= */
const RadarDefenseGame: React.FC = () => {
  const [targets, setTargets] = useState<Array<{ id: number; angle: number; radius: number; hp: number }>>([]);
  const [score, setScore] = useState<number>(0);
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [baseHealth, setBaseHealth] = useState<number>(100);
  const targetId = useRef(0);

  // Radar sweep and target approach
  useEffect(() => {
    const sweep = setInterval(() => {
      setRadarAngle((a) => (a + 4) % 360);
    }, 40);

    const gameTick = setInterval(() => {
      setTargets((prev) => {
        // Targets move closer to center
        const updated = prev
          .map((t) => ({ ...t, radius: t.radius - 1.5 }))
          .filter((t) => {
            if (t.radius <= 10) {
              sounds.playClick(180, 'sawtooth');
              setBaseHealth((h) => Math.max(0, h - 15));
              return false;
            }
            return true;
          });

        // Spawn target
        if (updated.length < 4 + wave && Math.random() < 0.4) {
          updated.push({
            id: targetId.current++,
            angle: Math.floor(Math.random() * 360),
            radius: 90,
            hp: 1,
          });
        }
        return updated;
      });
    }, 400);

    return () => {
      clearInterval(sweep);
      clearInterval(gameTick);
    };
  }, [wave]);

  const handleIntercept = (id: number) => {
    sounds.playClick(1100, 'triangle');
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((s) => s + 25);
    if ((score + 25) % 150 === 0) {
      setWave((w) => w + 1);
      sounds.playSimulatePulse();
    }
  };

  return (
    <div className="space-y-4">
      {/* Radar HUD */}
      <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5 text-xs">
        <div>
          <span className="text-neutral-400">SECTOR SCORE:</span>{' '}
          <span className="font-bold text-white">{score}</span>
        </div>
        <div>
          <span className="text-neutral-400">DEFENSE WAVE:</span>{' '}
          <span className="font-bold text-red-500">WAVE 0{wave}</span>
        </div>
        <div>
          <span className="text-neutral-400">CORE SHIELD:</span>{' '}
          <span className="font-bold text-white">{baseHealth}%</span>
        </div>
      </div>

      {/* Interactive 360 Radar Canvas Area */}
      <div className="relative h-72 border border-white/20 bg-[#050505] flex items-center justify-center overflow-hidden">
        {/* Concentric rings */}
        <div className="absolute w-60 h-60 rounded-full border border-white/10" />
        <div className="absolute w-44 h-44 rounded-full border border-white/10" />
        <div className="absolute w-28 h-28 rounded-full border border-white/10" />
        <div className="absolute w-12 h-12 rounded-full border border-red-500/50 bg-red-950/20" />

        {/* Crosshair grid */}
        <div className="absolute w-full h-[1px] bg-white/10" />
        <div className="absolute h-full w-[1px] bg-white/10" />

        {/* Sweeping Beam */}
        <div
          className="absolute w-36 h-36 origin-bottom-right pointer-events-none"
          style={{
            transform: `rotate(${radarAngle}deg)`,
            background: 'conic-gradient(from 0deg, rgba(220,38,38,0.3) 0deg, transparent 60deg)',
            top: 'calc(50% - 144px)',
            left: 'calc(50% - 144px)',
          }}
        />

        {/* Anomalous Targets */}
        {targets.map((t) => {
          const rad = (t.angle * Math.PI) / 180;
          const distancePx = (t.radius / 100) * 120;
          const x = Math.cos(rad) * distancePx;
          const y = Math.sin(rad) * distancePx;
          const isHeavy = t.id % 3 === 0;

          return (
            <button
              key={t.id}
              onClick={() => handleIntercept(t.id)}
              className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group cursor-crosshair z-20"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <div className="w-8 h-8 rounded-full border border-red-500/80 bg-black overflow-hidden shadow-[0_0_10px_rgba(239,68,68,0.8)] group-hover:scale-125 transition-transform">
                <img
                  src={
                    isHeavy
                      ? '/images/enemy_cruiser_boss_1787090414452.jpg'
                      : '/images/enemy_drone_fighter_1787090400681.jpg'
                  }
                  alt="Radar Hostile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </button>
          );
        })}

        {/* Base Health Warning if 0 */}
        {baseHealth <= 0 && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-4 z-30">
            <div className="text-red-500 font-black text-lg tracking-widest mb-1">
              DEFENSE PERIMETER BREACHED
            </div>
            <p className="text-xs text-neutral-400 mb-3">Sector 07 overwhelmed by flux anomalies.</p>
            <button
              onClick={() => {
                setBaseHealth(100);
                setScore(0);
                setTargets([]);
              }}
              className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-neutral-200"
            >
              RE-ENGAGE RADAR
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-neutral-400">
        Click or tap approaching red target markers to discharge anti-anomaly quantum pulses before they reach the core.
      </div>
    </div>
  );
};

/* =========================================================================
   GAME 4: HEX NEURAL DECRYPTOR
   ========================================================================= */
const HexDecryptGame: React.FC = () => {
  const hexCodes = ['0x4F', '0x8A', '0xC2', '0x19', '0xFF', '0x3B', '0x7E', '0x9D', '0xE4'];
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'SUCCESS' | 'FAILED'>('IDLE');

  const startLevel = (nextLvl = 1) => {
    sounds.playSimulatePulse();
    setLevel(nextLvl);
    setPlayerInput([]);
    setGameStatus('PLAYING');
    setIsShowingSequence(true);

    // Generate sequence of length nextLvl + 2
    const newSeq = Array.from({ length: nextLvl + 2 }, () => Math.floor(Math.random() * 9));
    setSequence(newSeq);

    // Play sequence animation
    let step = 0;
    const seqInterval = setInterval(() => {
      if (step < newSeq.length) {
        const node = newSeq[step];
        setActiveHighlight(node);
        sounds.playClick(440 + node * 60);
        setTimeout(() => setActiveHighlight(null), 300);
        step++;
      } else {
        clearInterval(seqInterval);
        setIsShowingSequence(false);
      }
    }, 600);
  };

  const handleNodeClick = (index: number) => {
    if (isShowingSequence || gameStatus !== 'PLAYING') return;

    sounds.playClick(440 + index * 60);
    const nextInput = [...playerInput, index];
    setPlayerInput(nextInput);

    // Check if right so far
    const currentIndex = nextInput.length - 1;
    if (nextInput[currentIndex] !== sequence[currentIndex]) {
      sounds.playClick(200, 'sawtooth');
      setGameStatus('FAILED');
      return;
    }

    // Check if completed full sequence
    if (nextInput.length === sequence.length) {
      sounds.playSpectrumLoad();
      setGameStatus('SUCCESS');
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5 text-xs">
        <div>
          <span className="text-neutral-400">CIPHER LEVEL:</span>{' '}
          <span className="font-bold text-white">LEVEL 0{level}</span>
        </div>
        <div>
          <span className="text-neutral-400">PROGRESS:</span>{' '}
          <span className="font-bold text-red-500">
            {playerInput.length} / {sequence.length || 3}
          </span>
        </div>
        <button
          onClick={() => startLevel(1)}
          className="px-3 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white"
        >
          RESET CIPHER
        </button>
      </div>

      {/* 3x3 Hex Node Keypad */}
      <div className="grid grid-cols-3 gap-3 p-4 border border-white/20 bg-[#050505] max-w-sm mx-auto">
        {hexCodes.map((code, idx) => {
          const isHighlighted = activeHighlight === idx;
          return (
            <button
              key={idx}
              onClick={() => handleNodeClick(idx)}
              disabled={isShowingSequence}
              className={`h-20 border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${
                isHighlighted
                  ? 'border-white bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.8)] scale-105'
                  : 'border-white/20 bg-white/5 text-neutral-300 hover:bg-white/15 hover:border-white/40'
              }`}
            >
              <span className="text-[9px] text-neutral-400">NODE 0{idx + 1}</span>
              <span className="text-sm font-black text-white mt-1">{code}</span>
            </button>
          );
        })}
      </div>

      {/* Status Directive */}
      <div className="text-center p-3 border border-white/10 bg-white/5 text-xs">
        {gameStatus === 'IDLE' && (
          <button
            onClick={() => startLevel(1)}
            className="px-6 py-1.5 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-neutral-200"
          >
            START NEURAL CIPHER
          </button>
        )}
        {gameStatus === 'PLAYING' && (
          <span className="text-neutral-300">
            {isShowingSequence ? 'MEMORIZE NEURAL FLASH SEQUENCE...' : 'REPLICATE CIPHER SEQUENCE ON KEYPAD'}
          </span>
        )}
        {gameStatus === 'SUCCESS' && (
          <div className="flex items-center justify-center gap-3">
            <span className="text-emerald-400 font-bold">CIPHER CRACKED!</span>
            <button
              onClick={() => startLevel(level + 1)}
              className="px-4 py-1 bg-red-600 text-white font-bold uppercase text-[10px] hover:bg-red-700"
            >
              ADVANCE TO LEVEL {level + 1}
            </button>
          </div>
        )}
        {gameStatus === 'FAILED' && (
          <div className="flex items-center justify-center gap-3">
            <span className="text-red-500 font-bold">ACCESS DENIED</span>
            <button
              onClick={() => startLevel(level)}
              className="px-4 py-1 bg-white text-black font-bold uppercase text-[10px] hover:bg-neutral-200"
            >
              RETRY LEVEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   HANGAR & ARSENAL LOADOUT VIEW (SHIPS, MECHS, WEAPONS, PILOTS)
   ========================================================================= */
interface HangarArsenalViewProps {
  category: 'STARFIGHTER' | 'MECH' | 'WEAPON' | 'PILOT';
  onSelectCategory: (cat: 'STARFIGHTER' | 'MECH' | 'WEAPON' | 'PILOT') => void;
  onLaunchGame: (mode: GameMode) => void;
}

const HangarArsenalView: React.FC<HangarArsenalViewProps> = ({
  category,
  onSelectCategory,
  onLaunchGame,
}) => {
  const [selectedLoadoutIndex, setSelectedLoadoutIndex] = useState<number>(0);
  const [isEquipped, setIsEquipped] = useState<boolean>(false);

  const handleEquip = () => {
    sounds.playSimulatePulse();
    setIsEquipped(true);
    setTimeout(() => setIsEquipped(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => {
            sounds.playClick(600);
            onSelectCategory('STARFIGHTER');
            setSelectedLoadoutIndex(0);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            category === 'STARFIGHTER'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
              : 'bg-white/5 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          <Rocket className="w-4 h-4 text-cyan-400" />
          <span>3D Space Starfighters</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick(650);
            onSelectCategory('MECH');
            setSelectedLoadoutIndex(0);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            category === 'MECH'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
              : 'bg-white/5 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Tactical Exo-Armor Mechs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick(700);
            onSelectCategory('WEAPON');
            setSelectedLoadoutIndex(0);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            category === 'WEAPON'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
              : 'bg-white/5 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span>Plasma & Ion Weapons</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick(750);
            onSelectCategory('PILOT');
            setSelectedLoadoutIndex(0);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            category === 'PILOT'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
              : 'bg-white/5 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Cybernetic Pilots</span>
        </button>
      </div>

      {/* CATEGORY 1: 3D SPACE STARFIGHTER */}
      {category === 'STARFIGHTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/60 border border-white/10 p-4 sm:p-6 rounded-xl">
          {/* Image Viewport */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 bg-neutral-950 aspect-[16/9] group shadow-2xl">
              <img
                src={ASSET_STARFIGHTER}
                alt="Aurora Heavy Interdictor Starfighter"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-cyan-400/50 rounded text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                <span>AURORA MK-IV INTERDICTOR</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded text-[10px] font-mono text-amber-400">
                DRIVE: HYPER-WARP 3.8X
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span>HULL CODE: <b className="text-white">AUR-0913-B</b></span>
              <span>CLASS: <b className="text-cyan-300">HEAVY ASSAULT FIGHTER</b></span>
            </div>
          </div>

          {/* Stats & Launch Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">
                VESSEL SPECIFICATIONS
              </div>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                AURORA MK-IV INTERDICTOR
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Equipped with dual forward plasma cannons, sub-space warp boosters, and omni-directional tactical lock-on tracking for space dogfighting.
              </p>

              {/* Stat Sliders */}
              <div className="space-y-2.5 mt-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-cyan-300">SHIELD ABSORPTION</span>
                    <span className="text-white">96%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                    <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" style={{ width: '96%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-amber-300">ION CANNON FIREPOWER</span>
                    <span className="text-white">88%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/30">
                    <div className="h-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" style={{ width: '88%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-emerald-300">PITCH & ROLL AGILITY</span>
                    <span className="text-white">92%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-emerald-500/30">
                    <div className="h-full bg-emerald-400 shadow-[0_0_8px_#10b981]" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onLaunchGame('SPACE_SIM_3D')}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>LAUNCH STARFIGHTER INTO 3D SPACE SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 2: TACTICAL EXO-ARMOR MECH */}
      {category === 'MECH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/60 border border-white/10 p-4 sm:p-6 rounded-xl">
          {/* Image Viewport */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-red-500/30 bg-neutral-950 aspect-square group shadow-2xl max-h-[420px]">
              <img
                src={ASSET_MECH_ARMOR}
                alt="Vanguard Goliath-Buster Heavy Mech Suit"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-red-400/50 rounded text-[10px] font-bold text-red-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>VANGUARD MK-VII GOLIATH-BUSTER</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded text-[10px] font-mono text-cyan-400">
                ARMOR: TITANIUM COMPOSITE
              </div>
            </div>
          </div>

          {/* Stats & Launch Action */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">
                EXO-CHASSIS SPECIFICATIONS
              </div>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                MK-VII TACTICAL BATTLESUIT
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Heavy mechanized battle armor designed for urban breach combat. Features kinetic force barriers, high-output tactical dash thrusters, and satellite orbital strike uplink beacons.
              </p>

              {/* Stat Sliders */}
              <div className="space-y-2.5 mt-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-red-400">BALLISTIC PLATING INTEGRITY</span>
                    <span className="text-white">99%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                    <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444]" style={{ width: '99%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-cyan-300">FORCE SHIELD REGENERATION</span>
                    <span className="text-white">91%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                    <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" style={{ width: '91%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-amber-300">ORBITAL LASER UPLINK BANDWIDTH</span>
                    <span className="text-white">100%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/30">
                    <div className="h-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onLaunchGame('TACTICAL_TPS_3D')}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>DEPLOY MECH INTO 3D TACTICAL TPS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 3: PLASMA & ION WEAPONS */}
      {category === 'WEAPON' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/60 border border-white/10 p-4 sm:p-6 rounded-xl">
          {/* Image Viewport */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-amber-500/30 bg-neutral-950 aspect-[16/9] group shadow-2xl">
              <img
                src={ASSET_PLASMA_RIFLE}
                alt="Synapse Overdrive Plasma Beam Weapon"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-amber-400/50 rounded text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>SYNAPSE OVERCHARGER 9000</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded text-[10px] font-mono text-cyan-400">
                CALIBER: 40MM SUB-ATOMIC ION
              </div>
            </div>
          </div>

          {/* Stats & Launch Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                WEAPON ARSENAL PROFILE
              </div>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                SYNAPSE PLASMA BEAM RIFLE
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Rapid-pulse ionization rifle with built-in neural synaptic time dilation chamber. Allows operatives to enter bullet-time slow motion.
              </p>

              {/* Stat Sliders */}
              <div className="space-y-2.5 mt-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-red-400">DAMAGE PER DISCHARGE</span>
                    <span className="text-white">94%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                    <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444]" style={{ width: '94%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-cyan-300">RATE OF FIRE</span>
                    <span className="text-white">850 RPM</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                    <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-amber-300">SLOW-MO DURATION BOOST</span>
                    <span className="text-white">+5.0 SEC</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/30">
                    <div className="h-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onLaunchGame('CYBER_FPS_3D')}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Crosshair className="w-4 h-4" />
                <span>EQUIP WEAPON & ENTER 3D CYBER FPS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 4: CYBERNETIC PILOTS */}
      {category === 'PILOT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/60 border border-white/10 p-4 sm:p-6 rounded-xl">
          {/* Image Viewport */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-emerald-500/30 bg-neutral-950 aspect-square group shadow-2xl max-h-[420px]">
              <img
                src={ASSET_PILOT_HERO}
                alt="Commander Valen Cross"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-emerald-400/50 rounded text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>COMMANDER VALEN CROSS // CALLSIGN: AURORA-01</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded text-[10px] font-mono text-amber-400">
                SYNC RATE: 99.8%
              </div>
            </div>
          </div>

          {/* Stats & Launch Action */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                CYBER OPERATIVE PROFILE
              </div>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                COMMANDER VALEN CROSS
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Ace pilot of the Vanguard Coalition. Cybernetically augmented with neural quantum reflex chips and real-time optical target trajectory analysis.
              </p>

              {/* Stat Sliders */}
              <div className="space-y-2.5 mt-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-emerald-400">NEURAL SYNC EFFICIENCY</span>
                    <span className="text-white">99.8%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-emerald-500/30">
                    <div className="h-full bg-emerald-400 shadow-[0_0_8px_#10b981]" style={{ width: '99%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-cyan-300">REFLEX REACTION TIME</span>
                    <span className="text-white">2.4 MS</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                    <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" style={{ width: '95%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-red-400">DOGFIGHT KILL RATIO</span>
                    <span className="text-white">48 : 0</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                    <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444]" style={{ width: '98%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => onLaunchGame('SPACE_SIM_3D')}
                className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>PILOT STARFIGHTER</span>
              </button>

              <button
                type="button"
                onClick={() => onLaunchGame('TACTICAL_TPS_3D')}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>PILOT MECH</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
