import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Shield,
  Crosshair,
  Zap,
  Flame,
  Radio,
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
} from '../../utils/customCharacterStore';

interface ThirdPersonTacticalShooterProps {
  powerOn: boolean;
  fluxFrequency: number;
  onExitToMenu?: () => void;
}

export const ThirdPersonTacticalShooter3D: React.FC<ThirdPersonTacticalShooterProps> = ({
  powerOn,
  onExitToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [barrierEnergy, setBarrierEnergy] = useState<number>(100);
  const [dashCooldown, setDashCooldown] = useState<number>(0);
  const [orbitalCooldown, setOrbitalCooldown] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [wave, setWave] = useState<number>(1);
  const [hostilesLeft, setHostilesLeft] = useState<number>(8);
  const [modulesOverlayOpen, setModulesOverlayOpen] = useState<boolean>(false);
  const [activeModules, setActiveModules] = useState<GameModuleAsset[]>(() =>
    getModulesForGame('TPS').filter((m) => m.isEquipped)
  );

  const toggleModuleEquip = (moduleId: string) => {
    setActiveModules((prev) => {
      const isEq = prev.some((m) => m.id === moduleId);
      if (isEq) {
        return prev.filter((m) => m.id !== moduleId);
      } else {
        const all = getModulesForGame('TPS');
        const found = all.find((m) => m.id === moduleId);
        return found ? [...prev, found] : prev;
      }
    });
  };

  const gameRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    heroGroup: THREE.Group;
    heroTorso: THREE.Group;
    heroLegs: THREE.Group;
    barrierMesh: THREE.Mesh | null;
    sharedGeos: Record<string, THREE.BufferGeometry>;
    sharedMats: Record<string, THREE.Material>;
    bullets: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; isPlayer: boolean; damage: number }>;
    enemies: Array<{
      mesh: THREE.Group;
      health: number;
      maxHealth: number;
      speed: number;
      shootTimer: number;
      type: 'CRAWLER' | 'GOLIATH';
    }>;
    particles: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }>;
    orbitalBeams: Array<{ mesh: THREE.Mesh; life: number; maxLife: number; radius: number }>;
    playerPos: THREE.Vector3;
    playerYaw: number;
    targetYaw: number;
    keys: Record<string, boolean>;
    touchStick: { x: number; y: number };
    isShooting: boolean;
    lastShotTime: number;
    animFrameId: number;
    isPlaying: boolean;
    walkAnimCycle: number;
    // Decoupled runtime vitals
    liveHealth: number;
    liveBarrier: number;
    liveDashCd: number;
    liveOrbitalCd: number;
    liveScore: number;
    liveHostiles: number;
    isBarrierActive: boolean;
  }>({} as any);

  // Smooth 10Hz React State Sync
  useEffect(() => {
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (!g || !g.isPlaying) return;
      setHealth(Math.round(g.liveHealth));
      setBarrierEnergy(Math.round(g.liveBarrier));
      setDashCooldown(Math.max(0, +g.liveDashCd.toFixed(1)));
      setOrbitalCooldown(Math.max(0, +g.liveOrbitalCd.toFixed(1)));
      setScore(g.liveScore);
      setHostilesLeft(g.liveHostiles);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);
    scene.fog = new THREE.FogExp2(0x060814, 0.012);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 800);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x223355, 1.4);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xaaccff, 2.0);
    mainLight.position.set(40, 60, 40);
    scene.add(mainLight);

    const redAccent = new THREE.PointLight(0xff0044, 2, 40);
    redAccent.position.set(0, 5, 0);
    scene.add(redAccent);

    // Arena Map Grid
    const floorGeo = new THREE.PlaneGeometry(150, 150, 24, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b0e1b, roughness: 0.3, metalness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(150, 50, 0x00f0ff, 0x162238);
    grid.position.y = 0.02;
    scene.add(grid);

    // Tactical Cover Blocks with Hand-Drawn Roman Cyber Mosaic Murals
    const coverGeo = new THREE.BoxGeometry(4, 2.5, 2);
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x1c2438, roughness: 0.4, metalness: 0.8 });

    // Generate Hand-Drawn Mosaic Murals for Tactical Barriers
    const tpsMuralMosaic1 = createLevel4MosaicTexture('ROMAN_CYBER_MOSAIC', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#00f0ff',
      groutIntensity: 40,
    });
    const tpsMuralMosaic2 = createLevel4MosaicTexture('VALKYRIE_GUNDAM', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ffaa00',
      groutIntensity: 40,
    });
    const tpsMuralMosaic3 = createLevel4MosaicTexture('MECH_ARMOR', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00ffff',
      groutIntensity: 35,
    });

    const tpsMuralMat1 = new THREE.MeshStandardMaterial({
      map: tpsMuralMosaic1,
      metalness: 0.75,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    const tpsMuralMat2 = new THREE.MeshStandardMaterial({
      map: tpsMuralMosaic2,
      metalness: 0.75,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    const tpsMuralMat3 = new THREE.MeshStandardMaterial({
      map: tpsMuralMosaic3,
      metalness: 0.75,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 16; i++) {
      const cover = new THREE.Mesh(coverGeo, coverMat);
      const angle = (i / 16) * Math.PI * 2;
      const r = 20 + (i % 3) * 12;
      cover.position.set(Math.cos(angle) * r, 1.25, Math.sin(angle) * r);
      cover.rotation.y = angle + Math.PI / 4;
      scene.add(cover);

      // Add Roman Cyber Mosaic Plaque on tactical cover
      const muralMat = i % 3 === 0 ? tpsMuralMat1 : i % 3 === 1 ? tpsMuralMat2 : tpsMuralMat3;
      const muralPlaque = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.1), muralMat);
      muralPlaque.position.set(Math.cos(angle) * r, 1.25, Math.sin(angle) * r);
      muralPlaque.rotation.y = angle + Math.PI / 4;
      muralPlaque.translateZ(1.02);
      scene.add(muralPlaque);
    }

    // Shared Pre-Allocated Geometries & Materials
    const bulletGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const enemyLaserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 4);
    enemyLaserGeo.rotateX(Math.PI / 2);
    const particleGeo = new THREE.SphereGeometry(0.15, 4, 4);
    const beamGeo = new THREE.CylinderGeometry(4, 4, 80, 16);

    const pBulletMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const eBulletMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const pMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const pMatOrange = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const pMatRed = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });

    // Generate High-Fidelity Level 4 Roman Mosaic & Quantum Transistor Textures
    const equippedMechAsset = getEquippedAssetForSlot('TPS_MECH');
    const heroMosaicFront = equippedMechAsset
      ? createCustomAssetThreeTexture(equippedMechAsset)
      : createLevel4MosaicTexture('HERO_MECH_FRONT', {
          tileSize: 3,
          tileStyle: 'ROMAN_STONE',
          groutIntensity: 50,
        });
    const heroMosaicBack = equippedMechAsset
      ? createCustomAssetThreeTexture(equippedMechAsset)
      : createLevel4MosaicTexture('HERO_MECH_BACK', {
          tileSize: 3,
          tileStyle: 'ROMAN_STONE',
          groutIntensity: 50,
        });
    const goliathMosaic = createLevel4MosaicTexture('GOLIATH_TITAN', {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      primaryGlow: '#ff0033',
      groutIntensity: 45,
    });
    const droneMosaic = createLevel4MosaicTexture('CYBER_DRONE', {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      primaryGlow: '#00f0ff',
      groutIntensity: 40,
    });

    const heroMosaicFrontMat = new THREE.MeshStandardMaterial({
      map: heroMosaicFront,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.FrontSide,
    });
    const heroMosaicBackMat = new THREE.MeshStandardMaterial({
      map: heroMosaicBack,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.BackSide,
    });
    const goliathMosaicMat = new THREE.MeshStandardMaterial({
      map: goliathMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.8,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    const droneMosaicMat = new THREE.MeshStandardMaterial({
      map: droneMosaic,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.88,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const sharedGeos = { bulletGeo, enemyLaserGeo, particleGeo, beamGeo };
    const sharedMats = {
      pBulletMat,
      eBulletMat,
      pMatCyan,
      pMatOrange,
      pMatRed,
      beamMat,
      heroMosaicFrontMat,
      heroMosaicBackMat,
      goliathMosaicMat,
      droneMosaicMat,
    };

    // 3rd Person Mech Hero Model - High Fidelity Level 4 Roman Mosaic Rig (No rough box underlay)
    const heroGroup = new THREE.Group();
    const heroTorso = new THREE.Group();
    const heroLegs = new THREE.Group();

    // Dual-Sided Level 4 Roman Mosaic Surface Geometry
    const heroPlaneGeo = new THREE.PlaneGeometry(2.9, 3.4);

    const frontPlate = new THREE.Mesh(heroPlaneGeo, heroMosaicFrontMat);
    frontPlate.position.set(0, 1.65, 0.02);
    heroTorso.add(frontPlate);

    const backPlate = new THREE.Mesh(heroPlaneGeo, heroMosaicBackMat);
    backPlate.position.set(0, 1.65, -0.02);
    heroTorso.add(backPlate);

    // Glowing Plasma Core on Chest
    const chestCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    chestCore.position.set(0, 1.5, 0.08);
    heroTorso.add(chestCore);

    // Dual Twin Plasma Thrusters on Mech Back
    const leftThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.35, 1.52, -0.15);
    heroTorso.add(leftThruster);

    const rightThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.35, 1.52, -0.15);
    heroTorso.add(rightThruster);

    // Shoulder Laser Cannon with Precision Red/Cyan Aiming Guide
    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x003355, metalness: 0.9 })
    );
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0.62, 1.7, 0.25);
    heroTorso.add(cannon);

    // Laser Sight Beam
    const laserSight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 25, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.35 })
    );
    laserSight.rotation.x = Math.PI / 2;
    laserSight.position.set(0.62, 1.7, -12.2);
    heroTorso.add(laserSight);

    // Ground Shadow Projector Disk
    const shadowDisk = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
    );
    shadowDisk.rotation.x = -Math.PI / 2;
    shadowDisk.position.y = 0.02;
    heroGroup.add(shadowDisk);

    heroGroup.add(heroTorso);
    heroGroup.add(heroLegs);
    scene.add(heroGroup);

    gameRef.current = {
      scene,
      camera,
      renderer,
      heroGroup,
      heroTorso,
      heroLegs,
      barrierMesh: null,
      sharedGeos,
      sharedMats,
      bullets: [],
      enemies: [],
      particles: [],
      orbitalBeams: [],
      playerPos: new THREE.Vector3(0, 0, 0),
      playerYaw: 0,
      targetYaw: 0,
      keys: {},
      touchStick: { x: 0, y: 0 },
      isShooting: false,
      lastShotTime: 0,
      animFrameId: 0,
      isPlaying: false,
      walkAnimCycle: 0,
      liveHealth: 100,
      liveBarrier: 100,
      liveDashCd: 0,
      liveOrbitalCd: 0,
      liveScore: 0,
      liveHostiles: 0,
      isBarrierActive: false,
    };

    // Resize
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

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameRef.current) {
        gameRef.current.keys[e.code] = true;
        if (e.code === 'KeyE') handleDeployBarrier();
        if (e.code === 'KeyQ') handleDash();
        if (e.code === 'KeyR') handleOrbitalStrike();
        if (e.code === 'KeyM') {
          setModulesOverlayOpen((prev) => !prev);
          sounds.playClick(700);
        }
        if (e.code === 'Space') gameRef.current.isShooting = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (gameRef.current) {
        gameRef.current.keys[e.code] = false;
        if (e.code === 'Space') gameRef.current.isShooting = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      gameRef.current.animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const g = gameRef.current;
      if (!g || !g.isPlaying) {
        renderer.render(scene, camera);
        return;
      }

      // Cooldowns
      if (g.liveDashCd > 0) g.liveDashCd = Math.max(0, g.liveDashCd - delta);
      if (g.liveOrbitalCd > 0) g.liveOrbitalCd = Math.max(0, g.liveOrbitalCd - delta);

      // Hero Movement (W / Stick UP walks Forward, S / Stick DOWN walks Back)
      const moveVec = new THREE.Vector3();
      if (g.keys['KeyW'] || g.keys['ArrowUp']) moveVec.z -= 1;
      if (g.keys['KeyS'] || g.keys['ArrowDown']) moveVec.z += 1;
      if (g.keys['KeyA'] || g.keys['ArrowLeft']) moveVec.x -= 1;
      if (g.keys['KeyD'] || g.keys['ArrowRight']) moveVec.x += 1;

      // Smartphone Touch Movement (Stick UP = dy < 0 = forward)
      if (Math.abs(g.touchStick.x) > 0.05 || Math.abs(g.touchStick.y) > 0.05) {
        moveVec.x += g.touchStick.x;
        moveVec.z += g.touchStick.y;
      }

      const isWalking = moveVec.lengthSq() > 0.01;
      if (isWalking) {
        moveVec.normalize();
        g.targetYaw = Math.atan2(moveVec.x, -moveVec.z);
        g.playerPos.addScaledVector(moveVec, 16 * delta);

        g.walkAnimCycle += delta * 14;
        g.heroTorso.position.y = Math.sin(g.walkAnimCycle) * 0.08;
        g.heroTorso.rotation.z = Math.sin(g.walkAnimCycle * 0.5) * 0.04;

        // Dynamic Thruster Exhaust Flares
        if (Math.random() < 0.45 && g.particles.length < 35) {
          const exhaustPos = g.playerPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            1.4,
            0.4
          ).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw));
          const p = new THREE.Mesh(g.sharedGeos.particleGeo, g.sharedMats.pMatCyan);
          p.position.copy(exhaustPos);
          const vel = new THREE.Vector3((Math.random() - 0.5) * 2, -1, 3).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw);
          g.scene.add(p);
          g.particles.push({ mesh: p, velocity: vel, life: 0.25, maxLife: 0.25 });
        }
      } else {
        g.heroTorso.position.y = 0;
        g.heroTorso.rotation.z = 0;
      }

      // Smooth Hero Rotation
      g.playerYaw = THREE.MathUtils.lerp(g.playerYaw, g.targetYaw, delta * 12);
      g.heroGroup.rotation.y = g.playerYaw;
      g.heroGroup.position.copy(g.playerPos);

      // Camera 3rd Person Over-Shoulder Following
      const camTarget = g.playerPos.clone().add(new THREE.Vector3(0, 1.8, 0));
      const camOffset = new THREE.Vector3(1.5, 3.2, 7.5);
      g.camera.position.lerp(camTarget.clone().add(camOffset), delta * 8);
      g.camera.lookAt(camTarget.clone().add(new THREE.Vector3(0, 0, -5)));

      // Auto Fire
      if (g.isShooting && time - g.lastShotTime > 130) {
        g.lastShotTime = time;
        spawnTacticalHeroBullet();
        sounds.playLaserPew();
      }

      // Update Bullets
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.mesh.position.addScaledVector(b.velocity, delta);
        b.life -= delta;

        if (b.isPlayer) {
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            const en = g.enemies[j];
            if (b.mesh.position.distanceTo(en.mesh.position) < 2.5) {
              en.health -= b.damage;
              spawnSparks(b.mesh.position, 'CYAN', 4);
              sounds.playDamageBlip();
              b.life = 0;

              if (en.health <= 0) {
                spawnSparks(en.mesh.position, 'ORANGE', 14);
                g.scene.remove(en.mesh);
                g.enemies.splice(j, 1);
                g.liveScore += 180;
                g.liveHostiles = g.enemies.length;
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
          // Check barrier interception
          if (g.barrierMesh && g.isBarrierActive) {
            if (b.mesh.position.distanceTo(g.barrierMesh.position) < 3.5) {
              b.life = 0;
              spawnSparks(b.mesh.position, 'CYAN', 6);
              sounds.playDamageBlip();
              g.liveBarrier = Math.max(0, g.liveBarrier - 8);
              if (g.liveBarrier <= 0) {
                g.scene.remove(g.barrierMesh);
                g.barrierMesh = null;
                g.isBarrierActive = false;
              }
            }
          }

          if (b.life > 0 && b.mesh.position.distanceTo(g.playerPos) < 1.4) {
            b.life = 0;
            g.liveHealth = Math.max(0, g.liveHealth - 16);
            spawnSparks(g.playerPos, 'RED', 6);
            sounds.playDamageBlip();
            if (g.liveHealth <= 0) {
              setGameState('GAMEOVER');
              g.isPlaying = false;
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
        if (dist > 6) {
          en.mesh.position.addScaledVector(toPlayer, en.speed * delta);
        }

        en.shootTimer -= delta;
        if (en.shootTimer <= 0 && dist < 50) {
          en.shootTimer = 1.4 + Math.random() * 1.6;
          spawnEnemyBolt(en.mesh.position, toPlayer);
        }
      });

      // Update Orbital Beams
      for (let i = g.orbitalBeams.length - 1; i >= 0; i--) {
        const ob = g.orbitalBeams[i];
        ob.life -= delta;
        ob.mesh.rotation.y += delta * 6;

        g.enemies.forEach((en) => {
          if (en.mesh.position.distanceTo(ob.mesh.position) < ob.radius) {
            en.health -= delta * 120;
          }
        });

        if (ob.life <= 0) {
          g.scene.remove(ob.mesh);
          g.orbitalBeams.splice(i, 1);
        }
      }

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

    gameRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(gameRef.current.animFrameId);
      renderer.dispose();
    };
  }, []);

  const spawnTacticalHeroBullet = () => {
    const g = gameRef.current;
    if (!g || g.bullets.length >= 25) return;

    const bMesh = new THREE.Mesh(g.sharedGeos.bulletGeo, g.sharedMats.pBulletMat);
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw);
    bMesh.position.copy(g.playerPos).add(new THREE.Vector3(0, 1.4, 0)).add(forward.clone().multiplyScalar(0.8));
    g.scene.add(bMesh);

    g.bullets.push({
      mesh: bMesh,
      velocity: forward.multiplyScalar(120),
      life: 2.2,
      isPlayer: true,
      damage: 45,
    });
  };

  const spawnEnemyBolt = (origin: THREE.Vector3, dir: THREE.Vector3) => {
    const g = gameRef.current;
    if (!g || g.bullets.length >= 25) return;

    const bMesh = new THREE.Mesh(g.sharedGeos.enemyLaserGeo, g.sharedMats.eBulletMat);
    bMesh.position.copy(origin).add(new THREE.Vector3(0, 1.0, 0));
    bMesh.lookAt(g.playerPos);
    g.scene.add(bMesh);

    g.bullets.push({
      mesh: bMesh,
      velocity: dir.clone().multiplyScalar(35),
      life: 3.5,
      isPlayer: false,
      damage: 16,
    });
  };

  const spawnSparks = (pos: THREE.Vector3, color: 'CYAN' | 'ORANGE' | 'RED', count: number) => {
    const g = gameRef.current;
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
        (Math.random() - 0.5) * 14,
        Math.random() * 10,
        (Math.random() - 0.5) * 14
      );
      g.scene.add(p);
      g.particles.push({ mesh: p, velocity: vel, life: 0.4, maxLife: 0.4 });
    }
  };

  const handleDash = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = gameRef.current;
    if (!g || g.liveDashCd > 0) return;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw);
    g.playerPos.addScaledVector(forward, 12);
    g.liveDashCd = 2.5;
    spawnSparks(g.playerPos, 'CYAN', 10);
    sounds.playSimulatePulse();
  };

  const handleDeployBarrier = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = gameRef.current;
    if (!g || g.liveBarrier < 30) return;

    if (g.barrierMesh) {
      g.scene.remove(g.barrierMesh);
    }

    const bMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.55 })
    );
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw);
    bMesh.position.copy(g.playerPos).add(forward.clone().multiplyScalar(3.5));
    bMesh.position.y = 1.5;
    bMesh.rotation.y = g.playerYaw;

    g.scene.add(bMesh);
    g.barrierMesh = bMesh;
    g.isBarrierActive = true;
    g.liveBarrier -= 30;
    sounds.playPowerUpChime();
  };

  const handleOrbitalStrike = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const g = gameRef.current;
    if (!g || g.liveOrbitalCd > 0) return;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerYaw);
    const targetPos = g.playerPos.clone().add(forward.clone().multiplyScalar(15));

    const beamMesh = new THREE.Mesh(g.sharedGeos.beamGeo, g.sharedMats.beamMat);
    beamMesh.position.copy(targetPos);
    beamMesh.position.y = 40;
    g.scene.add(beamMesh);

    g.orbitalBeams.push({
      mesh: beamMesh,
      life: 2.0,
      maxLife: 2.0,
      radius: 12,
    });

    g.liveOrbitalCd = 12.0;
    sounds.playExplosionBoom();
  };

  const startTpsGame = (waveNum: number = 1) => {
    const g = gameRef.current;
    if (!g) return;

    g.playerPos.set(0, 0, 0);
    g.playerYaw = 0;
    g.targetYaw = 0;

    g.bullets.forEach((b) => g.scene.remove(b.mesh));
    g.enemies.forEach((e) => g.scene.remove(e.mesh));
    g.particles.forEach((p) => g.scene.remove(p.mesh));
    g.orbitalBeams.forEach((ob) => g.scene.remove(ob.mesh));
    if (g.barrierMesh) g.scene.remove(g.barrierMesh);

    g.bullets = [];
    g.enemies = [];
    g.particles = [];
    g.orbitalBeams = [];
    g.barrierMesh = null;

    g.liveHealth = 100;
    g.liveBarrier = 100;
    g.liveDashCd = 0;
    g.liveOrbitalCd = 0;
    g.liveScore = score;
    g.isBarrierActive = false;

    setWave(waveNum);
    setGameState('PLAYING');
    g.isPlaying = true;

    const numEnemies = 4 + waveNum * 2;
    g.liveHostiles = numEnemies;

    for (let i = 0; i < numEnemies; i++) {
      const eGroup = new THREE.Group();
      const isGoliath = i === 0 && waveNum >= 2;

      // Pure Level 4 Roman Mosaic Enemy Rig (No box/cone overlay underneath)
      const mosaicMat = isGoliath ? g.sharedMats.goliathMosaicMat : g.sharedMats.droneMosaicMat;
      const size = isGoliath ? 5.2 : 2.8;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mosaicMat);
      mesh.position.y = isGoliath ? 2.3 : 1.3;
      eGroup.add(mesh);

      // Emissive Reactor Core Center
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(isGoliath ? 0.32 : 0.16, 12, 12),
        new THREE.MeshBasicMaterial({ color: isGoliath ? 0xff0044 : 0x00f0ff })
      );
      core.position.set(0, isGoliath ? 2.3 : 1.3, 0.05);
      eGroup.add(core);

      // Subtle Hovering Shadow
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(isGoliath ? 1.6 : 0.8, 12),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      eGroup.add(shadow);

      const angle = (i / numEnemies) * Math.PI * 2;
      const r = 30 + Math.random() * 25;
      eGroup.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

      g.scene.add(eGroup);
      g.enemies.push({
        mesh: eGroup,
        health: isGoliath ? 300 : 75,
        maxHealth: isGoliath ? 300 : 75,
        speed: isGoliath ? 4.5 : 8.5 + Math.random() * 3,
        shootTimer: 1.2 + Math.random() * 1.5,
        type: isGoliath ? 'GOLIATH' : 'CRAWLER',
      });
    }

    sounds.playSpectrumLoad();
  };

  return (
    <div
      className={`relative w-full bg-[#060814] border border-white/10 overflow-hidden select-none font-mono transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[640px] sm:h-[750px] md:h-[820px] rounded-xl shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* TOP TPS HUD */}
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
            <Shield className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="font-bold text-white tracking-widest text-[11px] sm:text-xs">VANGUARD PROTOCOL TPS</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-neutral-300 text-[11px]">
            <span>TACTICAL WAVE: <b className="text-white">{wave}</b></span>
            <span>HOSTILES: <b className="text-red-400">{hostilesLeft}</b></span>
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

      {/* TOP-LEFT COMPACT VITALS (Docked under top header) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-14 left-4 sm:left-6 z-20 pointer-events-none">
          <div className="flex flex-col gap-1.5 w-44 sm:w-48 bg-black/75 p-2.5 rounded-lg border border-white/15 backdrop-blur-md shadow-lg">
            <div>
              <div className="flex justify-between text-[10px] text-red-400 font-bold mb-0.5">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> OPERATIVE HP</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-500/30">
                <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150" style={{ width: `${health}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-cyan-300 font-bold mb-0.5">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-400" /> FORCE SHIELD</span>
                <span>{barrierEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] transition-all duration-150" style={{ width: `${barrierEnergy}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DUAL-HAND ERGONOMIC SPACED CONTROLS */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* LEFT THUMB ZONE: Movement Joystick */}
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
              <div className="absolute bottom-2 text-[8px] text-cyan-200 font-bold tracking-widest uppercase">WALK</div>
            </div>
          </div>

          {/* RIGHT THUMB ZONE: Action Controls Spaced Apart */}
          <div className="absolute bottom-5 sm:bottom-8 right-5 sm:right-8 pointer-events-auto">
            {/* Ability Buttons Row (Positioned above and left of fire) */}
            <div className="absolute -top-16 sm:-top-20 right-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDash}
                disabled={dashCooldown > 0}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-950/80 border-2 border-blue-400 text-white flex flex-col items-center justify-center text-[8px] font-extrabold active:scale-95 disabled:opacity-40 shadow-lg backdrop-blur-md"
                title="Tactical Dash (Q)"
              >
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>{dashCooldown > 0 ? `${dashCooldown}s` : 'DASH'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeployBarrier}
                disabled={barrierEnergy < 30}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cyan-950/80 border-2 border-cyan-400 text-white flex flex-col items-center justify-center text-[8px] font-extrabold active:scale-95 disabled:opacity-40 shadow-lg backdrop-blur-md"
                title="Deploy Shield Barrier (E)"
              >
                <Shield className="w-4 h-4 text-cyan-300" />
                <span>WALL</span>
              </button>

              <button
                type="button"
                onClick={handleOrbitalStrike}
                disabled={orbitalCooldown > 0}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-950/80 border-2 border-amber-400 text-white flex flex-col items-center justify-center text-[8px] font-extrabold active:scale-95 disabled:opacity-40 shadow-lg backdrop-blur-md"
                title="Orbital Ion Strike (R)"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{orbitalCooldown > 0 ? `${orbitalCooldown}s` : 'STRIKE'}</span>
              </button>
            </div>

            {/* Plasma Cannon Fire */}
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

      {/* OVERLAYS */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          {gameState === 'MENU' && (
            <div className="max-w-lg space-y-4">
              <div className="relative w-full h-36 sm:h-44 rounded-lg overflow-hidden border border-red-500/40 bg-black/60 shadow-xl">
                <img
                  src="/images/cyber_mech_armor_1787089900058.jpg"
                  alt="Vanguard Goliath-Buster Mech"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-red-300 border border-red-400/40">
                  TACTICAL MECH: MK-VII GOLIATH-BUSTER
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
                VANGUARD PROTOCOL: 3D TPS
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Take tactical command of a heavy mechanized operative in 3rd-person perspective. Deploy energy barriers, tactical dash, and summon orbital laser strikes.
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
                  onClick={() => startTpsGame(1)}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.8)] active:scale-95 transition-all"
                >
                  DEPLOY OPERATIVE
                </button>
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="max-w-md space-y-4">
              <div className="text-red-500 text-3xl font-black tracking-widest">OPERATIVE DOWN</div>
              <p className="text-xs text-neutral-300">Armor compromised in the tactical sector.</p>
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
                  onClick={() => startTpsGame(wave)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                >
                  RE-DEPLOY
                </button>
              </div>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <div className="max-w-md space-y-4">
              <div className="text-emerald-400 text-3xl font-black tracking-widest">ZONE SECURED</div>
              <p className="text-xs text-neutral-300">All hostile targets neutralized.</p>
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
                  onClick={() => startTpsGame(wave + 1)}
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
        gameMode="TPS"
        activeModules={activeModules}
        onToggleModuleEquip={toggleModuleEquip}
      />
    </div>
  );
};
