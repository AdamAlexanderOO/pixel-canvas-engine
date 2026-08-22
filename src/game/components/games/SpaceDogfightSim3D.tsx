import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Rocket,
  Shield,
  Crosshair,
  Zap,
  Flame,
  Radio,
  Sparkles,
  Eye,
  Sliders,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Layers,
  Grid,
  Binary,
  Activity,
  Info,
  X,
  Gamepad2,
  Database,
  Box,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { createLevel4MosaicTexture } from '../../utils/mosaicCharacterRenderer';
import { InGameModulesAssetOverlay } from './InGameModulesAssetOverlay';
import {
  GameModuleAsset,
  getModulesForGame,
} from '../../data/gameModulesMetadata';
import {
  getEquippedAssetForSlot,
  createCustomAssetThreeTexture,
} from '../../utils/customCharacterStore';

interface SpaceDogfightSimProps {
  powerOn: boolean;
  fluxFrequency: number;
  onExitToMenu?: () => void;
  onSwitchToPixelArcade?: () => void;
}

export const SpaceDogfightSim3D: React.FC<SpaceDogfightSimProps> = ({
  powerOn,
  onExitToMenu,
  onSwitchToPixelArcade,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [hullHealth, setHullHealth] = useState<number>(100);
  const [shieldEnergy, setShieldEnergy] = useState<number>(100);
  const [missileCount, setMissileCount] = useState<number>(8);
  const [wave, setWave] = useState<number>(1);
  const [targetLock, setTargetLock] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'COCKPIT' | 'THIRD_PERSON'>('COCKPIT');
  const [boostActive, setBoostActive] = useState<boolean>(false);
  const [invertPitch, setInvertPitch] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(6);

  // Roman Mosaic Building Overlay & Fidelity Scanner State
  const [mosaicOverlayActive, setMosaicOverlayActive] = useState<boolean>(true);
  const [mosaicFidelityTier, setMosaicFidelityTier] = useState<'300' | '200' | '150' | 'ULTRA'>('150');
  const [showMosaicInspector, setShowMosaicInspector] = useState<boolean>(false);

  // Tactical In-Game 2D/3D Modules Asset Deck
  const [modulesOverlayOpen, setModulesOverlayOpen] = useState<boolean>(false);
  const [activeModules, setActiveModules] = useState<GameModuleAsset[]>(() =>
    getModulesForGame('SPACE_SIM').filter((m) => m.isEquipped)
  );

  const toggleModuleEquip = (moduleId: string) => {
    setActiveModules((prev) => {
      const isEq = prev.some((m) => m.id === moduleId);
      if (isEq) {
        return prev.filter((m) => m.id !== moduleId);
      } else {
        const all = getModulesForGame('SPACE_SIM');
        const found = all.find((m) => m.id === moduleId);
        return found ? [...prev, found] : prev;
      }
    });
  };

  const gameRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerShip: THREE.Group;
    cockpitHudMesh: THREE.Group;
    sharedGeos: Record<string, THREE.BufferGeometry>;
    sharedMats: Record<string, THREE.Material>;
    lasers: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; isPlayer: boolean }>;
    missiles: Array<{ mesh: THREE.Mesh; target: THREE.Group | null; velocity: THREE.Vector3; life: number }>;
    enemies: Array<{
      mesh: THREE.Group;
      health: number;
      maxHealth: number;
      speed: number;
      shootTimer: number;
      type: 'DRONE' | 'CRUISER';
      turnSeed: number;
    }>;
    asteroids: Array<{ mesh: THREE.Mesh; rotationSpeed: THREE.Vector3 }>;
    particles: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }>;
    starfield: THREE.Points;
    shipPos: THREE.Vector3;
    shipRot: THREE.Euler;
    keys: Record<string, boolean>;
    touchStick: { x: number; y: number };
    isShooting: boolean;
    isBoosting: boolean;
    lastShotTime: number;
    animFrameId: number;
    viewMode: 'COCKPIT' | 'THIRD_PERSON';
    invertPitch: boolean;
    isPlaying: boolean;
    // Decoupled runtime vitals to prevent React thrashing
    liveHull: number;
    liveShield: number;
    liveScore: number;
    liveMissiles: number;
    liveEnemiesCount: number;
    liveLockText: string | null;
  }>({} as any);

  // Sync React UI at 10Hz smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (!g || !g.isPlaying) return;
      setHullHealth(Math.round(g.liveHull));
      setShieldEnergy(Math.round(g.liveShield));
      setScore(g.liveScore);
      setMissileCount(g.liveMissiles);
      setEnemiesRemaining(g.liveEnemiesCount);
      setTargetLock(g.liveLockText);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020308);
    scene.fog = new THREE.FogExp2(0x020308, 0.0012);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 2500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1a2b4c, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    sunLight.position.set(100, 80, 50);
    scene.add(sunLight);

    const nebulaPoint = new THREE.PointLight(0x00f0ff, 2.5, 400);
    nebulaPoint.position.set(-80, 50, -120);
    scene.add(nebulaPoint);

    // Shared Geometries & Materials
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 5);
    laserGeo.rotateX(Math.PI / 2);
    const missileGeo = new THREE.ConeGeometry(0.35, 1.4, 6);
    missileGeo.rotateX(Math.PI / 2);
    const particleGeo = new THREE.SphereGeometry(0.2, 4, 4);

    const pLaserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const eLaserMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const missileMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400 });
    const pMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const pMatOrange = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const pMatRed = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Starfield Background
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 2000;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      const isCyan = Math.random() > 0.6;
      starColors[i * 3] = isCyan ? 0.2 : 1.0;
      starColors[i * 3 + 1] = isCyan ? 0.9 : 0.9;
      starColors[i * 3 + 2] = 1.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starfield = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 2.2, vertexColors: true, transparent: true, opacity: 0.8 })
    );
    scene.add(starfield);

    // Hand-Drawn Painterly Cosmic Sky Sphere for AAA Depth
    const cosmicNebulaTexture = createLevel4MosaicTexture('DEEP_SPACE_NEBULA', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#c084fc',
      groutIntensity: 25,
      preservePaintingDetail: true,
    });
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(1600, 32, 32),
      new THREE.MeshBasicMaterial({
        map: cosmicNebulaTexture,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    scene.add(skyDome);

    // Generate Level 4 Roman Mosaic Textures for Starships & Space Combat Entities
    const equippedSpaceAsset = getEquippedAssetForSlot('SPACE_STARFIGHTER');
    const starfighterMosaic = equippedSpaceAsset
      ? createCustomAssetThreeTexture(equippedSpaceAsset)
      : createLevel4MosaicTexture('STARFIGHTER_INTERCEPTOR', {
          tileSize: 3,
          tileStyle: 'ROMAN_STONE',
          primaryGlow: '#00f0ff',
          groutIntensity: 45,
          preservePaintingDetail: true,
        });
    const cruiserMosaic = createLevel4MosaicTexture('CRUISER_BOSS', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ff0055',
      groutIntensity: 45,
      preservePaintingDetail: true,
    });
    const stealthCorvetteMosaic = createLevel4MosaicTexture('STEALTH_CORVETTE', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00f0ff',
      groutIntensity: 40,
      preservePaintingDetail: true,
    });
    const droneFighterMosaic = createLevel4MosaicTexture('CYBER_DRONE', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00ffff',
      groutIntensity: 40,
      preservePaintingDetail: true,
    });

    const droneMosaicMat = new THREE.MeshStandardMaterial({
      map: droneFighterMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const stealthMosaicMat = new THREE.MeshStandardMaterial({
      map: stealthCorvetteMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const cruiserMosaicMat = new THREE.MeshStandardMaterial({
      map: cruiserMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });

    const sharedGeos = { laserGeo, missileGeo, particleGeo };
    const sharedMats = {
      pLaserMat,
      eLaserMat,
      missileMat,
      pMatCyan,
      pMatOrange,
      pMatRed,
      droneMosaicMat,
      cruiserMosaicMat,
    };

    // Player Starship Model (3rd Person)
    const playerShip = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(1.2, 5, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshStandardMaterial({
        map: starfighterMosaic,
        color: 0x88ccff,
        roughness: 0.2,
        metalness: 0.85,
      })
    );
    playerShip.add(body);

    const cockpitGeo = new THREE.SphereGeometry(0.7, 12, 8);
    cockpitGeo.scale(0.8, 0.6, 1.8);
    const cockpit = new THREE.Mesh(
      cockpitGeo,
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x0088cc, roughness: 0.1, metalness: 0.9 })
    );
    cockpit.position.set(0, 0.4, 0.2);
    playerShip.add(cockpit);

    const wingGeo = new THREE.BoxGeometry(4.5, 0.1, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({
      map: starfighterMosaic,
      color: 0xaaccff,
      metalness: 0.9,
      roughness: 0.3,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0);
    playerShip.add(wings);

    // Glowing engine thruster lights
    const thrusterLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    thrusterLeft.rotation.x = Math.PI / 2;
    thrusterLeft.position.set(-0.8, 0, 2.5);
    playerShip.add(thrusterLeft);

    const thrusterRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    thrusterRight.rotation.x = Math.PI / 2;
    thrusterRight.position.set(0.8, 0, 2.5);
    playerShip.add(thrusterRight);

    // Celestial Roman Cyber Mosaic Monoliths & Relic Gateways in Deep Space
    const spaceMuralMosaic1 = createLevel4MosaicTexture('ROMAN_CYBER_MOSAIC', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#00f0ff',
      groutIntensity: 40,
    });
    const spaceMuralMosaic2 = createLevel4MosaicTexture('CYBER_PILOT', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ffaa00',
      groutIntensity: 40,
    });
    const spaceMuralMosaic3 = createLevel4MosaicTexture('GAUSS_RAILGUN', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00ffff',
      groutIntensity: 35,
    });

    const spaceMuralMat1 = new THREE.MeshStandardMaterial({
      map: spaceMuralMosaic1,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const spaceMuralMat2 = new THREE.MeshStandardMaterial({
      map: spaceMuralMosaic2,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const spaceMuralMat3 = new THREE.MeshStandardMaterial({
      map: spaceMuralMosaic3,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    // Spawn 8 Deep Space Roman Cyber Monoliths with Tesserae Artwork
    for (let i = 0; i < 8; i++) {
      const monolithGroup = new THREE.Group();
      const monolithPillar = new THREE.Mesh(
        new THREE.BoxGeometry(16, 60, 16),
        new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.2 })
      );
      monolithGroup.add(monolithPillar);

      const muralMat = i % 3 === 0 ? spaceMuralMat1 : i % 3 === 1 ? spaceMuralMat2 : spaceMuralMat3;
      const muralPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 38), muralMat);
      muralPlane.position.set(0, 0, 8.1);
      monolithGroup.add(muralPlane);

      const angle = (i / 8) * Math.PI * 2;
      const dist = 400 + (i % 2) * 200;
      monolithGroup.position.set(Math.cos(angle) * dist, (i % 3 - 1) * 80, Math.sin(angle) * dist);
      monolithGroup.rotation.y = angle + Math.PI / 2;
      scene.add(monolithGroup);
    }

    // Dynamic 3D Mountable Hardpoints on Player Ship
    const warpDriveLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088cc, metalness: 0.9 })
    );
    warpDriveLeft.rotation.x = Math.PI / 2;
    warpDriveLeft.position.set(-2.2, 0.1, 0.4);
    playerShip.add(warpDriveLeft);

    const warpDriveRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088cc, metalness: 0.9 })
    );
    warpDriveRight.rotation.x = Math.PI / 2;
    warpDriveRight.position.set(2.2, 0.1, 0.4);
    playerShip.add(warpDriveRight);

    const gaussCannonLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 })
    );
    gaussCannonLeft.position.set(-1.8, -0.1, -0.6);
    playerShip.add(gaussCannonLeft);

    const gaussCannonRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 })
    );
    gaussCannonRight.position.set(1.8, -0.1, -0.6);
    playerShip.add(gaussCannonRight);

    const astrolabeDish = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.04, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x664400, metalness: 0.85 })
    );
    astrolabeDish.rotation.x = Math.PI / 3;
    astrolabeDish.position.set(0, 0.9, -0.4);
    playerShip.add(astrolabeDish);

    const aegisShieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.2, wireframe: true })
    );
    playerShip.add(aegisShieldMesh);

    scene.add(playerShip);

    // Cockpit HUD Mesh
    const cockpitHudMesh = new THREE.Group();
    const frameMesh = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.04, 6, 24, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
    );
    frameMesh.position.set(0, -0.5, -2);
    cockpitHudMesh.add(frameMesh);
    scene.add(cockpitHudMesh);

    // Asteroids
    const asteroids: Array<{ mesh: THREE.Mesh; rotationSpeed: THREE.Vector3 }> = [];
    const astGeo = new THREE.DodecahedronGeometry(1, 0);
    const astMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9 });

    for (let i = 0; i < 25; i++) {
      const ast = new THREE.Mesh(astGeo, astMat);
      const scale = 8 + Math.random() * 20;
      ast.scale.set(scale, scale, scale);
      ast.position.set(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 1000 + 200
      );
      scene.add(ast);
      asteroids.push({
        mesh: ast,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008
        ),
      });
    }

    gameRef.current = {
      scene,
      camera,
      renderer,
      playerShip,
      cockpitHudMesh,
      sharedGeos,
      sharedMats,
      lasers: [],
      missiles: [],
      enemies: [],
      asteroids,
      particles: [],
      starfield,
      shipPos: new THREE.Vector3(0, 0, 0),
      shipRot: new THREE.Euler(0, 0, 0, 'YXZ'),
      keys: {},
      touchStick: { x: 0, y: 0 },
      isShooting: false,
      isBoosting: false,
      lastShotTime: 0,
      animFrameId: 0,
      viewMode: 'COCKPIT',
      invertPitch: false,
      isPlaying: false,
      liveHull: 100,
      liveShield: 100,
      liveScore: 0,
      liveMissiles: 8,
      liveEnemiesCount: 0,
      liveLockText: null,
    };

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 550;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(containerRef.current);

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameRef.current) {
        gameRef.current.keys[e.code] = true;
        if (e.code === 'KeyV') {
          const next = gameRef.current.viewMode === 'COCKPIT' ? 'THIRD_PERSON' : 'COCKPIT';
          gameRef.current.viewMode = next;
          setViewMode(next);
          sounds.playClick(750);
        }
        if (e.code === 'KeyM') {
          setModulesOverlayOpen((prev) => !prev);
          sounds.playClick(700);
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          gameRef.current.isBoosting = true;
          setBoostActive(true);
        }
        if (e.code === 'Space') {
          gameRef.current.isShooting = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (gameRef.current) {
        gameRef.current.keys[e.code] = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          gameRef.current.isBoosting = false;
          setBoostActive(false);
        }
        if (e.code === 'Space') {
          gameRef.current.isShooting = false;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Animation Render Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      gameRef.current.animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const g = gameRef.current;
      if (!g || !g.playerShip) return;

      // Starfield & Asteroids
      g.starfield.rotation.y += 0.00015;
      g.asteroids.forEach((ast) => {
        ast.mesh.rotation.x += ast.rotationSpeed.x;
        ast.mesh.rotation.y += ast.rotationSpeed.y;
      });

      if (g.isPlaying) {
        // NON-INVERTED FLIGHT CONTROLS BY DEFAULT:
        // W / Up = Pitch UP
        // S / Down = Pitch DOWN
        // A / Left = Turn LEFT / Roll Left
        // D / Right = Turn RIGHT / Roll Right
        let pitch = 0;
        let yaw = 0;
        let roll = 0;
        const forwardThrottle = g.isBoosting ? 85 : 32;

        const pitchMultiplier = g.invertPitch ? -1 : 1;

        if (g.keys['KeyW'] || g.keys['ArrowUp']) pitch += 1.4 * pitchMultiplier;
        if (g.keys['KeyS'] || g.keys['ArrowDown']) pitch -= 1.4 * pitchMultiplier;
        if (g.keys['KeyA'] || g.keys['ArrowLeft']) {
          yaw += 1.4;
          roll += 1.8;
        }
        if (g.keys['KeyD'] || g.keys['ArrowRight']) {
          yaw -= 1.4;
          roll -= 1.8;
        }
        if (g.keys['KeyQ']) roll += 2.0;
        if (g.keys['KeyE']) roll -= 2.0;

        // Mobile touch analog (dy < 0 is UP, dy > 0 is DOWN)
        if (Math.abs(g.touchStick.x) > 0.05 || Math.abs(g.touchStick.y) > 0.05) {
          yaw -= g.touchStick.x * 1.5;
          roll -= g.touchStick.x * 2.2;
          // Pushing stick UP (negative dy) pitches nose UP
          pitch += (-g.touchStick.y) * 1.5 * pitchMultiplier;
        }

        g.shipRot.x += pitch * delta;
        g.shipRot.y += yaw * delta;
        g.shipRot.z = THREE.MathUtils.lerp(g.shipRot.z, roll * 0.4, delta * 4);

        g.playerShip.rotation.copy(g.shipRot);

        const forwardVector = new THREE.Vector3(0, 0, -1).applyEuler(g.shipRot);
        g.shipPos.addScaledVector(forwardVector, forwardThrottle * delta);
        g.playerShip.position.copy(g.shipPos);

        // Regenerate shield
        g.liveShield = Math.min(100, g.liveShield + delta * 3.5);

        // Camera Placement
        if (g.viewMode === 'COCKPIT') {
          g.playerShip.visible = false;
          g.cockpitHudMesh.visible = true;
          g.camera.position.copy(g.shipPos);
          g.camera.rotation.copy(g.shipRot);
          g.cockpitHudMesh.position.copy(g.shipPos);
          g.cockpitHudMesh.rotation.copy(g.shipRot);
        } else {
          g.playerShip.visible = true;
          g.cockpitHudMesh.visible = false;
          const chaseOffset = new THREE.Vector3(0, 2.5, 8).applyEuler(g.shipRot);
          g.camera.position.copy(g.shipPos).add(chaseOffset);
          g.camera.lookAt(g.shipPos.clone().add(forwardVector.clone().multiplyScalar(30)));
        }

        // Fire Laser
        if (g.isShooting && time - g.lastShotTime > 130) {
          g.lastShotTime = time;
          spawnPooledLaser(true, forwardVector);
          sounds.playLaserPew();
        }

        // Update Lasers
        for (let i = g.lasers.length - 1; i >= 0; i--) {
          const l = g.lasers[i];
          l.mesh.position.addScaledVector(l.velocity, delta);
          l.life -= delta;

          if (l.isPlayer) {
            for (let j = g.enemies.length - 1; j >= 0; j--) {
              const e = g.enemies[j];
              if (l.mesh.position.distanceTo(e.mesh.position) < 4.5) {
                e.health -= 35;
                spawnSparks(l.mesh.position, 'CYAN', 4);
                sounds.playDamageBlip();
                l.life = 0;

                if (e.health <= 0) {
                  spawnSparks(e.mesh.position, 'ORANGE', 14);
                  g.scene.remove(e.mesh);
                  g.enemies.splice(j, 1);
                  g.liveScore += 150;
                  g.liveEnemiesCount = g.enemies.length;
                  sounds.playPowerUpChime();

                  if (g.enemies.length === 0) {
                    setGameState('VICTORY');
                    g.isPlaying = false;
                  }
                }
                break;
              }
            }
          } else {
            if (l.life > 0 && l.mesh.position.distanceTo(g.shipPos) < 2.5) {
              l.life = 0;
              spawnSparks(g.shipPos, 'RED', 6);
              sounds.playDamageBlip();

              if (g.liveShield > 0) {
                g.liveShield = Math.max(0, g.liveShield - 18);
              } else {
                g.liveHull = Math.max(0, g.liveHull - 15);
                if (g.liveHull <= 0) {
                  setGameState('GAMEOVER');
                  g.isPlaying = false;
                  sounds.playExplosionBoom();
                }
              }
            }
          }

          if (l.life <= 0) {
            g.scene.remove(l.mesh);
            g.lasers.splice(i, 1);
          }
        }

        // Update Missiles
        for (let i = g.missiles.length - 1; i >= 0; i--) {
          const m = g.missiles[i];
          m.life -= delta;

          if (m.target && m.target.parent) {
            const dir = m.target.position.clone().sub(m.mesh.position).normalize();
            m.velocity.lerp(dir.multiplyScalar(90), delta * 4);
            m.mesh.lookAt(m.mesh.position.clone().add(m.velocity));
          }
          m.mesh.position.addScaledVector(m.velocity, delta);

          for (let j = g.enemies.length - 1; j >= 0; j--) {
            const e = g.enemies[j];
            if (m.mesh.position.distanceTo(e.mesh.position) < 5.5) {
              e.health -= 150;
              spawnSparks(e.mesh.position, 'ORANGE', 18);
              sounds.playExplosionBoom();
              m.life = 0;

              if (e.health <= 0) {
                g.scene.remove(e.mesh);
                g.enemies.splice(j, 1);
                g.liveScore += 250;
                g.liveEnemiesCount = g.enemies.length;

                if (g.enemies.length === 0) {
                  setGameState('VICTORY');
                  g.isPlaying = false;
                }
              }
              break;
            }
          }

          if (m.life <= 0) {
            g.scene.remove(m.mesh);
            g.missiles.splice(i, 1);
          }
        }

        // Update Enemies
        let closestEnemy: THREE.Group | null = null;
        let closestDist = 9999;

        g.enemies.forEach((e) => {
          const distToPlayer = e.mesh.position.distanceTo(g.shipPos);
          if (distToPlayer < closestDist) {
            closestDist = distToPlayer;
            closestEnemy = e.mesh;
          }

          const toPlayer = g.shipPos.clone().sub(e.mesh.position).normalize();
          e.mesh.lookAt(g.shipPos);

          if (distToPlayer > 40) {
            e.mesh.position.addScaledVector(toPlayer, e.speed * delta);
          } else {
            const strafe = new THREE.Vector3(
              Math.sin(time * 0.002 + e.turnSeed),
              Math.cos(time * 0.002 + e.turnSeed),
              0
            );
            e.mesh.position.addScaledVector(strafe, e.speed * 0.5 * delta);
          }

          e.shootTimer -= delta;
          if (e.shootTimer <= 0 && distToPlayer < 220) {
            e.shootTimer = 1.6 + Math.random() * 1.8;
            spawnPooledEnemyLaser(e.mesh.position, toPlayer);
          }
        });

        if (closestEnemy && closestDist < 300) {
          g.liveLockText = `LOCK: [HOSTILE-TGT] ${(closestDist).toFixed(0)}m`;
        } else {
          g.liveLockText = null;
        }

        // Update Particles
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.mesh.position.addScaledVector(p.velocity, delta);
          p.life -= delta;
          const scale = Math.max(0.01, (p.life / p.maxLife) * 1.2);
          p.mesh.scale.set(scale, scale, scale);
          if (p.life <= 0) {
            g.scene.remove(p.mesh);
            g.particles.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    gameRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(gameRef.current.animFrameId);
      renderer.dispose();
    };
  }, []);

  const spawnPooledLaser = (isPlayer: boolean, dir: THREE.Vector3) => {
    const g = gameRef.current;
    if (!g || g.lasers.length >= 35) return;

    const mesh = new THREE.Mesh(g.sharedGeos.laserGeo, g.sharedMats.pLaserMat);
    mesh.position.copy(g.shipPos).add(dir.clone().multiplyScalar(2.0));
    mesh.lookAt(g.shipPos.clone().add(dir.clone().multiplyScalar(50)));
    g.scene.add(mesh);

    g.lasers.push({
      mesh,
      velocity: dir.clone().multiplyScalar(220),
      life: 2.2,
      isPlayer,
    });
  };

  const spawnPooledEnemyLaser = (origin: THREE.Vector3, dir: THREE.Vector3) => {
    const g = gameRef.current;
    if (!g || g.lasers.length >= 35) return;

    const mesh = new THREE.Mesh(g.sharedGeos.laserGeo, g.sharedMats.eLaserMat);
    mesh.position.copy(origin);
    mesh.lookAt(origin.clone().add(dir.clone().multiplyScalar(50)));
    g.scene.add(mesh);

    g.lasers.push({
      mesh,
      velocity: dir.clone().multiplyScalar(80),
      life: 3.5,
      isPlayer: false,
    });
  };

  const spawnSparks = (pos: THREE.Vector3, color: 'CYAN' | 'ORANGE' | 'RED', count: number) => {
    const g = gameRef.current;
    if (!g || g.particles.length >= 50) return;

    const mat =
      color === 'CYAN'
        ? g.sharedMats.pMatCyan
        : color === 'ORANGE'
        ? g.sharedMats.pMatOrange
        : g.sharedMats.pMatRed;

    const c = Math.min(count, 8);
    for (let i = 0; i < c; i++) {
      const p = new THREE.Mesh(g.sharedGeos.particleGeo, mat);
      p.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      g.scene.add(p);
      g.particles.push({ mesh: p, velocity: vel, life: 0.4, maxLife: 0.4 });
    }
  };

  const handleLaunchMissile = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = gameRef.current;
    if (!g || g.liveMissiles <= 0 || g.missiles.length >= 8) return;

    let target: THREE.Group | null = null;
    let closestDist = 9999;
    g.enemies.forEach((en) => {
      const d = en.mesh.position.distanceTo(g.shipPos);
      if (d < closestDist) {
        closestDist = d;
        target = en.mesh;
      }
    });

    const mMesh = new THREE.Mesh(g.sharedGeos.missileGeo, g.sharedMats.missileMat);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(g.shipRot);
    mMesh.position.copy(g.shipPos).add(forward.clone().multiplyScalar(3));
    mMesh.rotation.copy(g.shipRot);
    g.scene.add(mMesh);

    g.missiles.push({
      mesh: mMesh,
      target,
      velocity: forward.clone().multiplyScalar(75),
      life: 5.0,
    });

    g.liveMissiles -= 1;
    sounds.playSimulatePulse();
  };

  const startFlightGame = (waveNum: number = 1) => {
    const g = gameRef.current;
    if (!g) return;

    g.shipPos.set(0, 0, 0);
    g.shipRot.set(0, 0, 0);

    g.lasers.forEach((l) => g.scene.remove(l.mesh));
    g.missiles.forEach((m) => g.scene.remove(m.mesh));
    g.enemies.forEach((e) => g.scene.remove(e.mesh));
    g.particles.forEach((p) => g.scene.remove(p.mesh));

    g.lasers = [];
    g.missiles = [];
    g.enemies = [];
    g.particles = [];

    g.liveHull = 100;
    g.liveShield = 100;
    g.liveMissiles = 8;
    g.liveScore = score;
    g.liveLockText = null;

    setWave(waveNum);
    setGameState('PLAYING');
    g.isPlaying = true;

    const numEnemies = 4 + waveNum * 2;
    g.liveEnemiesCount = numEnemies;

    for (let i = 0; i < numEnemies; i++) {
      const eGroup = new THREE.Group();
      const isCruiser = i === 0 && waveNum >= 2;

      // Pure Level 4 Roman Mosaic Space Enemy Rig (No box/octahedron underlay)
      const mosaicMat = isCruiser ? g.sharedMats.cruiserMosaicMat : g.sharedMats.droneMosaicMat;
      const size = isCruiser ? 16 : 6.0;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mosaicMat);
      eGroup.add(mesh);

      // Glowing Reactor Core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(isCruiser ? 1.2 : 0.4, 12, 12),
        new THREE.MeshBasicMaterial({ color: isCruiser ? 0xff0055 : 0x00ffff })
      );
      core.position.set(0, 0, 0.2);
      eGroup.add(core);

      const angle = (i / numEnemies) * Math.PI * 2;
      const r = 120 + Math.random() * 80;
      eGroup.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 60,
        Math.sin(angle) * r - 150
      );

      g.scene.add(eGroup);
      g.enemies.push({
        mesh: eGroup,
        health: isCruiser ? 300 : 70,
        maxHealth: isCruiser ? 300 : 70,
        speed: isCruiser ? 10 : 18 + Math.random() * 8,
        shootTimer: 1.5 + Math.random() * 2,
        type: isCruiser ? 'CRUISER' : 'DRONE',
        turnSeed: Math.random() * 10,
      });
    }

    sounds.playSpectrumLoad();
  };

  return (
    <div
      className={`relative w-full bg-[#020308] border border-white/10 overflow-hidden select-none font-mono transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[640px] sm:h-[750px] md:h-[820px] rounded-xl shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* TOP FLIGHT HUD OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between text-xs pointer-events-none z-20">
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Back to Menu Button */}
          {onExitToMenu && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                sounds.playClick(500);
                onExitToMenu();
              }}
              className="px-2.5 py-1.5 bg-red-600/90 hover:bg-red-500 border border-red-400/50 text-white rounded font-bold text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
              title="Return to Main Console"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MAIN MENU</span>
              <span className="sm:hidden">MENU</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-500/50 rounded">
            <Rocket className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="font-bold text-white tracking-widest text-[11px] sm:text-xs">VOID HORIZON 3D</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-neutral-300 text-[11px]">
            <span>WAVE: <b className="text-white">{wave}</b></span>
            <span>HOSTILES: <b className="text-red-400">{enemiesRemaining}</b></span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* 64x64 Retro Pixel Arcade Switcher */}
          {onSwitchToPixelArcade && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                sounds.playClick(900);
                onSwitchToPixelArcade();
              }}
              className="px-2 py-1 rounded border border-amber-500/50 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[10px] font-bold tracking-wider flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"
              title="Switch to 64x64 Retro Pixel Arcade Version"
            >
              <Gamepad2 className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">64x64 PIXEL MODE</span>
              <span className="sm:hidden">64x64</span>
            </button>
          )}

          {/* Mosaic Matrix Overlay Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const next = !mosaicOverlayActive;
              setMosaicOverlayActive(next);
              sounds.playClick(next ? 800 : 500);
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider flex items-center gap-1 transition-all ${
              mosaicOverlayActive
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-white/5 border-white/20 text-neutral-400 hover:text-white'
            }`}
            title="Toggle Roman Mosaic Hologram Matrix Overlay (M)"
          >
            <Grid className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">{mosaicOverlayActive ? 'MOSAIC SCAN: ON' : 'MOSAIC: OFF'}</span>
            <span className="sm:hidden">MOSAIC</span>
          </button>

          {/* Mosaic Hologram Inspector Modal Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowMosaicInspector(true);
              sounds.playSpectrumLoad();
            }}
            className="px-2 py-1 rounded border border-purple-500/50 bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-[10px] font-bold tracking-wider flex items-center gap-1 transition-all"
            title="Open Starfighter Roman Mosaic Diagnostics"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span className="hidden md:inline">DIAGNOSTICS</span>
          </button>

          {/* Invert Pitch Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const next = !invertPitch;
              setInvertPitch(next);
              if (gameRef.current) gameRef.current.invertPitch = next;
              sounds.playClick(600);
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider flex items-center gap-1 transition-all ${
              invertPitch ? 'bg-amber-600/80 border-amber-400 text-white' : 'bg-white/5 border-white/20 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Normal vs Inverted Flight Pitch"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">{invertPitch ? 'PITCH: INVERTED' : 'PITCH: NORMAL'}</span>
            <span className="sm:hidden">{invertPitch ? 'INV' : 'NORM'}</span>
          </button>

          {/* Tactical 2D/3D Modules Asset Deck Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setModulesOverlayOpen(true);
              sounds.playClick(750);
            }}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 rounded font-bold text-[10px] sm:text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95 transition-all"
            title="Open 2D/3D Tactical Modules Deck (M)"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">MODULES [M]</span>
            <span className="sm:hidden">MODS</span>
            <span className="px-1 py-0.2 rounded bg-cyan-400/20 text-[9px] text-cyan-200">
              {activeModules.length}
            </span>
          </button>

          {/* View Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const next = viewMode === 'COCKPIT' ? 'THIRD_PERSON' : 'COCKPIT';
              setViewMode(next);
              if (gameRef.current) gameRef.current.viewMode = next;
              sounds.playClick(700);
            }}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[10px] font-bold text-white flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{viewMode === 'COCKPIT' ? 'COCKPIT' : 'CHASE'}</span>
          </button>

          {/* Fullscreen Expand Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsExpanded(!isExpanded);
              sounds.playClick(850);
            }}
            className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-neutral-300 hover:text-white"
            title={isExpanded ? 'Minimize Screen' : 'Maximize Game Screen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          <div className="text-amber-400 font-bold ml-1 text-xs">
            <span className="text-white text-sm">{score}</span> <span className="text-[10px]">PTS</span>
          </div>
        </div>
      </div>

      {/* ROMAN MOSAIC MATRIX BUILDING OVERLAY */}
      {mosaicOverlayActive && gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {/* Subtle Grid Tessellation Lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(0, 240, 255, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: mosaicFidelityTier === '300' ? '36px 36px' : mosaicFidelityTier === '200' ? '18px 18px' : '8px 8px',
            }}
          />

          {/* Top-Right Mosaic Telemetry Box */}
          <div className="absolute top-16 right-4 sm:right-6 pointer-events-auto bg-black/80 border border-cyan-500/40 p-2.5 rounded-lg backdrop-blur-md text-[10px] text-cyan-300 font-mono space-y-1 shadow-lg max-w-[210px]">
            <div className="flex items-center justify-between font-bold border-b border-cyan-500/30 pb-1">
              <span className="flex items-center gap-1">
                <Grid className="w-3 h-3 text-cyan-400" />
                MOSAIC MATRIX SCAN
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
                {mosaicFidelityTier}
              </span>
            </div>
            <div className="text-neutral-400 text-[9px]">
              Tesserae Grid: <b className="text-white">{mosaicFidelityTier === '300' ? '36px Macro' : mosaicFidelityTier === '200' ? '18px Meso' : '8px Micro'}</b>
            </div>
            <div className="text-neutral-400 text-[9px]">
              Active Tiles: <b className="text-emerald-400">4,820</b> • Grout: <b className="text-white">Nominal</b>
            </div>

            {/* Quick Tier Select */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {(['300', '200', '150', 'ULTRA'] as const).map((tier) => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => {
                    setMosaicFidelityTier(tier);
                    sounds.playClick(600);
                  }}
                  className={`px-1 py-0.5 rounded text-[8px] font-bold border transition-all ${
                    mosaicFidelityTier === tier
                      ? 'bg-cyan-500 text-black border-cyan-300'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Target Hostile Tessera Decomposition Box */}
          {targetLock && (
            <div className="absolute top-44 left-4 sm:left-6 bg-red-950/85 border border-red-500/60 p-2 rounded-lg backdrop-blur-md text-[10px] font-mono text-red-300 space-y-1 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)] max-w-[200px]">
              <div className="font-bold flex items-center gap-1 text-white border-b border-red-500/30 pb-0.5 text-[9px]">
                <Activity className="w-3 h-3 text-red-400" />
                <span>TARGET TESSELLATION SCAN</span>
              </div>
              <div className="text-[9px] text-neutral-300">
                Hostile Hull: <b className="text-red-200">{targetLock}</b>
              </div>
              <div className="text-[9px] text-neutral-300">
                Tesserae Density: <b className="text-amber-400">1,480 Stone Blocks</b>
              </div>
              <div className="text-[9px] text-neutral-300">
                SSIM Match: <b className="text-emerald-400">98.2%</b>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLIGHT RETICLE & RADAR LOCK */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 border border-cyan-400/50 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f0ff]" />
            <div className="absolute -top-1.5 w-3 h-0.5 bg-cyan-400" />
            <div className="absolute -bottom-1.5 w-3 h-0.5 bg-cyan-400" />
            <div className="absolute -left-1.5 w-0.5 h-3 bg-cyan-400" />
            <div className="absolute -right-1.5 w-0.5 h-3 bg-cyan-400" />
          </div>
          {targetLock && (
            <div className="mt-2 px-3 py-1 bg-red-950/90 border border-red-500 text-xs text-red-300 font-bold tracking-wider rounded shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse">
              {targetLock}
            </div>
          )}

          {/* Left-side Flight Instrument */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-1.5 text-[10px] text-cyan-300/80 bg-black/70 p-2.5 rounded-lg border border-white/10 backdrop-blur-md">
            <div>THRUST: <b className="text-white">{boostActive ? '100% (AFTERBURNER)' : '45% (CRUISE)'}</b></div>
            <div>SPEED: <b className="text-cyan-400">{boostActive ? '850 M/S' : '320 M/S'}</b></div>
            <div>SECTOR: <b className="text-amber-400">ORBITAL VOID-7</b></div>
          </div>
        </div>
      )}

      {/* TOP-LEFT COMPACT VITALS (Docked cleanly under header, never blocking thumb controls) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-14 left-4 sm:left-6 z-20 pointer-events-none">
          <div className="flex flex-col gap-1.5 w-44 sm:w-48 bg-black/75 p-2.5 rounded-lg border border-white/15 backdrop-blur-md shadow-lg">
            <div>
              <div className="flex justify-between text-[10px] text-cyan-300 font-bold mb-0.5">
                <span>SHIELD ENERGY</span>
                <span>{shieldEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
                  style={{ width: `${shieldEnergy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-red-400 font-bold mb-0.5">
                <span>HULL INTEGRITY</span>
                <span>{hullHealth}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${hullHealth}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-amber-400 pt-1 border-t border-white/10">
              <span>TORPEDOES:</span>
              <span className="font-bold text-white text-xs">{missileCount} / 8</span>
            </div>
          </div>
        </div>
      )}

      {/* DUAL-HAND ERGONOMIC SPACED CONTROLS */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* LEFT THUMB ZONE: Spacious Virtual Flight Stick */}
          <div className="absolute bottom-5 sm:bottom-8 left-5 sm:left-8 pointer-events-auto flex flex-col items-center">
            <div
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const touch = e.touches[0];
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const r = rect.width / 2;
                const dx = Math.max(-r, Math.min(r, touch.clientX - cx)) / r;
                const dy = Math.max(-r, Math.min(r, touch.clientY - cy)) / r;
                if (gameRef.current) gameRef.current.touchStick = { x: dx, y: dy };
              }}
              onTouchEnd={() => {
                if (gameRef.current) gameRef.current.touchStick = { x: 0, y: 0 };
              }}
              className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border-2 border-cyan-400/40 bg-black/60 backdrop-blur-md flex items-center justify-center touch-none relative shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              {/* Inner Analog Nub */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white shadow-[0_0_15px_#00f0ff]" />
              <div className="absolute bottom-2 text-[8px] text-cyan-200 font-bold tracking-widest uppercase">STEER / PITCH</div>
            </div>
          </div>

          {/* RIGHT THUMB ZONE: Spaced Combat Triggers */}
          <div className="absolute bottom-5 sm:bottom-8 right-5 sm:right-8 pointer-events-auto">
            {/* Afterburner Boost Button (Upper right) */}
            <div className="absolute -top-20 sm:-top-24 right-1">
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (gameRef.current) gameRef.current.isBoosting = true;
                  setBoostActive(true);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  if (gameRef.current) gameRef.current.isBoosting = false;
                  setBoostActive(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (gameRef.current) gameRef.current.isBoosting = true;
                  setBoostActive(true);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  if (gameRef.current) gameRef.current.isBoosting = false;
                  setBoostActive(false);
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center font-bold active:scale-95 transition-all shadow-lg ${
                  boostActive
                    ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_#f59e0b]'
                    : 'bg-black/70 border-amber-400/60 text-amber-300 hover:text-white backdrop-blur-md'
                }`}
                title="Hold for Afterburner Boost (Shift)"
              >
                <Flame className="w-5 h-5" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">BOOST</span>
              </button>
            </div>

            {/* Launch Torpedo Button (To the left of Fire) */}
            <div className="absolute top-4 -left-20 sm:-left-24">
              <button
                type="button"
                onClick={handleLaunchMissile}
                disabled={missileCount <= 0}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-600 to-red-700 border-2 border-amber-400 text-white flex flex-col items-center justify-center font-bold active:scale-90 shadow-[0_0_15px_rgba(245,158,11,0.5)] disabled:opacity-30 backdrop-blur-md"
                title="Launch Target Lock Torpedo"
              >
                <Zap className="w-5 h-5 text-amber-200" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">TORP</span>
              </button>
            </div>

            {/* Primary Laser Cannon Fire Button */}
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                if (gameRef.current) gameRef.current.isShooting = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (gameRef.current) gameRef.current.isShooting = false;
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (gameRef.current) gameRef.current.isShooting = true;
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (gameRef.current) gameRef.current.isShooting = false;
              }}
              className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-red-600 via-red-500 to-cyan-500 border-3 border-white text-white flex flex-col items-center justify-center font-black active:scale-95 shadow-[0_0_25px_rgba(239,68,68,0.9)]"
            >
              <Crosshair className="w-9 h-9 sm:w-10 sm:h-10" />
              <span className="text-[11px] tracking-widest font-black">FIRE</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY MENUS */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          {gameState === 'MENU' && (
            <div className="max-w-lg space-y-4">
              <div className="relative w-full h-36 sm:h-44 rounded-lg overflow-hidden border border-cyan-500/40 bg-black/60 shadow-xl">
                <img
                  src="/images/space_starfighter_hero_1787089887255.jpg"
                  alt="Aurora Starfighter"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-cyan-300 border border-cyan-400/40">
                  VESSEL: AURORA MK-IV INTERDICTOR
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
                VOID HORIZON: 3D SPACE SIM
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Pilot the Aurora Mk-IV cyber-starfighter through asteroid fields, engage hostile drone swarms, and eliminate capital dreadnoughts.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {onExitToMenu && (
                  <button
                    type="button"
                    onClick={onExitToMenu}
                    className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>BACK TO MAIN MENU</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startFlightGame(1)}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all"
                >
                  LAUNCH STARFIGHTER
                </button>
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="max-w-md space-y-4">
              <div className="text-red-500 text-3xl font-black tracking-widest">HULL BREACHED</div>
              <p className="text-xs text-neutral-300">Your starship was destroyed in combat.</p>
              <div className="text-base font-bold text-white">FINAL SCORE: <span className="text-amber-400">{score}</span></div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {onExitToMenu && (
                  <button
                    type="button"
                    onClick={onExitToMenu}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-white/20"
                  >
                    MAIN MENU
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startFlightGame(wave)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                >
                  RE-ENGAGE SECTOR
                </button>
              </div>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <div className="max-w-md space-y-4">
              <div className="text-emerald-400 text-3xl font-black tracking-widest">SECTOR CLEARED</div>
              <p className="text-xs text-neutral-300">All hostile drone swarms eliminated.</p>
              <div className="text-base font-bold text-white">SCORE: <span className="text-emerald-300">{score}</span></div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {onExitToMenu && (
                  <button
                    type="button"
                    onClick={onExitToMenu}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-white/20"
                  >
                    MAIN MENU
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startFlightGame(wave + 1)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                >
                  WARP TO WAVE {wave + 1}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STARFIGHTER ROMAN MOSAIC DIAGNOSTICS MODAL */}
      {showMosaicInspector && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050711] border border-cyan-500/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 space-y-4 text-white shadow-2xl font-mono relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    STARFIGHTER ROMAN MOSAIC DIAGNOSTICS
                  </h3>
                  <div className="text-[10px] text-neutral-400">
                    Vanguard Interceptor 300→200→150 Tessellation Engine Decomposition
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMosaicInspector(false);
                  sounds.playClick(500);
                }}
                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vessel Grid & Blueprint View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 bg-black/60 aspect-video">
                <img
                  src="/images/space_starfighter_hero_1787089887255.jpg"
                  alt="Vanguard Starfighter Interceptor"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none" />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded border border-cyan-400/40 text-[9px] text-cyan-300 font-bold">
                  PLAYABLE STARFIGHTER
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] bg-black/80 p-1 rounded border border-white/15 text-neutral-300">
                  <span>TIER: 150 MICRO</span>
                  <span className="text-cyan-300 font-bold">2,840 TESSERAE</span>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-red-500/30 bg-black/60 aspect-video">
                <img
                  src="/images/enemy_cruiser_boss_1787090414452.jpg"
                  alt="Capital Battlecruiser"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded border border-red-400/40 text-[9px] text-red-300 font-bold">
                  BOSS DREADNOUGHT
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] bg-black/80 p-1 rounded border border-white/15 text-neutral-300">
                  <span>TIER: 300 MACRO</span>
                  <span className="text-red-300 font-bold">6,400 TESSERAE</span>
                </div>
              </div>
            </div>

            {/* Resolution Tier Breakdown */}
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-300 font-bold">
                <span>ACTIVE MOSAIC RESOLUTION HIERARCHY</span>
                <span className="text-cyan-400">TIER {mosaicFidelityTier}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded bg-black/50 border border-cyan-500/20">
                  <div className="text-cyan-300 font-bold">300 SCALE</div>
                  <div className="text-neutral-400">Macro Stone Plates (36px)</div>
                  <div className="text-emerald-400 mt-1">Hull Armor Shell</div>
                </div>
                <div className="p-2 rounded bg-black/50 border border-blue-500/20">
                  <div className="text-blue-300 font-bold">200 SCALE</div>
                  <div className="text-neutral-400">Meso Interpolation (18px)</div>
                  <div className="text-emerald-400 mt-1">Wing Leading Edge</div>
                </div>
                <div className="p-2 rounded bg-black/50 border border-purple-500/20">
                  <div className="text-purple-300 font-bold">150 SCALE</div>
                  <div className="text-neutral-400">Quantum Transistors (8px)</div>
                  <div className="text-emerald-400 mt-1">Plasma Thruster Jets</div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowMosaicInspector(false);
                  sounds.playClick(600);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded transition-all shadow-[0_0_12px_rgba(0,240,255,0.5)]"
              >
                RETURN TO COCKPIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2D First, then 3D Tactical In-Game Modules & Asset Deck Overlay */}
      <InGameModulesAssetOverlay
        isOpen={modulesOverlayOpen}
        onClose={() => setModulesOverlayOpen(false)}
        gameMode="SPACE_SIM"
        activeModules={activeModules}
        onToggleModuleEquip={toggleModuleEquip}
      />
    </div>
  );
};
