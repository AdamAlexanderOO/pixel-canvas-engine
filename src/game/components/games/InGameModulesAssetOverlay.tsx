import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Box,
  Cpu,
  Shield,
  Zap,
  Flame,
  Radio,
  Sparkles,
  CheckCircle2,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  Eye,
  Info,
  RotateCw,
  Crosshair,
  ChevronRight,
  Database,
  Grid,
  Upload,
  Image as ImageIcon,
  Palette,
  Check,
  Trash2,
  Plus,
  Tv,
  Download,
  RefreshCw,
  Disc,
} from 'lucide-react';
import {
  GameModuleAsset,
  GameTargetMode,
  getModulesForGame,
} from '../../data/gameModulesMetadata';
import {
  HOLOGRAM_THEMES,
  HologramThemeId,
  HologramThemeConfig,
} from '../../data/overlayThemeConfig';
import {
  CustomCharacterAsset,
  CustomConversionSettings,
  DEFAULT_CONVERSION_SETTINGS,
  getAllCharacterAssets,
  getCustomCharacterAssets,
  saveCustomCharacterAsset,
  deleteCustomCharacterAsset,
  getActiveCharacterEquipment,
  setActiveCharacterEquipment,
  convertImageElementToMosaicCanvas,
  convertImageToPixelSprite64Canvas,
  createCustomAssetThreeTexture,
  ColorPaletteMode,
  MosaicTileStyle,
} from '../../utils/customCharacterStore';
import { createLevel4MosaicTexture } from '../../utils/mosaicCharacterRenderer';
import { sounds } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface InGameModulesAssetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameTargetMode;
  activeModules: GameModuleAsset[];
  onToggleModuleEquip: (moduleId: string) => void;
}

export const InGameModulesAssetOverlay: React.FC<InGameModulesAssetOverlayProps> = ({
  isOpen,
  onClose,
  gameMode,
  activeModules,
  onToggleModuleEquip,
}) => {
  // Navigation tabs: 2D Blueprints, 3D Hologram Assembly, or Custom Asset Upload Studio
  const [viewState, setViewState] = useState<'2D_BLUEPRINT' | '3D_ASSEMBLY' | 'CUSTOM_UPLOAD'>('3D_ASSEMBLY');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  
  // Holographic Color Schemes
  const [activeThemeId, setActiveThemeId] = useState<HologramThemeId>('CYBER_CYAN');
  const theme = HOLOGRAM_THEMES[activeThemeId];

  // 3D Hologram Controls
  const [isExploded3D, setIsExploded3D] = useState<boolean>(false);
  const [explodedDist, setExplodedDist] = useState<number>(1.8);
  const [showWireframe3D, setShowWireframe3D] = useState<boolean>(false);
  const [autoRotate3D, setAutoRotate3D] = useState<boolean>(true);
  const [glowBrightness, setGlowBrightness] = useState<number>(1.6);
  const [textureSourceMode, setTextureSourceMode] = useState<'MODULE_DEFAULT' | 'CUSTOM_TEXTURE'>('MODULE_DEFAULT');

  // Custom Image Upload & Character Conversion Studio State
  const [allAssets, setAllAssets] = useState<CustomCharacterAsset[]>(() => getAllCharacterAssets());
  const [selectedAssetId, setSelectedAssetId] = useState<string>('preset_valkyrie_gundam');
  const [customSettings, setCustomSettings] = useState<CustomConversionSettings>({ ...DEFAULT_CONVERSION_SETTINGS });
  const [customImageName, setCustomImageName] = useState<string>('My Custom Hero Asset');
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [activeEquip, setActiveEquip] = useState(() => getActiveCharacterEquipment());

  // 2D & Pixel Preview Canvases
  const previewMosaicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewPixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 3D Viewport refs
  const container3DRef = useRef<HTMLDivElement>(null);
  const engine3DRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    assemblyGroup: THREE.Group;
    particlesMesh: THREE.Points;
    pedestalRings: THREE.Group;
    lights: {
      ambient: THREE.AmbientLight;
      key: THREE.DirectionalLight;
      point1: THREE.PointLight;
      point2: THREE.PointLight;
    };
    gridHelper: THREE.GridHelper;
    animFrameId: number;
    isDragging: boolean;
    prevMouse: { x: number; y: number };
  } | null>(null);

  const availableModules = getModulesForGame(gameMode);
  const selectedModule =
    availableModules.find((m) => m.id === selectedModuleId) || availableModules[0];

  useEffect(() => {
    if (availableModules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(availableModules[0].id);
    }
  }, [availableModules, selectedModuleId]);

  // Refresh character assets when storage changes
  const refreshAssets = () => {
    setAllAssets(getAllCharacterAssets());
    setActiveEquip(getActiveCharacterEquipment());
  };

  const selectedAsset = allAssets.find((a) => a.id === selectedAssetId) || allAssets[0];

  // Update live 2D mosaic preview whenever selected asset or conversion settings change
  useEffect(() => {
    if (!selectedAsset) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = uploadedImageSrc || selectedAsset.imageUrl;

    img.onload = () => {
      // 1. Render 2D Mosaic Blueprint Preview
      if (previewMosaicCanvasRef.current) {
        const convertedMosaic = convertImageElementToMosaicCanvas(
          img,
          customSettings,
          256,
          256
        );
        const ctx = previewMosaicCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 256, 256);
          ctx.drawImage(convertedMosaic, 0, 0, 256, 256);
        }
      }

      // 2. Render 64x64 Pixel Sprite Preview for Retro Arcade
      if (previewPixelCanvasRef.current) {
        const convertedPixel = convertImageToPixelSprite64Canvas(img, customSettings);
        const ctx = previewPixelCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, 64, 64);
          ctx.drawImage(convertedPixel, 0, 0, 64, 64);
        }
      }
    };
  }, [selectedAsset, customSettings, uploadedImageSrc]);

  // Handle User Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImageSrc(dataUrl);
      setCustomImageName(file.name.replace(/\.[^/.]+$/, '').slice(0, 24));
      setIsConverting(true);
      setTimeout(() => {
        setIsConverting(false);
      }, 300);
      sounds.playClick(850);
      haptics.trigger('medium');
    };
    reader.readAsDataURL(file);
  };

  // Save Converted Custom Character Asset
  const handleSaveCustomAsset = () => {
    if (!uploadedImageSrc && !selectedAsset) return;

    const newId = 'custom_asset_' + Date.now();
    const newAsset: CustomCharacterAsset = {
      id: newId,
      name: customImageName || 'Custom Cyber Asset',
      sourceType: 'UPLOAD',
      imageUrl: uploadedImageSrc || selectedAsset.imageUrl,
      targetSlot: 'ALL',
      createdAt: Date.now(),
      settings: { ...customSettings },
      description: `Custom Level 4 Roman Mosaic conversion (${customSettings.tileStyle}, ${customSettings.palette} palette).`,
    };

    saveCustomCharacterAsset(newAsset);
    refreshAssets();
    setSelectedAssetId(newId);
    sounds.playClick(950);
    haptics.trigger('success');
  };

  // Deploy Asset to Active Game
  const handleDeployToActiveGame = (slot?: 'FPS' | 'TPS' | 'SPACE_SIM' | 'PIXEL' | 'ALL') => {
    const targetSlot = slot || gameMode;
    const assetToDeploy = selectedAsset;
    if (!assetToDeploy) return;

    const updates: Partial<typeof activeEquip> = {};
    if (targetSlot === 'FPS' || targetSlot === 'ALL') {
      updates.fpsWeaponAssetId = assetToDeploy.id;
    }
    if (targetSlot === 'TPS' || targetSlot === 'ALL') {
      updates.tpsMechAssetId = assetToDeploy.id;
    }
    if (targetSlot === 'SPACE_SIM' || targetSlot === 'ALL') {
      updates.spaceShipAssetId = assetToDeploy.id;
    }
    if (targetSlot === 'PIXEL' || targetSlot === 'ALL') {
      updates.pixelArcadeAssetId = assetToDeploy.id;
    }
    updates.arenaMuralAssetId = assetToDeploy.id;

    setActiveCharacterEquipment(updates);
    setActiveEquip(getActiveCharacterEquipment());
    setTextureSourceMode('CUSTOM_TEXTURE');
    sounds.playClick(1000);
    haptics.trigger('heavy');
  };

  // 3D Assembly Hologram Viewport Setup with Dynamic Theme & Color Scheme
  useEffect(() => {
    if (!isOpen || !container3DRef.current || viewState === '2D_BLUEPRINT') return;

    const width = container3DRef.current.clientWidth;
    const height = container3DRef.current.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bgHex);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(3.6, 2.6, 4.6);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    while (container3DRef.current.firstChild) {
      container3DRef.current.removeChild(container3DRef.current.firstChild);
    }
    container3DRef.current.appendChild(renderer.domElement);

    // Dynamic Themed Lighting Setup
    const ambientLight = new THREE.AmbientLight(theme.ambientNum, 1.8 * glowBrightness);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(theme.primaryNum, 2.2 * glowBrightness);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const point1 = new THREE.PointLight(theme.primaryNum, 3.5 * glowBrightness, 20);
    point1.position.set(-4, 3, -3);
    scene.add(point1);

    const point2 = new THREE.PointLight(theme.secondaryNum, 2.5 * glowBrightness, 18);
    point2.position.set(4, 1.5, 3);
    scene.add(point2);

    // Circular Hologram Pedestal with dual rotating tech rings
    const pedestalGroup = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.12, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: theme.pedestalColor,
      roughness: 0.25,
      metalness: 0.9,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.06;
    pedestalGroup.add(pedestal);

    // Outer Glowing Tech Ring
    const outerRingGeo = new THREE.RingGeometry(2.62, 2.74, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: theme.primaryNum,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.02;
    pedestalGroup.add(outerRing);

    // Inner Glowing Tech Ring
    const innerRingGeo = new THREE.RingGeometry(1.6, 1.68, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: theme.secondaryNum,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.03;
    pedestalGroup.add(innerRing);

    scene.add(pedestalGroup);

    // Themed Grid Helper
    const gridHelper = new THREE.GridHelper(5.6, 18, theme.gridPrimary, theme.gridSecondary);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Holographic Ambient Floating Motes / Tesserae Dust Particles
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 1] = Math.random() * 3.5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: theme.primaryNum,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
    });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // Main Assembly Group
    const assemblyGroup = new THREE.Group();
    scene.add(assemblyGroup);

    // Custom or Default Mosaic Texture
    let activeChassisTexture: THREE.Texture;
    if (textureSourceMode === 'CUSTOM_TEXTURE' && selectedAsset) {
      activeChassisTexture = createCustomAssetThreeTexture(selectedAsset);
    } else {
      activeChassisTexture = createLevel4MosaicTexture(selectedModule?.mosaicCharacterType || 'HERO_MECH_FRONT', {
        tileSize: 3,
        tileStyle: 'ROMAN_STONE',
        primaryGlow: theme.primaryColor,
        groutIntensity: 45,
      });
    }

    // Build Base Model Chassis according to Game Mode
    if (gameMode === 'FPS') {
      // 1st Person Plasma Carbine Base
      const rifleGeo = new THREE.BoxGeometry(0.32, 0.46, 2.3);
      const rifleMat = new THREE.MeshStandardMaterial({
        map: activeChassisTexture,
        color: new THREE.Color(theme.primaryColor),
        metalness: 0.9,
        roughness: 0.25,
        wireframe: showWireframe3D,
      });
      const rifleMesh = new THREE.Mesh(rifleGeo, rifleMat);
      rifleMesh.position.set(0, 1.2, 0);
      assemblyGroup.add(rifleMesh);

      const barrelGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.3, 16);
      barrelGeo.rotateX(Math.PI / 2);
      const barrelMesh = new THREE.Mesh(
        barrelGeo,
        new THREE.MeshStandardMaterial({ color: theme.primaryNum, emissive: theme.secondaryNum })
      );
      barrelMesh.position.set(0, 1.2, -1.35);
      assemblyGroup.add(barrelMesh);
    } else if (gameMode === 'TPS') {
      // 3rd Person Bipedal Titan Vanguard Frame
      const torsoGeo = new THREE.BoxGeometry(1.6, 2.1, 1.1);
      const torsoMat = new THREE.MeshStandardMaterial({
        map: activeChassisTexture,
        metalness: 0.88,
        roughness: 0.28,
        wireframe: showWireframe3D,
      });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.set(0, 1.8, 0);
      assemblyGroup.add(torsoMesh);

      // Core Reactor
      const coreGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const coreMesh = new THREE.Mesh(
        coreGeo,
        new THREE.MeshBasicMaterial({ color: theme.primaryNum })
      );
      coreMesh.position.set(0, 1.8, 0.58);
      assemblyGroup.add(coreMesh);
    } else {
      // Space Dogfight Starfighter Hull
      const hullGeo = new THREE.ConeGeometry(1.1, 4.2, 8);
      hullGeo.rotateX(Math.PI / 2);
      const hullMat = new THREE.MeshStandardMaterial({
        map: activeChassisTexture,
        metalness: 0.92,
        roughness: 0.22,
        wireframe: showWireframe3D,
      });
      const hullMesh = new THREE.Mesh(hullGeo, hullMat);
      hullMesh.position.set(0, 1.2, 0);
      assemblyGroup.add(hullMesh);

      const wingGeo = new THREE.BoxGeometry(4.2, 0.12, 1.8);
      const wingMesh = new THREE.Mesh(
        wingGeo,
        new THREE.MeshStandardMaterial({
          map: activeChassisTexture,
          color: theme.primaryNum,
          metalness: 0.85,
          roughness: 0.3,
        })
      );
      wingMesh.position.set(0, 1.15, 0.2);
      assemblyGroup.add(wingMesh);
    }

    // Mount all equipped modules with 3D socket metadata
    availableModules.forEach((mod) => {
      const isEq = activeModules.some((m) => m.id === mod.id);
      const isSel = mod.id === selectedModule?.id;
      if (!isEq && !isSel) return;

      const meta = mod.metadata3D;
      const modGroup = new THREE.Group();

      let posX = meta.position[0];
      let posY = meta.position[1];
      let posZ = meta.position[2];

      // Exploded View Expansion
      if (isExploded3D) {
        posX *= explodedDist;
        posY = 1.2 + (posY - 1.2) * (explodedDist * 0.9);
        posZ *= explodedDist;
      }

      modGroup.position.set(posX, posY, posZ);
      modGroup.rotation.set(meta.rotation[0], meta.rotation[1], meta.rotation[2]);

      let meshGeo: THREE.BufferGeometry;
      if (meta.geometryType === 'CYLINDER') {
        meshGeo = new THREE.CylinderGeometry(meta.scale[0], meta.scale[0], meta.scale[1], 16);
      } else if (meta.geometryType === 'SPHERE') {
        meshGeo = new THREE.SphereGeometry(meta.scale[0], 16, 16);
      } else if (meta.geometryType === 'MOSAIC_PLAQUE' && meta.customPlaqueSize) {
        meshGeo = new THREE.PlaneGeometry(meta.customPlaqueSize[0], meta.customPlaqueSize[1]);
      } else {
        meshGeo = new THREE.BoxGeometry(meta.scale[0], meta.scale[1], meta.scale[2]);
      }

      const modTex = createLevel4MosaicTexture(mod.mosaicCharacterType, {
        tileSize: 3,
        tileStyle: 'ROMAN_STONE',
        primaryGlow: theme.primaryColor,
        groutIntensity: 45,
      });

      const meshMat = new THREE.MeshStandardMaterial({
        map: modTex,
        color: isSel ? new THREE.Color(0xffffff) : new THREE.Color(theme.primaryColor),
        emissive: new THREE.Color(isSel ? theme.primaryNum : theme.secondaryNum),
        emissiveIntensity: isSel ? 1.4 * glowBrightness : 0.5 * glowBrightness,
        metalness: 0.88,
        roughness: 0.22,
        side: THREE.DoubleSide,
      });

      const moduleMesh = new THREE.Mesh(meshGeo, meshMat);
      modGroup.add(moduleMesh);

      // Selected Socket Halo & Beam Link
      if (isSel) {
        const haloGeo = new THREE.RingGeometry(0.22, 0.32, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: theme.accentGlowNum,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, 0, 0.06);
        modGroup.add(halo);

        const linkGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 1.2, 0),
          new THREE.Vector3(posX, posY, posZ),
        ]);
        const linkMat = new THREE.LineBasicMaterial({
          color: theme.primaryNum,
          transparent: true,
          opacity: 0.8,
        });
        const line = new THREE.Line(linkGeo, linkMat);
        assemblyGroup.add(line);
      }

      assemblyGroup.add(modGroup);
    });

    // Pointer Drag & Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const domElem = renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      assemblyGroup.rotation.y += dx * 0.012;
      assemblyGroup.rotation.x = Math.max(-0.6, Math.min(0.6, assemblyGroup.rotation.x + dy * 0.008));
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Render Loop
    let animId = 0;
    let clock = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.015;

      if (autoRotate3D && !isDragging) {
        assemblyGroup.rotation.y += 0.007;
      }

      // Rotate Pedestal Hologram Rings in opposing directions
      outerRing.rotation.z += 0.008;
      innerRing.rotation.z -= 0.012;

      // Animate floating particle dust
      const positions = particlesMesh.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.004;
        if (positions[i] > 3.5) positions[i] = 0;
      }
      particlesMesh.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    engine3DRef.current = {
      scene,
      camera,
      renderer,
      assemblyGroup,
      particlesMesh,
      pedestalRings: pedestalGroup,
      lights: { ambient: ambientLight, key: keyLight, point1, point2 },
      gridHelper,
      animFrameId: animId,
      isDragging,
      prevMouse,
    };

    return () => {
      cancelAnimationFrame(animId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
    };
  }, [
    isOpen,
    viewState,
    selectedModuleId,
    activeThemeId,
    isExploded3D,
    explodedDist,
    showWireframe3D,
    autoRotate3D,
    glowBrightness,
    textureSourceMode,
    selectedAssetId,
    activeModules,
    gameMode,
  ]);

  if (!isOpen) return null;

  return (
    <div
      id="in-game-modules-asset-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md font-mono text-neutral-200"
    >
      <div
        className={`relative w-full max-w-5xl ${theme.uiBg} border ${theme.uiBorder} rounded-xl ${theme.uiGlow} flex flex-col max-h-[94vh] overflow-hidden`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Database className={`w-5 h-5 ${theme.uiText} animate-pulse`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-widest text-white uppercase">
                  TACTICAL ARSENAL & CHARACTER ASSET STUDIO
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${theme.uiBadge}`}>
                  {gameMode} MODE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Level 4 Roman Mosaic Metallurgy, 3D Hologram Schemes & Custom Character Asset Converter.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: 2D Blueprint, 3D Assembly, Custom Image Studio */}
            <div className="flex items-center bg-black/70 p-1 border border-white/15 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setViewState('2D_BLUEPRINT');
                  sounds.playClick(600);
                  haptics.trigger('light');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  viewState === '2D_BLUEPRINT' ? theme.uiActiveButton : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2D BLUEPRINT</span>
                <span className="sm:hidden">2D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewState('3D_ASSEMBLY');
                  sounds.playClick(750);
                  haptics.trigger('medium');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  viewState === '3D_ASSEMBLY' ? theme.uiActiveButton : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D ASSEMBLY</span>
                <span className="sm:hidden">3D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewState('CUSTOM_UPLOAD');
                  sounds.playClick(850);
                  haptics.trigger('medium');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  viewState === 'CUSTOM_UPLOAD'
                    ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]'
                    : 'text-neutral-400 hover:text-purple-300'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                <span className="hidden sm:inline">CUSTOM ASSET STUDIO</span>
                <span className="sm:hidden">UPLOAD</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick(400);
                haptics.trigger('click');
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              title="Close Arsenal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hologram Color Schemes Selector Ribbon */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10 overflow-x-auto gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 shrink-0">
            <Palette className={`w-3.5 h-3.5 ${theme.uiText}`} />
            <span className="uppercase text-[11px]">Hologram Theme Schemes:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(Object.keys(HOLOGRAM_THEMES) as HologramThemeId[]).map((themeKey) => {
              const t = HOLOGRAM_THEMES[themeKey];
              const isCurrent = activeThemeId === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => {
                    setActiveThemeId(themeKey);
                    sounds.playClick(700);
                    haptics.trigger('light');
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
                    isCurrent
                      ? `${t.uiBadge} shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-105`
                      : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: t.primaryColor }}
                  />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Conditional based on viewState */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
          {viewState === 'CUSTOM_UPLOAD' ? (
            /* TAB 3: CUSTOM IMAGE UPLOAD & CHARACTER CONVERSION STUDIO */
            <div className="lg:col-span-12 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Side: Upload Controls & Parameter Tweaks (6 Cols) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="p-3.5 bg-black/60 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white uppercase">
                          Upload Custom Character / Texture Image
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-300">AUTO-MOSAIC CONVERSION</span>
                    </div>

                    {/* Drag & Drop / File Input Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-lg p-4 text-center cursor-pointer bg-purple-950/20 hover:bg-purple-950/30 transition-all space-y-1.5"
                    >
                      <ImageIcon className="w-7 h-7 text-purple-400 mx-auto animate-pulse" />
                      <div className="text-xs font-bold text-purple-200">
                        Click or Drag & Drop Image Here
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        Supports PNG, JPG, WEBP, SVG • Auto-quantized to Roman Tesserae
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Asset Name Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">
                        Character / Asset Name
                      </label>
                      <input
                        type="text"
                        value={customImageName}
                        onChange={(e) => setCustomImageName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-black/70 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                        placeholder="e.g. Roman Cyber Samurai"
                      />
                    </div>

                    {/* Preset Character Asset Quick Selection */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase flex items-center justify-between">
                        <span>Or Select from Preset Character Library</span>
                        <span className="text-purple-400">{allAssets.length} Presets Available</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/40 rounded border border-white/10">
                        {allAssets.map((asset) => {
                          const isSel = asset.id === selectedAssetId;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                setSelectedAssetId(asset.id);
                                setCustomImageName(asset.name);
                                setUploadedImageSrc(null);
                                setCustomSettings({ ...asset.settings });
                                sounds.playClick(650);
                              }}
                              className={`p-1 rounded border text-left transition-all ${
                                isSel
                                  ? 'border-purple-400 bg-purple-950/60 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                                  : 'border-white/10 bg-black/40 hover:border-white/25'
                              }`}
                              title={asset.name}
                            >
                              <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-full aspect-square object-cover rounded"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[8px] font-bold text-white truncate mt-0.5">
                                {asset.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conversion Parameter Controls */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
                      {/* Tile Style */}
                      <div>
                        <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                          Mosaic Tile Style
                        </label>
                        <select
                          value={customSettings.tileStyle}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              tileStyle: e.target.value as MosaicTileStyle,
                            })
                          }
                          className="w-full bg-black/80 border border-white/20 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="ROMAN_STONE">Roman Stone Tesserae</option>
                          <option value="QUANTUM_TRANSISTOR">Quantum Transistor</option>
                          <option value="NEON_CIRCUIT">Neon Cyber Circuit</option>
                          <option value="GLYPH_CIPHER">Ancient Glyph Cipher</option>
                        </select>
                      </div>

                      {/* Palette Mode */}
                      <div>
                        <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                          Color Palette
                        </label>
                        <select
                          value={customSettings.palette}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              palette: e.target.value as ColorPaletteMode,
                            })
                          }
                          className="w-full bg-black/80 border border-white/20 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="ORIGINAL">Original Artwork</option>
                          <option value="CYBER_CYAN">Cyber Cyan</option>
                          <option value="SOLAR_GOLD">Solar Imperial Gold</option>
                          <option value="CRIMSON_NEO">Crimson Valkyrie</option>
                          <option value="EMERALD_QUANTUM">Emerald Quantum</option>
                          <option value="AMETHYST_VOID">Amethyst Void</option>
                          <option value="TITANIUM_WHITE">Titanium Monolith</option>
                        </select>
                      </div>

                      {/* Tile Density Slider */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold mb-1">
                          <span>Tile Size: {customSettings.tileSize}px</span>
                          <span>(Tesserae Density)</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          step="1"
                          value={customSettings.tileSize}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              tileSize: Number(e.target.value),
                            })
                          }
                          className="w-full accent-purple-400"
                        />
                      </div>

                      {/* Grout Intensity */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold mb-1">
                          <span>Grout Line: {customSettings.groutIntensity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          step="5"
                          value={customSettings.groutIntensity}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              groutIntensity: Number(e.target.value),
                            })
                          }
                          className="w-full accent-purple-400"
                        />
                      </div>
                    </div>

                    {/* Silhouette Chroma Key Toggle */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-300">
                        <input
                          type="checkbox"
                          checked={customSettings.alphaCutout}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              alphaCutout: e.target.checked,
                            })
                          }
                          className="accent-purple-400 rounded"
                        />
                        <span>Auto-Silhouette Alpha Cutout (Isolate Character)</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSaveCustomAsset}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all shadow-[0_0_10px_rgba(217,70,239,0.4)] flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save to Presets</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Converted 2D Mosaic Blueprint & 64x64 Retro Sprite Previews + Deploy (6 Cols) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="p-3.5 bg-black/60 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-purple-400" />
                        Converted Live Character Previews
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">2D & RETRO 64x64 READY</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* 2D Level 4 Roman Mosaic Canvas */}
                      <div className="space-y-1 text-center">
                        <div className="text-[10px] text-neutral-400 uppercase font-bold">
                          Level 4 Roman Mosaic (512x512)
                        </div>
                        <div className="aspect-square bg-black rounded-lg border border-purple-500/40 overflow-hidden flex items-center justify-center relative shadow-inner">
                          <canvas
                            ref={previewMosaicCanvasRef}
                            width="256"
                            height="256"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      {/* 64x64 Retro Arcade Pixel Sprite Canvas */}
                      <div className="space-y-1 text-center">
                        <div className="text-[10px] text-neutral-400 uppercase font-bold">
                          Retro Arcade Sprite (64x64)
                        </div>
                        <div className="aspect-square bg-black rounded-lg border border-purple-500/40 overflow-hidden flex items-center justify-center relative shadow-inner">
                          <canvas
                            ref={previewPixelCanvasRef}
                            width="64"
                            height="64"
                            className="w-full h-full object-contain image-rendering-pixelated"
                          />
                          <div className="absolute top-1 right-1 px-1 py-0.2 bg-purple-900/80 text-purple-200 text-[8px] rounded font-bold">
                            ARCADE
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deploy Actions Bar */}
                    <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-lg space-y-2">
                      <div className="text-[11px] font-bold text-purple-200 uppercase">
                        Deploy Converted Asset to Active Games:
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleDeployToActiveGame('FPS')}
                          className="px-2 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 rounded font-bold text-[10px] transition-all shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                        >
                          FPS WEAPON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeployToActiveGame('TPS')}
                          className="px-2 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-400 text-amber-200 rounded font-bold text-[10px] transition-all shadow-[0_0_8px_rgba(255,183,0,0.2)]"
                        >
                          TPS MECH
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeployToActiveGame('SPACE_SIM')}
                          className="px-2 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-400 text-purple-200 rounded font-bold text-[10px] transition-all shadow-[0_0_8px_rgba(217,70,239,0.2)]"
                        >
                          SPACE FIGHTER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeployToActiveGame('PIXEL')}
                          className="px-2 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-400 text-emerald-200 rounded font-bold text-[10px] transition-all shadow-[0_0_8px_rgba(0,255,136,0.2)]"
                        >
                          PIXEL ARCADE
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleDeployToActiveGame('ALL');
                          setViewState('3D_ASSEMBLY');
                        }}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 hover:opacity-90 text-white rounded font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(217,70,239,0.35)] flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-white animate-spin" />
                        <span>DEPLOY EVERYWHERE & VIEW IN 3D HOLOGRAM</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TABS 1 & 2: 2D BLUEPRINTS OR 3D HOLOGRAM ASSEMBLY */
            <>
              {/* Left Column: 2D Module Inventory Cards (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300 pb-1 border-b border-white/10">
                  <span className="uppercase flex items-center gap-1.5">
                    <Layers className={`w-3.5 h-3.5 ${theme.uiText}`} />
                    Available In-Game Modules ({availableModules.length})
                  </span>
                  <span className={`text-[10px] ${theme.uiText} font-normal`}>
                    {activeModules.filter((m) => m.gameMode === gameMode).length} EQUIPPED
                  </span>
                </div>

                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                  {availableModules.map((mod) => {
                    const isEquipped = activeModules.some((m) => m.id === mod.id);
                    const isSelected = mod.id === selectedModule.id;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          sounds.playClick(650);
                          haptics.trigger('light');
                        }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 items-start ${
                          isSelected
                            ? `${theme.uiBg} ${theme.uiBorder} shadow-[0_0_15px_rgba(255,255,255,0.15)]`
                            : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {/* Hand-Drawn Mosaic Image Thumbnail */}
                        <div className="relative w-16 h-16 rounded overflow-hidden border border-white/15 shrink-0 bg-black">
                          <img
                            src={mod.mosaicImageSrc}
                            alt={mod.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none mix-blend-overlay" />
                          <span className="absolute bottom-0 right-0 px-1 text-[8px] font-bold bg-black/80 text-cyan-300">
                            {mod.stats2D.tesseraCount}T
                          </span>
                        </div>

                        {/* Module Title & Stats Summary */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">{mod.name}</h4>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                                mod.rarity === 'ANCIENT_MOSAIC'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : mod.rarity === 'LEGENDARY'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : `${theme.uiBadge}`
                              }`}
                            >
                              {mod.shortCode}
                            </span>
                          </div>

                          <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span>{mod.category}</span>
                            <span>•</span>
                            <span className={`${theme.uiText} font-bold`}>
                              {mod.stats2D.primaryAttribute.label}: {mod.stats2D.primaryAttribute.value}
                            </span>
                          </div>

                          {/* Equip / Unequip Toggle Button */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                            <span className="text-[9px] text-neutral-400">
                              Power: {mod.stats2D.powerDrainMW} MW
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleModuleEquip(mod.id);
                                sounds.playClick(isEquipped ? 450 : 800);
                                haptics.trigger('medium');
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all flex items-center gap-1 ${
                                isEquipped
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-white/10 text-neutral-300 border border-white/20 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-3 h-3 ${isEquipped ? 'text-emerald-400' : 'text-neutral-400'}`}
                              />
                              <span>{isEquipped ? 'EQUIPPED' : 'EQUIP'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 2D Blueprint Schematic OR 3D Holographic Assembly View (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                {viewState === '2D_BLUEPRINT' ? (
                  /* 2D Blueprint Schematic View */
                  <div
                    className={`flex-1 bg-black/60 border ${theme.uiBorder} rounded-xl p-4 flex flex-col space-y-4`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${theme.uiText} uppercase tracking-widest`}>
                          2D BLUEPRINT METADATA & SPECS
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${theme.uiBadge}`}>
                          LEVEL {selectedModule.level}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        SOCKET: [{selectedModule.metadata3D.mountNode.toUpperCase()}]
                      </span>
                    </div>

                    {/* Hand-Drawn Mosaic Artwork Large Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative rounded-lg overflow-hidden border border-white/20 aspect-square bg-black">
                        <img
                          src={selectedModule.mosaicImageSrc}
                          alt={selectedModule.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 text-left">
                          <div className="text-xs font-bold text-white">{selectedModule.name}</div>
                          <div className={`text-[10px] ${theme.uiText} font-mono`}>
                            Hand-Drawn Mosaic Art Cutout (Level 4 Tesserae)
                          </div>
                        </div>
                      </div>

                      {/* 2D Technical Specifications Readout */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-neutral-900/80 border border-white/10 rounded-lg space-y-1">
                          <div className="text-[10px] text-neutral-400 uppercase font-bold">Tactical Lore</div>
                          <p className="text-[11px] text-neutral-300 leading-relaxed">
                            {selectedModule.lore}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-neutral-900/60 border border-white/5 rounded">
                            <div className="text-neutral-400 text-[9px] uppercase">Power Consumption</div>
                            <div className={`${theme.uiText} font-bold`}>
                              {selectedModule.stats2D.powerDrainMW} MW
                            </div>
                          </div>
                          <div className="p-2 bg-neutral-900/60 border border-white/5 rounded">
                            <div className="text-neutral-400 text-[9px] uppercase">Physical Mass</div>
                            <div className="text-purple-400 font-bold">
                              {selectedModule.stats2D.massKg} kg
                            </div>
                          </div>
                          <div className="p-2 bg-neutral-900/60 border border-white/5 rounded">
                            <div className="text-neutral-400 text-[9px] uppercase">Tessera Count</div>
                            <div className="text-amber-300 font-bold">
                              {selectedModule.stats2D.tesseraCount.toLocaleString()} stones
                            </div>
                          </div>
                          <div className="p-2 bg-neutral-900/60 border border-white/5 rounded">
                            <div className="text-neutral-400 text-[9px] uppercase">Grout Hardness</div>
                            <div className="text-emerald-400 font-bold">
                              {selectedModule.stats2D.groutHardness}/100 Mohs
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewState('3D_ASSEMBLY');
                          sounds.playClick(750);
                          haptics.trigger('medium');
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${theme.uiActiveButton}`}
                      >
                        <span>INITIALIZE 3D ASSEMBLY VIEW</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3D Holographic Assembly Viewport */
                  <div
                    className={`flex-1 bg-black/80 border ${theme.uiBorder} rounded-xl overflow-hidden flex flex-col`}
                  >
                    {/* 3D Viewport Controls Bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-white/10 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Box className={`w-4 h-4 ${theme.uiText} animate-spin`} />
                        <span className="font-bold text-white uppercase text-[11px]">
                          3D HOLOGRAPHIC CHASSIS MOUNT
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Exploded 3D View Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsExploded3D(!isExploded3D);
                            sounds.playClick(600);
                            haptics.trigger('light');
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                            isExploded3D
                              ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          EXPLODED 3D
                        </button>

                        {/* Wireframe Lattice Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowWireframe3D(!showWireframe3D);
                            sounds.playClick(600);
                            haptics.trigger('light');
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                            showWireframe3D
                              ? `${theme.uiBadge}`
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          WIREFRAME
                        </button>

                        {/* Auto-Rotation Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setAutoRotate3D(!autoRotate3D);
                            sounds.playClick(600);
                            haptics.trigger('light');
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                            autoRotate3D
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          AUTO-ORBIT
                        </button>

                        {/* Custom / Default Texture Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setTextureSourceMode(
                              textureSourceMode === 'MODULE_DEFAULT' ? 'CUSTOM_TEXTURE' : 'MODULE_DEFAULT'
                            );
                            sounds.playClick(650);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all flex items-center gap-1 ${
                            textureSourceMode === 'CUSTOM_TEXTURE'
                              ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                          title="Toggle Custom Upload Texture vs Default Module Texture"
                        >
                          <Disc className="w-3 h-3 text-purple-400" />
                          <span>{textureSourceMode === 'CUSTOM_TEXTURE' ? 'CUSTOM TX' : 'STOCK TX'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3D WebGL Canvas Container */}
                    <div
                      ref={container3DRef}
                      className="flex-1 w-full min-h-[380px] cursor-grab active:cursor-grabbing relative"
                    >
                      <div className={`absolute top-2 left-3 text-[10px] ${theme.uiText} pointer-events-none font-mono opacity-90`}>
                        <div>MOUNT: {selectedModule.metadata3D.mountNode.toUpperCase()}</div>
                        <div>THEME: {theme.name}</div>
                        <div>DRAG TO ORBIT • SCROLL/PINCH TO ZOOM</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Status Footer */}
        <div className="px-4 py-2.5 bg-black/90 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 ${theme.uiText} font-bold`}>
              <Sparkles className={`w-3.5 h-3.5 ${theme.uiText}`} />
              <span>ROMAN MOSAIC METALLURGY & CUSTOM ASSETS ACTIVE</span>
            </span>
            <span>•</span>
            <span>Press [M] in-game anytime</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick(400);
              haptics.trigger('click');
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded transition-colors uppercase tracking-wider ${theme.uiActiveButton}`}
          >
            CONFIRM & RETURN TO GAME
          </button>
        </div>
      </div>
    </div>
  );
};
