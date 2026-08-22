import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Shield,
  Crosshair,
  Zap,
  RefreshCw,
  Sliders,
  Heart,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Database,
  Box,
  Layers,
  Sparkles,
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
  subscribeToCustomAssetChanges,
} from '../../utils/customCharacterStore';

interface CyberFpsShooterProps {
  powerOn: boolean;
  fluxFrequency: number;
  onExitToMenu?: () => void;
}

export const CyberFpsShooter3D: React.FC<CyberFpsShooterProps> = ({
  powerOn,
  onExitToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(30);
  const [reserveAmmo, setReserveAmmo] = useState<number>(120);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [overdriveEnergy, setOverdriveEnergy] = useState<number>(100);
  const [overdriveActive, setOverdriveActive] = useState<boolean>(false);
  const [invertLook, setInvertLook] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [wave, setWave] = useState<number>(1);
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(8);
  const [modulesOverlayOpen, setModulesOverlayOpen] = useState<boolean>(false);
  const [activeModules, setActiveModules] = useState<GameModuleAsset[]>(() =>
    getModulesForGame('FPS').filter((m) => m.isEquipped)
  );

  const toggleModuleEquip = (moduleId: string) => {
    setActiveModules((prev) => {
      const isEq = prev.some((m) => m.id === moduleId);
      if (isEq) {
        return prev.filter((m) => m.id !== moduleId);
      } else {
        const all = getModulesForGame('FPS');
        const found = all.find((m) => m.id === moduleId);
        return found ? [...prev, found] : prev;
      }
    });
  };

  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    weaponGroup: THREE.Group;
    muzzleFlash: THREE.PointLight;
    sharedGeos: Record<string, THREE.BufferGeometry>;
    sharedMats: Record<string, THREE.Material>;
    bullets: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; isPlayer: boolean; damage: number }>;
    enemies: Array<{
      mesh: THREE.Group;
      health: number;
      maxHealth: number;
      speed: number;
      shootTimer: number;
      type: 'CYBER_DRONE' | 'HEAVY_DROID';
      heightOffset: number;
    }>;
    particles: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }>;
    playerPos: THREE.Vector3;
    cameraPitch: number;
    cameraYaw: number;
    keys: Record<string, boolean>;
    touchMove: { x: number; y: number };
    lastLookTouch: { x: number; y: number } | null;
    isShooting: boolean;
    lastShotTime: number;
    animFrameId: number;
    isPlaying: boolean;
    isOverdrive: boolean;
    invertLook: boolean;
    liveHealth: number;
    liveAmmo: number;
    liveReserve: number;
    liveOverdrive: number;
    liveScore: number;
    liveEnemiesCount: number;
    isReloadingInternal: boolean;
  }>({} as any);

  // Sync 10Hz smooth React state
  useEffect(() => {
    const interval = setInterval(() => {
      const g = engineRef.current;
      if (!g || !g.isPlaying) return;
      setHealth(Math.round(g.liveHealth));
      setAmmo(g.liveAmmo);
      setReserveAmmo(g.liveReserve);
      setOverdriveEnergy(Math.round(g.liveOverdrive));
      setOverdriveActive(g.isOverdrive);
      setScore(g.liveScore);
      setEnemiesRemaining(g.liveEnemiesCount);
      setIsReloading(g.isReloadingInternal);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // WebGL 3D World Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050712);
    scene.fog = new THREE.FogExp2(0x050712, 0.015);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 800);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Arena Lights
    const ambient = new THREE.AmbientLight(0x1a243a, 1.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 2.2);
    dirLight.position.set(30, 50, 30);
    scene.add(dirLight);

    const cyberGlow = new THREE.PointLight(0x00f0ff, 2.5, 60);
    cyberGlow.position.set(0, 8, 0);
    scene.add(cyberGlow);

    // Arena Floor
    const floorGeo = new THREE.PlaneGeometry(120, 120, 20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Neon Floor Grid
    const grid = new THREE.GridHelper(120, 40, 0x00f0ff, 0x162238);
    grid.position.y = 0.01;
    scene.add(grid);

    // Neon Pillars / Arena Obstacles with Hand-Drawn Roman Cyber Mosaic Murals
    const pillarGeo = new THREE.BoxGeometry(3.2, 11, 3.2);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, metalness: 0.8, roughness: 0.3 });

    // Generate Hand-Drawn Mosaic Murals for Arena Monoliths
    const arenaMuralMosaic1 = createLevel4MosaicTexture('ROMAN_CYBER_MOSAIC', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#00f0ff',
      groutIntensity: 40,
    });
    const arenaMuralMosaic2 = createLevel4MosaicTexture('CYBER_PILOT', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ffaa00',
      groutIntensity: 40,
    });
    const arenaMuralMosaic3 = createLevel4MosaicTexture('GAUSS_RAILGUN', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00ffff',
      groutIntensity: 35,
    });

    const muralMat1 = new THREE.MeshStandardMaterial({
      map: arenaMuralMosaic1,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const muralMat2 = new THREE.MeshStandardMaterial({
      map: arenaMuralMosaic2,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const muralMat3 = new THREE.MeshStandardMaterial({
      map: arenaMuralMosaic3,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 12; i++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 18 + (i % 2) * 14;
      pillar.position.set(Math.cos(angle) * radius, 5.5, Math.sin(angle) * radius);
      scene.add(pillar);

      // Add Authentic Hand-Drawn Roman Mosaic Wall Plaque to Monolith
      const plaqueMat = i % 3 === 0 ? muralMat1 : i % 3 === 1 ? muralMat2 : muralMat3;
      const plaqueGeo = new THREE.PlaneGeometry(2.4, 4.2);
      const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
      plaqueMesh.position.set(Math.cos(angle) * radius, 6.0, Math.sin(angle) * radius);
      plaqueMesh.rotation.y = angle + Math.PI / 2;
      plaqueMesh.translateZ(1.65);
      scene.add(plaqueMesh);
    }

    // Shared Geometries & Materials
    const bulletGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const enemyLaserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 4);
    enemyLaserGeo.rotateX(Math.PI / 2);
    const particleGeo = new THREE.SphereGeometry(0.15, 4, 4);

    const pBulletMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const eBulletMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const pMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const pMatOrange = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const pMatRed = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Generate Level 4 Roman Mosaic Textures for FPS Weapons & Enemies
    const equippedWeaponAsset = getEquippedAssetForSlot('FPS_WEAPON');
    const rifleMosaic = equippedWeaponAsset
      ? createCustomAssetThreeTexture(equippedWeaponAsset)
      : createLevel4MosaicTexture('PLASMA_RIFLE', {
          tileSize: 3,
          tileStyle: 'QUANTUM_TRANSISTOR',
          primaryGlow: '#00f0ff',
          groutIntensity: 40,
        });

    const fpsHeavyMosaic = createLevel4MosaicTexture('GOLIATH_TITAN', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ff0044',
      groutIntensity: 45,
    });
    const fpsSentinelMosaic = createLevel4MosaicTexture('SENTINEL_DROID', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#d946ef',
      groutIntensity: 40,
    });

    const heavyMosaicMat = new THREE.MeshStandardMaterial({
      map: fpsHeavyMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.82,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const sentinelMosaicMat = new THREE.MeshStandardMaterial({
      map: fpsSentinelMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.88,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const sharedGeos = { bulletGeo, enemyLaserGeo, particleGeo };
    const sharedMats = {
      pBulletMat,
      eBulletMat,
      pMatCyan,
      pMatOrange,
      pMatRed,
      sentinelMosaicMat,
      heavyMosaicMat,
    };

    // 1st Person Cyber Plasma Rifle
    const weaponGroup = new THREE.Group();
    const rifleBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.22, 0.9),
      new THREE.MeshStandardMaterial({
        map: rifleMosaic,
        color: 0xcccccc,
        metalness: 0.95,
        roughness: 0.2,
      })
    );
    weaponGroup.add(rifleBody);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x006688 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.45);
    weaponGroup.add(barrel);

    // Glowing Plasma Energy Cell
    const plasmaCell = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    plasmaCell.position.set(0, -0.06, 0.1);
    weaponGroup.add(plasmaCell);

    // Holographic Laser Sight
    const laserSight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 20, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25 })
    );
    laserSight.rotation.x = Math.PI / 2;
    laserSight.position.set(0, 0.08, -10.4);
    weaponGroup.add(laserSight);

    const muzzleFlash = new THREE.PointLight(0x00ffff, 0, 8);
    muzzleFlash.position.set(0, 0.04, -0.85);
    weaponGroup.add(muzzleFlash);

    weaponGroup.position.set(0.35, -0.3, -0.7);
    camera.add(weaponGroup);
    scene.add(camera);

    engineRef.current = {
      scene,
      camera,
      renderer,
      weaponGroup,
      muzzleFlash,
      sharedGeos,
      sharedMats,
      bullets: [],
      enemies: [],
      particles: [],
      playerPos: new THREE.Vector3(0, 1.7, 0),
      cameraPitch: 0,
      cameraYaw: 0,
      keys: {},
      touchMove: { x: 0, y: 0 },
      lastLookTouch: null,
      isShooting: false,
      lastShotTime: 0,
      animFrameId: 0,
      isPlaying: false,
      isOverdrive: false,
      invertLook: false,
      liveHealth: 100,
      liveAmmo: 30,
      liveReserve: 120,
      liveOverdrive: 100,
      liveScore: 0,
      liveEnemiesCount: 0,
      isReloadingInternal: false,
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

    // Keyboard & Mouse Events
    const onKeyDown = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.keys[e.code] = true;
        if (e.code === 'KeyR') handleReload();
        if (e.code === 'KeyF') toggleOverdrive();
        if (e.code === 'KeyM') {
          setModulesOverlayOpen((prev) => !prev);
          sounds.playClick(700);
        }
        if (e.code === 'Space') engineRef.current.isShooting = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.keys[e.code] = false;
        if (e.code === 'Space') engineRef.current.isShooting = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const g = engineRef.current;
      if (!g || !g.isPlaying) return;
      if (document.pointerLockElement === renderer.domElement) {
        const pitchMult = g.invertLook ? -1 : 1;
        g.cameraYaw -= e.movementX * 0.0022;
        // Moving mouse down tilts view down
        g.cameraPitch -= e.movementY * 0.0022 * pitchMult;
        g.cameraPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, g.cameraPitch));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);

    // Game Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      engineRef.current.animFrameId = requestAnimationFrame(animate);
      const rawDelta = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const g = engineRef.current;
      if (!g || !g.isPlaying) {
        renderer.render(scene, camera);
        return;
      }

      // Overdrive time dilation
      let timeScale = 1.0;
      if (g.isOverdrive) {
        timeScale = 0.35;
        g.liveOverdrive = Math.max(0, g.liveOverdrive - rawDelta * 30);
        if (g.liveOverdrive <= 0) {
          g.isOverdrive = false;
          setOverdriveActive(false);
        }
      } else {
        g.liveOverdrive = Math.min(100, g.liveOverdrive + rawDelta * 6);
      }

      const delta = rawDelta * timeScale;

      // Camera Rotations
      camera.rotation.set(0, 0, 0);
      camera.rotation.y = g.cameraYaw;
      camera.rotation.x = g.cameraPitch;

      // Player Movement (W = forward, S = backward, A = left, D = right)
      const moveVec = new THREE.Vector3();
      if (g.keys['KeyW'] || g.keys['ArrowUp']) moveVec.z -= 1;
      if (g.keys['KeyS'] || g.keys['ArrowDown']) moveVec.z += 1;
      if (g.keys['KeyA'] || g.keys['ArrowLeft']) moveVec.x -= 1;
      if (g.keys['KeyD'] || g.keys['ArrowRight']) moveVec.x += 1;

      // Touch joystick analog
      if (Math.abs(g.touchMove.x) > 0.05 || Math.abs(g.touchMove.y) > 0.05) {
        moveVec.x += g.touchMove.x;
        moveVec.z += g.touchMove.y;
      }

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.cameraYaw);
        g.playerPos.x += moveVec.x * 16 * rawDelta;
        g.playerPos.z += moveVec.z * 16 * rawDelta;

        // Weapon Bobbing
        g.weaponGroup.position.y = -0.3 + Math.sin(time * 0.012) * 0.02;
        g.weaponGroup.position.x = 0.35 + Math.cos(time * 0.006) * 0.015;
      }

      // Boundary
      g.playerPos.x = Math.max(-55, Math.min(55, g.playerPos.x));
      g.playerPos.z = Math.max(-55, Math.min(55, g.playerPos.z));
      camera.position.copy(g.playerPos);

      // Weapon Fire
      if (g.isShooting && time - g.lastShotTime > 120 && g.liveAmmo > 0 && !g.isReloadingInternal) {
        g.lastShotTime = time;
        g.liveAmmo -= 1;
        spawnPlayerBullet();
        sounds.playLaserPew();

        g.muzzleFlash.intensity = 5;
        g.weaponGroup.position.z = -0.55;
      } else {
        g.muzzleFlash.intensity = Math.max(0, g.muzzleFlash.intensity - rawDelta * 30);
        g.weaponGroup.position.z = THREE.MathUtils.lerp(g.weaponGroup.position.z, -0.7, rawDelta * 10);
      }

      // Auto-reload if empty
      if (g.liveAmmo === 0 && !g.isReloadingInternal && g.liveReserve > 0) {
        handleReload();
      }

      // Update Bullets
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.mesh.position.addScaledVector(b.velocity, rawDelta);
        b.life -= rawDelta;

        if (b.isPlayer) {
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            const en = g.enemies[j];
            if (b.mesh.position.distanceTo(en.mesh.position) < 2.2) {
              en.health -= b.damage;
              spawnSparks(b.mesh.position, 'CYAN', 4);
              sounds.playDamageBlip();
              b.life = 0;

              if (en.health <= 0) {
                spawnSparks(en.mesh.position, 'ORANGE', 12);
                g.scene.remove(en.mesh);
                g.enemies.splice(j, 1);
                g.liveScore += 120;
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
          if (b.life > 0 && b.mesh.position.distanceTo(g.playerPos) < 1.4) {
            b.life = 0;
            g.liveHealth = Math.max(0, g.liveHealth - 12);
            spawnSparks(g.playerPos, 'RED', 6);
            sounds.playDamageBlip();

            if (g.liveHealth <= 0) {
              setGameState('GAMEOVER');
              g.isPlaying = false;
              sounds.playExplosionBoom();
            }
          }
        }

        if (b.life <= 0) {
          g.scene.remove(b.mesh);
          g.bullets.splice(i, 1);
        }
      }

      // Update Enemies
      g.enemies.forEach((en) => {
        const toPlayer = g.playerPos.clone().sub(en.mesh.position);
        toPlayer.y = 0;
        const dist = toPlayer.length();
        toPlayer.normalize();

        en.mesh.lookAt(g.playerPos.x, en.mesh.position.y, g.playerPos.z);
        if (dist > 5) {
          en.mesh.position.addScaledVector(toPlayer, en.speed * delta);
        }

        en.shootTimer -= delta;
        if (en.shootTimer <= 0 && dist < 45) {
          en.shootTimer = 1.3 + Math.random() * 1.5;
          spawnEnemyLaser(en.mesh.position, toPlayer);
        }
      });

      // Update Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.life -= delta;
        const scale = Math.max(0.01, (p.life / p.maxLife) * 1.0);
        p.mesh.scale.set(scale, scale, scale);
        if (p.life <= 0) {
          g.scene.remove(p.mesh);
          g.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    engineRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(engineRef.current.animFrameId);
      renderer.dispose();
    };
  }, []);

  const spawnPlayerBullet = () => {
    const g = engineRef.current;
    if (!g || g.bullets.length >= 35) return;

    const bMesh = new THREE.Mesh(g.sharedGeos.bulletGeo, g.sharedMats.pBulletMat);
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(g.camera.rotation);
    bMesh.position.copy(g.playerPos).add(dir.clone().multiplyScalar(0.8));
    g.scene.add(bMesh);

    g.bullets.push({
      mesh: bMesh,
      velocity: dir.multiplyScalar(150),
      life: 2.0,
      isPlayer: true,
      damage: 40,
    });
  };

  const spawnEnemyLaser = (origin: THREE.Vector3, dir: THREE.Vector3) => {
    const g = engineRef.current;
    if (!g || g.bullets.length >= 35) return;

    const bMesh = new THREE.Mesh(g.sharedGeos.enemyLaserGeo, g.sharedMats.eBulletMat);
    bMesh.position.copy(origin).add(new THREE.Vector3(0, 0.8, 0));
    bMesh.lookAt(g.playerPos);
    g.scene.add(bMesh);

    g.bullets.push({
      mesh: bMesh,
      velocity: dir.clone().multiplyScalar(40),
      life: 3.0,
      isPlayer: false,
      damage: 12,
    });
  };

  const spawnSparks = (pos: THREE.Vector3, color: 'CYAN' | 'ORANGE' | 'RED', count: number) => {
    const g = engineRef.current;
    if (!g || g.particles.length >= 40) return;

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
        (Math.random() - 0.5) * 12,
        Math.random() * 8,
        (Math.random() - 0.5) * 12
      );
      g.scene.add(p);
      g.particles.push({ mesh: p, velocity: vel, life: 0.4, maxLife: 0.4 });
    }
  };

  const handleReload = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = engineRef.current;
    if (!g || g.isReloadingInternal || g.liveAmmo === 30 || g.liveReserve <= 0) return;

    g.isReloadingInternal = true;
    setIsReloading(true);
    sounds.playGearTick();

    setTimeout(() => {
      if (!engineRef.current) return;
      const needed = 30 - engineRef.current.liveAmmo;
      const take = Math.min(needed, engineRef.current.liveReserve);
      engineRef.current.liveAmmo += take;
      engineRef.current.liveReserve -= take;
      engineRef.current.isReloadingInternal = false;
      setIsReloading(false);
      sounds.playSpectrumLoad();
    }, 1200);
  };

  const toggleOverdrive = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = engineRef.current;
    if (!g || g.liveOverdrive < 30) return;

    g.isOverdrive = !g.isOverdrive;
    setOverdriveActive(g.isOverdrive);
    sounds.playSimulatePulse();
  };

  const startFpsGame = (waveNum: number = 1) => {
    const g = engineRef.current;
    if (!g) return;

    g.playerPos.set(0, 1.7, 0);
    g.cameraPitch = 0;
    g.cameraYaw = 0;

    g.bullets.forEach((b) => g.scene.remove(b.mesh));
    g.enemies.forEach((e) => g.scene.remove(e.mesh));
    g.particles.forEach((p) => g.scene.remove(p.mesh));

    g.bullets = [];
    g.enemies = [];
    g.particles = [];

    g.liveHealth = 100;
    g.liveAmmo = 30;
    g.liveReserve = 120;
    g.liveOverdrive = 100;
    g.liveScore = score;
    g.isOverdrive = false;
    g.isReloadingInternal = false;

    setWave(waveNum);
    setGameState('PLAYING');
    g.isPlaying = true;

    const numEnemies = 4 + waveNum * 2;
    g.liveEnemiesCount = numEnemies;

    for (let i = 0; i < numEnemies; i++) {
      const eGroup = new THREE.Group();
      const isHeavy = i === 0 && waveNum >= 2;

      // Pure Level 4 Roman Mosaic Enemy Rig (No box/octahedron underlay)
      const mosaicMat = isHeavy ? g.sharedMats.heavyMosaicMat : g.sharedMats.sentinelMosaicMat;
      const size = isHeavy ? 4.8 : 2.6;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mosaicMat);
      mesh.position.y = isHeavy ? 1.5 : 1.6;
      eGroup.add(mesh);

      // Glowing Reactor Core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(isHeavy ? 0.28 : 0.14, 12, 12),
        new THREE.MeshBasicMaterial({ color: isHeavy ? 0xff0044 : 0xd946ef })
      );
      core.position.set(0, isHeavy ? 1.5 : 1.6, 0.04);
      eGroup.add(core);

      // Ground Shadow
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(isHeavy ? 1.4 : 0.7, 12),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      eGroup.add(shadow);

      const angle = (i / numEnemies) * Math.PI * 2;
      const r = 25 + Math.random() * 20;
      eGroup.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

      g.scene.add(eGroup);
      g.enemies.push({
        mesh: eGroup,
        health: isHeavy ? 200 : 60,
        maxHealth: isHeavy ? 200 : 60,
        speed: isHeavy ? 4.5 : 7.5 + Math.random() * 3,
        shootTimer: 1.2 + Math.random() * 1.5,
        type: isHeavy ? 'HEAVY_DROID' : 'CYBER_DRONE',
        heightOffset: isHeavy ? 1.4 : 1.6,
      });
    }

    sounds.playSpectrumLoad();
  };

  return (
    <div
      className={`relative w-full bg-[#050712] border border-white/10 overflow-hidden select-none font-mono transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[640px] sm:h-[750px] md:h-[820px] rounded-xl shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (containerRef.current && containerRef.current.querySelector('canvas')) {
            try {
              containerRef.current.querySelector('canvas')?.requestPointerLock();
            } catch (err) {}
          }
        }}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* TOP FPS HUD */}
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
            <Crosshair className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="font-bold text-white tracking-widest text-[11px] sm:text-xs">NEON SECTOR 3D FPS</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-neutral-300 text-[11px]">
            <span>WAVE: <b className="text-white">{wave}</b></span>
            <span>SENTINELS: <b className="text-red-400">{enemiesRemaining}</b></span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
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

          {/* Invert Look Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const next = !invertLook;
              setInvertLook(next);
              if (engineRef.current) engineRef.current.invertLook = next;
              sounds.playClick(600);
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider flex items-center gap-1 transition-all ${
              invertLook ? 'bg-amber-600/80 border-amber-400 text-white' : 'bg-white/5 border-white/20 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Normal vs Inverted Look"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">{invertLook ? 'LOOK: INVERTED' : 'LOOK: NORMAL'}</span>
            <span className="sm:hidden">{invertLook ? 'INV' : 'NORM'}</span>
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

      {/* CENTER CROSSHAIR */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-cyan-400/80 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#00f0ff]" />
          </div>
        </div>
      )}

      {/* TOP-LEFT COMPACT VITALS (Docked cleanly under header) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-14 left-4 sm:left-6 z-20 pointer-events-none">
          <div className="flex flex-col gap-1.5 w-44 sm:w-48 bg-black/75 p-2.5 rounded-lg border border-white/15 backdrop-blur-md shadow-lg">
            <div>
              <div className="flex justify-between text-[10px] text-red-400 font-bold mb-0.5">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> HEALTH</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150" style={{ width: `${health}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-cyan-300 font-bold mb-0.5">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-400" /> SYNAPSE OVERDRIVE</span>
                <span>{overdriveEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] transition-all duration-150" style={{ width: `${overdriveEnergy}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-300 pt-1 border-t border-white/10">
              <span>AMMO CLIP:</span>
              <span className="font-bold text-amber-400 text-xs">{ammo} <span className="text-neutral-400 text-[10px]">/ {reserveAmmo}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* DUAL-HAND ERGONOMIC SPACED TOUCH CONTROLS */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Touch Look/Aim Drag Area (Center-Right Touch surface for smooth mouse/finger aiming) */}
          <div
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const g = engineRef.current;
              if (!g || !g.lastLookTouch) {
                if (g) g.lastLookTouch = { x: touch.clientX, y: touch.clientY };
                return;
              }
              const dx = touch.clientX - g.lastLookTouch.x;
              const dy = touch.clientY - g.lastLookTouch.y;
              const pitchMult = g.invertLook ? -1 : 1;
              g.cameraYaw -= dx * 0.006;
              g.cameraPitch -= dy * 0.006 * pitchMult;
              g.cameraPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, g.cameraPitch));
              g.lastLookTouch = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={() => {
              if (engineRef.current) engineRef.current.lastLookTouch = null;
            }}
            className="absolute top-16 bottom-28 inset-x-24 sm:inset-x-36 pointer-events-auto touch-none flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity"
          >
            <div className="border border-dashed border-white/20 rounded-2xl w-3/4 h-3/4 flex items-center justify-center text-[10px] text-white/50 tracking-wider">
              SWIPE HERE TO AIM
            </div>
          </div>

          {/* LEFT THUMB ZONE: Spacious Movement Joystick */}
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
                if (engineRef.current) engineRef.current.touchMove = { x: dx, y: dy };
              }}
              onTouchEnd={() => {
                if (engineRef.current) engineRef.current.touchMove = { x: 0, y: 0 };
              }}
              className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border-2 border-cyan-400/40 bg-black/60 backdrop-blur-md flex items-center justify-center touch-none relative shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              {/* Inner Analog Nub */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white shadow-[0_0_15px_#00f0ff]" />
              <div className="absolute bottom-2 text-[8px] text-cyan-200 font-bold tracking-widest uppercase">MOVE</div>
            </div>
          </div>

          {/* RIGHT THUMB ZONE: Action Controls Spaced Apart */}
          <div className="absolute bottom-5 sm:bottom-8 right-5 sm:right-8 pointer-events-auto">
            {/* Reload Button (Top right) */}
            <div className="absolute -top-20 sm:-top-24 right-1">
              <button
                type="button"
                onClick={handleReload}
                disabled={isReloading}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/70 border-2 border-amber-400/60 text-amber-300 flex flex-col items-center justify-center font-bold active:scale-95 disabled:opacity-50 backdrop-blur-md shadow-lg"
                title="Reload Weapon (R)"
              >
                <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin' : ''}`} />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">{isReloading ? '...' : 'RELOAD'}</span>
              </button>
            </div>

            {/* Overdrive Slow-Mo Button (Left of Fire) */}
            <div className="absolute top-4 -left-22 sm:-left-26">
              <button
                type="button"
                onClick={toggleOverdrive}
                disabled={overdriveEnergy < 30}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center font-bold active:scale-90 shadow-lg disabled:opacity-40 backdrop-blur-md transition-all ${
                  overdriveActive
                    ? 'bg-cyan-400 text-black border-white shadow-[0_0_20px_#00f0ff]'
                    : 'bg-gradient-to-br from-cyan-900 to-blue-900 border-cyan-400 text-cyan-200'
                }`}
                title="Synapse Overdrive Slow-Motion (F)"
              >
                <Zap className="w-5 h-5" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">SLOW-MO</span>
              </button>
            </div>

            {/* Primary Fire Trigger */}
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                if (engineRef.current) engineRef.current.isShooting = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (engineRef.current) engineRef.current.isShooting = false;
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (engineRef.current) engineRef.current.isShooting = true;
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (engineRef.current) engineRef.current.isShooting = false;
              }}
              className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-red-600 via-red-500 to-cyan-500 border-3 border-white text-white flex flex-col items-center justify-center font-black active:scale-95 shadow-[0_0_25px_rgba(239,68,68,0.9)]"
            >
              <Crosshair className="w-9 h-9 sm:w-10 sm:h-10" />
              <span className="text-[11px] tracking-widest font-black">FIRE</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          {gameState === 'MENU' && (
            <div className="max-w-lg space-y-4">
              <div className="relative w-full h-36 sm:h-44 rounded-lg overflow-hidden border border-amber-500/40 bg-black/60 shadow-xl">
                <img
                  src="/images/cyber_plasma_rifle_1787089913135.jpg"
                  alt="Synapse Plasma Beam Rifle"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-amber-300 border border-amber-400/40">
                  WEAPON: SYNAPSE PLASMA RIFLE 9000
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
                NEON SECTOR: 3D CYBER FPS
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Step into a neon synth arena in true 1st-person perspective. Eliminate sentinel drones and activate Synapse Overdrive slow-motion bullet time.
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
                  onClick={() => startFpsGame(1)}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all"
                >
                  ENTER ARENA
                </button>
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="max-w-md space-y-4">
              <div className="text-red-500 text-3xl font-black tracking-widest">CRITICAL FAILURE</div>
              <p className="text-xs text-neutral-300">You were neutralized in the combat zone.</p>
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
                  onClick={() => startFpsGame(wave)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                >
                  RESPAWN IN SECTOR
                </button>
              </div>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <div className="max-w-md space-y-4">
              <div className="text-emerald-400 text-3xl font-black tracking-widest">SECTOR PURGED</div>
              <p className="text-xs text-neutral-300">All enemy targets eliminated.</p>
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
                  onClick={() => startFpsGame(wave + 1)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                >
                  ADVANCE TO WAVE {wave + 1}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2D First, then 3D Tactical In-Game Modules & Asset Deck Overlay */}
      <InGameModulesAssetOverlay
        isOpen={modulesOverlayOpen}
        onClose={() => setModulesOverlayOpen(false)}
        gameMode="FPS"
        activeModules={activeModules}
        onToggleModuleEquip={toggleModuleEquip}
      />
    </div>
  );
};
