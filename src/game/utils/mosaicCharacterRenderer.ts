import * as THREE from 'three';

export type MosaicCharacterType =
  | 'HERO_MECH_FRONT'
  | 'HERO_MECH_BACK'
  | 'VALKYRIE_GUNDAM'
  | 'GOLIATH_TITAN'
  | 'CYBER_DRONE'
  | 'SENTINEL_DROID'
  | 'STARFIGHTER_INTERCEPTOR'
  | 'STEALTH_CORVETTE'
  | 'CRUISER_BOSS'
  | 'PLASMA_RIFLE'
  | 'GAUSS_RAILGUN'
  | 'BEAM_SABER'
  | 'CYBER_PILOT'
  | 'MECH_ARMOR'
  | 'ROMAN_CYBER_MOSAIC'
  | 'DEEP_SPACE_NEBULA';

export interface MosaicTextureOptions {
  width?: number;
  height?: number;
  tileStyle?: 'ROMAN_STONE' | 'QUANTUM_TRANSISTOR' | 'GLYPH_CIPHER' | 'NEON_CIRCUIT';
  primaryGlow?: string;
  secondaryGlow?: string;
  groutIntensity?: number;
  tileSize?: number;
  preservePaintingDetail?: boolean; // Keep high-res hand-drawn painterly brushwork with mosaic overlay
}

// Map character types to high-resolution concept art images
export const CHARACTER_IMAGE_ASSETS: Record<MosaicCharacterType, string> = {
  HERO_MECH_FRONT: '/images/player_mech_hero_1787187990637.jpg',
  HERO_MECH_BACK: '/images/player_mech_rear_1787188006708.jpg',
  VALKYRIE_GUNDAM: '/images/valkyrie_gundam_1787434609815.jpg',
  GOLIATH_TITAN: '/images/enemy_tps_mech_1787090446411.jpg',
  CYBER_DRONE: '/images/enemy_drone_fighter_1787090400681.jpg',
  SENTINEL_DROID: '/images/enemy_fps_sentinel_1787090428781.jpg',
  STARFIGHTER_INTERCEPTOR: '/images/space_starfighter_hero_1787089887255.jpg',
  STEALTH_CORVETTE: '/images/stealth_corvette_1787434635548.jpg',
  CRUISER_BOSS: '/images/enemy_cruiser_boss_1787090414452.jpg',
  PLASMA_RIFLE: '/images/cyber_plasma_rifle_1787089913135.jpg',
  GAUSS_RAILGUN: '/images/gauss_railgun_1787434622054.jpg',
  BEAM_SABER: '/images/beam_saber_1787434660618.jpg',
  CYBER_PILOT: '/images/cyber_pilot_hero_1787089924400.jpg',
  MECH_ARMOR: '/images/cyber_mech_armor_1787089900058.jpg',
  ROMAN_CYBER_MOSAIC: '/images/roman_cyber_mosaic_1787188021928.jpg',
  DEEP_SPACE_NEBULA: '/images/deep_space_nebula_1787434647356.jpg',
};

// Global Image Cache for fast, zero-lag character texture instantiation
const imageCache: Map<string, HTMLImageElement> = new Map();

function preloadImage(src: string): HTMLImageElement {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  imageCache.set(src, img);
  return img;
}

// Eagerly preload all character image assets
if (typeof window !== 'undefined') {
  Object.values(CHARACTER_IMAGE_ASSETS).forEach((src) => {
    preloadImage(src);
  });
}

/**
 * Procedural Vector Fallback Drawing for Cyber / Roman Character Silhouettes
 */
function drawCharacterVectorToCanvas(
  ctx: CanvasRenderingContext2D,
  type: MosaicCharacterType,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;

  if (type === 'HERO_MECH_FRONT' || type === 'HERO_MECH_BACK' || type === 'MECH_ARMOR') {
    const isBack = type === 'HERO_MECH_BACK';

    // Outer Shoulder Pauldrons
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy - 80);
    ctx.lineTo(cx - 80, cy - 140);
    ctx.lineTo(cx - 50, cy - 70);
    ctx.lineTo(cx - 130, cy - 20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 160, cy - 80);
    ctx.lineTo(cx + 80, cy - 140);
    ctx.lineTo(cx + 50, cy - 70);
    ctx.lineTo(cx + 130, cy - 20);
    ctx.closePath();
    ctx.fill();

    // Heavy Torso Chassis
    ctx.fillStyle = '#0f2238';
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy - 120);
    ctx.lineTo(cx + 80, cy - 120);
    ctx.lineTo(cx + 95, cy + 40);
    ctx.lineTo(cx + 55, cy + 100);
    ctx.lineTo(cx - 55, cy + 100);
    ctx.lineTo(cx - 95, cy + 40);
    ctx.closePath();
    ctx.fill();

    // Chest Plating / Reactor Core
    ctx.fillStyle = '#00f0ff';
    if (!isBack) {
      // Front: Hexagonal Plasma Core & Visor
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 36, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Visor
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 35, cy - 95, 70, 14);
    } else {
      // Back: Dual Reactor Core Vents & Plasma Thrusters
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(cx - 50, cy - 50, 32, 65);
      ctx.fillRect(cx + 18, cy - 50, 32, 65);

      // Supercharger exhaust nozzles
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(cx - 34, cy + 25, 14, 0, Math.PI * 2);
      ctx.arc(cx + 34, cy + 25, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Bipedal Legs
    ctx.fillStyle = '#0b1626';
    ctx.fillRect(cx - 75, cy + 100, 48, 120);
    ctx.fillRect(cx + 27, cy + 100, 48, 120);

    // Hydraulic Knee & Foot Clamps
    ctx.fillStyle = '#00a3cc';
    ctx.fillRect(cx - 82, cy + 205, 62, 22);
    ctx.fillRect(cx + 20, cy + 205, 62, 22);

    // Shoulder Cannon Weapon Pod
    ctx.fillStyle = '#223344';
    ctx.fillRect(cx + 85, cy - 145, 26, 90);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(cx + 90, cy - 155, 16, 20);

  } else if (type === 'GOLIATH_TITAN' || type === 'CRUISER_BOSS') {
    // Heavy Crimson Rogue Goliath Titan Mech
    ctx.fillStyle = '#4a0815';
    ctx.beginPath();
    ctx.moveTo(cx - 200, cy - 120);
    ctx.lineTo(cx - 100, cy - 190);
    ctx.lineTo(cx + 100, cy - 190);
    ctx.lineTo(cx + 200, cy - 120);
    ctx.lineTo(cx + 130, cy + 60);
    ctx.lineTo(cx - 130, cy + 60);
    ctx.closePath();
    ctx.fill();

    // Crimson Eye Visor
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 110);
    ctx.lineTo(cx + 60, cy - 110);
    ctx.lineTo(cx, cy - 70);
    ctx.closePath();
    ctx.fill();

    // Central Dark Matter Energy Core
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 45, 0, Math.PI * 2);
    ctx.fill();

    // Quad-Piston Legs
    ctx.fillStyle = '#26040b';
    ctx.fillRect(cx - 120, cy + 60, 70, 150);
    ctx.fillRect(cx + 50, cy + 60, 70, 150);
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(cx - 135, cy + 190, 100, 30);
    ctx.fillRect(cx + 35, cy + 190, 100, 30);

  } else if (type === 'CYBER_DRONE') {
    // Sleek Tri-Rotor Recon Drone
    ctx.fillStyle = '#0a2233';
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const wx = cx + Math.cos(angle) * 120;
      const wy = cy + Math.sin(angle) * 120;

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(wx, wy);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(wx, wy, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'SENTINEL_DROID') {
    // Floating Hexagonal Combat Sentinel
    ctx.fillStyle = '#261233';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = cx + Math.cos(a) * 90;
      const hy = cy + Math.sin(a) * 90;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d946ef';
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(cx - 45, cy - 8, 90, 16);

  } else if (type === 'STARFIGHTER_INTERCEPTOR') {
    // Aerodynamic Cyber Space Interceptor
    ctx.fillStyle = '#0f243a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 180);
    ctx.lineTo(cx + 40, cy - 40);
    ctx.lineTo(cx + 170, cy + 80);
    ctx.lineTo(cx + 120, cy + 120);
    ctx.lineTo(cx + 40, cy + 90);
    ctx.lineTo(cx, cy + 130);
    ctx.lineTo(cx - 40, cy + 90);
    ctx.lineTo(cx - 120, cy + 120);
    ctx.lineTo(cx - 170, cy + 80);
    ctx.lineTo(cx - 40, cy - 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(cx - 175, cy + 20, 12, 70);
    ctx.fillRect(cx + 163, cy + 20, 12, 70);

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 110);
    ctx.lineTo(cx + 22, cy - 20);
    ctx.lineTo(cx - 22, cy - 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(cx - 28, cy + 105, 14, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy + 105, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'PLASMA_RIFLE') {
    // Cyber Plasma Rifle Vector
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 140, cy - 40, 280, 80);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(cx - 120, cy - 15, 240, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 100, cy - 8, 50, 16);
  } else {
    // Default portrait / mosaic
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * High-Quality Silhouette Cutout & Roman Mosaic Processor for Hand-Drawn Artwork
 */
function renderHandDrawnMosaicToCanvas(
  outCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  options: MosaicTextureOptions = {}
) {
  const tileSize = options.tileSize || 3;
  const tileStyle = options.tileStyle || 'ROMAN_STONE';
  const groutIntensity = options.groutIntensity ?? 50;
  const primaryGlow = options.primaryGlow || '#00f0ff';

  // Step 1: Draw hand-drawn source image to an offscreen buffer
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;
  offCtx.clearRect(0, 0, w, h);

  // Maintain aspect ratio and center image
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = w / h;
  let drawW = w;
  let drawH = h;
  let drawX = 0;
  let drawY = 0;

  if (imgAspect > canvasAspect) {
    drawW = w;
    drawH = w / imgAspect;
    drawY = (h - drawH) / 2;
  } else {
    drawH = h;
    drawW = h * imgAspect;
    drawX = (w - drawW) / 2;
  }

  offCtx.drawImage(img, drawX, drawY, drawW, drawH);
  const srcData = offCtx.getImageData(0, 0, w, h).data;

  // Clear output canvas
  outCtx.clearRect(0, 0, w, h);

  const cols = Math.ceil(w / tileSize);
  const rows = Math.ceil(h / tileSize);
  const grout = (groutIntensity / 100) * 0.75;
  const tileDrawW = Math.max(1, tileSize - grout);
  const tileDrawH = Math.max(1, tileSize - grout);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;

      const sampleX = Math.min(w - 1, Math.floor(x + tileSize / 2));
      const sampleY = Math.min(h - 1, Math.floor(y + tileSize / 2));
      const idx = (sampleY * w + sampleX) * 4;

      const red = srcData[idx];
      const green = srcData[idx + 1];
      const blue = srcData[idx + 2];
      const initialAlpha = srcData[idx + 3];

      if (initialAlpha < 10) continue;

      // Smart Foreground Character Silhouette Masking (Chroma/Dark Keying)
      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const distFromCenter = Math.hypot((sampleX - w / 2) / (w / 2), (sampleY - h / 2) / (h / 2));

      // Calculate opacity: background space/studio borders fade away; character armor & glows stay solid
      let alpha = 1.0;
      if (brightness < 18 && distFromCenter > 0.45) {
        alpha = 0.0;
      } else if (brightness < 32 && distFromCenter > 0.6) {
        alpha = Math.max(0, (brightness - 18) / 14);
      } else if (brightness < 22) {
        alpha = Math.max(0.15, brightness / 22);
      }

      if (alpha <= 0.02) continue;

      // Enhance Hand-Drawn Color Saturation & Micro-Tessera Variation
      const noise = ((c * 23 + r * 41) % 15) - 7;
      const finalR = Math.max(0, Math.min(255, red + noise));
      const finalG = Math.max(0, Math.min(255, green + noise));
      const finalB = Math.max(0, Math.min(255, blue + noise));

      outCtx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`;

      if (tileStyle === 'ROMAN_STONE') {
        // Authentic Level 4 Roman Tesserae Stone Block
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);

        // Sub-pixel Stone Chamfer / Bevel Highlight
        if (brightness > 60) {
          outCtx.fillStyle = `rgba(255, 255, 255, ${0.18 * (brightness / 255) * alpha})`;
          outCtx.fillRect(x, y, tileDrawW, 0.9);
          outCtx.fillRect(x, y, 0.9, tileDrawH);
        }
      } else if (tileStyle === 'QUANTUM_TRANSISTOR') {
        // Quantum Transistor Matrix with Gate Micro-dot
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
        if (brightness > 110) {
          outCtx.fillStyle = primaryGlow;
          outCtx.fillRect(x + tileDrawW / 2 - 0.5, y + tileDrawH / 2 - 0.5, 1, 1);
        }
      } else {
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
      }
    }
  }
}

/**
 * Transforms any character type or hand-drawn artwork into an authentic Level 4 Roman Mosaic Texture
 */
export function createLevel4MosaicTexture(
  type: MosaicCharacterType,
  options: MosaicTextureOptions = {}
): THREE.CanvasTexture {
  const w = options.width || 512;
  const h = options.height || 512;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

  // Create Three.js texture handle
  const texture = new THREE.CanvasTexture(outCanvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // First draw high-fidelity procedural vector fallback
  drawCharacterVectorToCanvas(outCtx, type, w, h);
  texture.needsUpdate = true;

  // Then load & render the authentic hand-drawn concept artwork
  const assetSrc = CHARACTER_IMAGE_ASSETS[type];
  if (assetSrc) {
    const img = preloadImage(assetSrc);

    const applyHandDrawnArt = () => {
      renderHandDrawnMosaicToCanvas(outCtx, img, w, h, options);
      texture.needsUpdate = true;
    };

    if (img.complete && img.naturalWidth > 0) {
      applyHandDrawnArt();
    } else {
      img.onload = applyHandDrawnArt;
    }
  }

  return texture;
}

/**
 * Creates a Pristine Level-4 Mosaic Character 3D Mesh without clunky box underlays
 */
export function createPristineMosaicCharacter(
  type: 'HERO_MECH' | 'GOLIATH' | 'CYBER_DRONE' | 'SENTINEL',
  materials: {
    heroFrontTexture: THREE.CanvasTexture;
    heroBackTexture: THREE.CanvasTexture;
    goliathTexture: THREE.CanvasTexture;
    droneTexture: THREE.CanvasTexture;
    sentinelTexture?: THREE.CanvasTexture;
  }
): THREE.Group {
  const root = new THREE.Group();

  if (type === 'HERO_MECH') {
    const torsoGroup = new THREE.Group();
    const legsGroup = new THREE.Group();

    // Dual-Sided High-Resolution Level 4 Roman Mosaic Billboard Core
    const planeGeo = new THREE.PlaneGeometry(3.0, 3.4);

    // Front Mosaic Plaque
    const frontMat = new THREE.MeshStandardMaterial({
      map: materials.heroFrontTexture,
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.25,
      metalness: 0.85,
      side: THREE.FrontSide,
    });
    const frontMesh = new THREE.Mesh(planeGeo, frontMat);
    frontMesh.position.set(0, 1.7, 0.02);
    torsoGroup.add(frontMesh);

    // Rear Mosaic Plaque with Thruster Ports
    const backMat = new THREE.MeshStandardMaterial({
      map: materials.heroBackTexture,
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.25,
      metalness: 0.85,
      side: THREE.BackSide,
    });
    const backMesh = new THREE.Mesh(planeGeo, backMat);
    backMesh.position.set(0, 1.7, -0.02);
    torsoGroup.add(backMesh);

    // 3D Level-4 Mosaic Glowing Reactor Core
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    coreMesh.position.set(0, 1.55, 0.06);
    torsoGroup.add(coreMesh);

    // Twin Level-4 Plasma Thruster Nozzles
    const leftThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.32, 1.6, -0.15);
    torsoGroup.add(leftThruster);

    const rightThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.32, 1.6, -0.15);
    torsoGroup.add(rightThruster);

    // Shoulder Laser Cannon
    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, emissive: 0x003355 })
    );
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0.55, 1.75, 0.2);
    torsoGroup.add(cannon);

    // Laser Sight Guide
    const laserSight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 22, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 })
    );
    laserSight.rotation.x = Math.PI / 2;
    laserSight.position.set(0.55, 1.75, -11);
    torsoGroup.add(laserSight);

    // Ground Shadow Projector
    const shadowDisk = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
    );
    shadowDisk.rotation.x = -Math.PI / 2;
    shadowDisk.position.y = 0.02;
    root.add(shadowDisk);

    root.add(torsoGroup);
    root.add(legsGroup);
    return root;
  }

  if (type === 'GOLIATH') {
    // Pure Level 4 Roman Mosaic Goliath Boss Mech
    const goliathMat = new THREE.MeshStandardMaterial({
      map: materials.goliathTexture,
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.25,
      metalness: 0.85,
      side: THREE.DoubleSide,
    });
    const goliathMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), goliathMat);
    goliathMesh.position.y = 2.4;
    root.add(goliathMesh);

    // Central Pulsing Red Core
    const redCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0044 })
    );
    redCore.position.set(0, 2.3, 0.05);
    root.add(redCore);

    // Shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return root;
  }

  // CYBER_DRONE / SENTINEL
  const droneMat = new THREE.MeshStandardMaterial({
    map: type === 'SENTINEL' && materials.sentinelTexture ? materials.sentinelTexture : materials.droneTexture,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.2,
    metalness: 0.9,
    side: THREE.DoubleSide,
  });
  const droneMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), droneMat);
  droneMesh.position.y = 1.3;
  root.add(droneMesh);

  const droneCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshBasicMaterial({ color: type === 'SENTINEL' ? 0xd946ef : 0x00f0ff })
  );
  droneCore.position.set(0, 1.3, 0.02);
  root.add(droneCore);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return root;
}

/**
 * Convolution filter execution on canvas ImageData (Sharpen, Unsharp Mask, Soft Blur, Edge Detection)
 */
export function applyConvolutionFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kernel: number[],
  factor: number = 1,
  bias: number = 0
): void {
  const srcImageData = ctx.getImageData(0, 0, width, height);
  const src = srcImageData.data;
  const outputImageData = ctx.createImageData(width, height);
  const dst = outputImageData.data;

  const kSize = Math.round(Math.sqrt(kernel.length));
  const halfK = Math.floor(kSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let aSum = 0;

      const dstIdx = (y * width + x) * 4;
      const centerAlpha = src[dstIdx + 3];

      if (centerAlpha < 5) {
        dst[dstIdx] = 0;
        dst[dstIdx + 1] = 0;
        dst[dstIdx + 2] = 0;
        dst[dstIdx + 3] = 0;
        continue;
      }

      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - halfK));
          const py = Math.min(height - 1, Math.max(0, y + ky - halfK));
          const srcIdx = (py * width + px) * 4;
          const kVal = kernel[ky * kSize + kx];

          r += src[srcIdx] * kVal;
          g += src[srcIdx + 1] * kVal;
          b += src[srcIdx + 2] * kVal;
          aSum += src[srcIdx + 3] * kVal;
        }
      }

      dst[dstIdx] = Math.max(0, Math.min(255, r * factor + bias));
      dst[dstIdx + 1] = Math.max(0, Math.min(255, g * factor + bias));
      dst[dstIdx + 2] = Math.max(0, Math.min(255, b * factor + bias));
      dst[dstIdx + 3] = Math.max(0, Math.min(255, centerAlpha)); // Keep center alpha to avoid fringing
    }
  }

  ctx.putImageData(outputImageData, 0, 0);
}

// Common Convolution Kernels
export const SHARPEN_KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0];
export const SHARP_VECTOR_KERNEL = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
export const SOFT_MOSAIC_SMOOTH_KERNEL = [
  1 / 16, 2 / 16, 1 / 16,
  2 / 16, 4 / 16, 2 / 16,
  1 / 16, 2 / 16, 1 / 16,
];
export const UNSHARP_MASK_KERNEL = [
  -1 / 8, -1 / 8, -1 / 8,
  -1 / 8, 2, -1 / 8,
  -1 / 8, -1 / 8, -1 / 8,
];

/**
 * AI-driven upscaling function that uses continuous bilinear interpolation
 * combined with an adaptive bilateral noise reduction filter to smooth transitions
 * between mosaic tiles when viewed in HD modes (128x128, 256x256, 512x512, 1024x1024)
 * while preserving silhouette edge clarity.
 */
export function applyAiBilinearUpscaleWithNoiseReduction(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  options: {
    noiseReductionStrength?: number; // 0 (raw) to 1 (max smoothing)
    preserveEdges?: boolean;
  } = {}
): HTMLCanvasElement {
  const noiseStrength = options.noiseReductionStrength ?? 0.65;
  const preserveEdges = options.preserveEdges ?? true;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImageData = outCtx.createImageData(targetWidth, targetHeight);
  const outData = outImageData.data;

  // 1. Bilinear Interpolation Pass
  const xRatio = (srcW - 1) / Math.max(1, targetWidth - 1);
  const yRatio = (srcH - 1) / Math.max(1, targetHeight - 1);

  // Temporary buffer for bilinear interpolated pixels
  const tempBuf = new Float32Array(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y++) {
    const srcY = y * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const yWeight = srcY - y0;

    for (let x = 0; x < targetWidth; x++) {
      const srcX = x * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const xWeight = srcX - x0;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      const outIdx = (y * targetWidth + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcData[idx00 + c] * (1 - xWeight) + srcData[idx10 + c] * xWeight;
        const btm = srcData[idx01 + c] * (1 - xWeight) + srcData[idx11 + c] * xWeight;
        tempBuf[outIdx + c] = top * (1 - yWeight) + btm * yWeight;
      }
    }
  }

  // 2. Bilateral Adaptive Noise Reduction Filter Pass
  // Smooths micro-tessera grout noise without blurring crisp silhouette contours
  const colorSimilaritySigma = 45 * (1.1 - noiseStrength); // Lower sigma = more edge-preserving
  const invSigma2 = 1.0 / (2 * colorSimilaritySigma * colorSimilaritySigma);

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const centerIdx = (y * targetWidth + x) * 4;
      const cR = tempBuf[centerIdx];
      const cG = tempBuf[centerIdx + 1];
      const cB = tempBuf[centerIdx + 2];
      const cA = tempBuf[centerIdx + 3];

      if (cA < 10) {
        outData[centerIdx] = 0;
        outData[centerIdx + 1] = 0;
        outData[centerIdx + 2] = 0;
        outData[centerIdx + 3] = 0;
        continue;
      }

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumW = 0;

      // 3x3 adaptive bilateral sampling window
      for (let dy = -1; dy <= 1; dy++) {
        const ny = Math.min(targetHeight - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.min(targetWidth - 1, Math.max(0, x + dx));
          const nIdx = (ny * targetWidth + nx) * 4;

          const nR = tempBuf[nIdx];
          const nG = tempBuf[nIdx + 1];
          const nB = tempBuf[nIdx + 2];
          const nA = tempBuf[nIdx + 3];

          if (nA < 10) continue;

          // Spatial distance weight
          const spatialDistSq = dx * dx + dy * dy;
          const spatialWeight = Math.exp(-spatialDistSq / 4);

          // Color similarity distance weight
          const colorDistSq = (nR - cR) * (nR - cR) + (nG - cG) * (nG - cG) + (nB - cB) * (nB - cB);
          const rangeWeight = Math.exp(-colorDistSq * invSigma2);

          const weight = spatialWeight * rangeWeight;
          sumR += nR * weight;
          sumG += nG * weight;
          sumB += nB * weight;
          sumW += weight;
        }
      }

      if (sumW > 0) {
        const filteredR = sumR / sumW;
        const filteredG = sumG / sumW;
        const filteredB = sumB / sumW;

        // Blend filtered output with raw interpolated pixel based on noise strength
        outData[centerIdx] = Math.round(cR * (1 - noiseStrength) + filteredR * noiseStrength);
        outData[centerIdx + 1] = Math.round(cG * (1 - noiseStrength) + filteredG * noiseStrength);
        outData[centerIdx + 2] = Math.round(cB * (1 - noiseStrength) + filteredB * noiseStrength);
        outData[centerIdx + 3] = Math.round(cA);
      } else {
        outData[centerIdx] = Math.round(cR);
        outData[centerIdx + 1] = Math.round(cG);
        outData[centerIdx + 2] = Math.round(cB);
        outData[centerIdx + 3] = Math.round(cA);
      }
    }
  }

  outCtx.putImageData(outImageData, 0, 0);
  return outCanvas;
}

/**
 * Detail Enhancement Processor supporting 'Soft Mosaic' vs 'Sharp Vector' rendering modes
 */
export function applyDetailEnhancementPass(
  canvas: HTMLCanvasElement,
  mode: 'SOFT_MOSAIC' | 'SHARP_VECTOR' | 'HYBRID_TESSERAE' | 'DETAIL_ENHANCED',
  strength: number = 50
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  if (mode === 'SHARP_VECTOR') {
    // Sharp Vector: High-frequency unsharp convolution + contour enhancement
    const k = SHARP_VECTOR_KERNEL;
    applyConvolutionFilter(ctx, w, h, k, 1, 0);
  } else if (mode === 'DETAIL_ENHANCED') {
    // Detail Enhanced: Standard 3x3 sharpen kernel with variable strength blend
    const factor = 1 + (strength / 100) * 0.8;
    applyConvolutionFilter(ctx, w, h, SHARPEN_KERNEL, factor, 0);
  } else if (mode === 'SOFT_MOSAIC') {
    // Soft Mosaic: Gaussian spatial smoothing kernel for painterly stone blending
    applyConvolutionFilter(ctx, w, h, SOFT_MOSAIC_SMOOTH_KERNEL, 1, 0);
  }

  return canvas;
}

/**
 * Generates an authentic Multi-Fidelity Mosaic Sprite scaling from 64x64 up to 1024x1024 (HD & Ultra-HD Beyond)
 * using the Level-4 Roman Mosaic Image Processor with adaptive tesserae stone synthesis, sub-pixel bevel highlights,
 * micro-grout structuring, neural palette grading, and detail enhancement convolution passes.
 */
export function generateMosaicSpriteMultiRes(
  type: MosaicCharacterType,
  resolution: number = 64,
  options: {
    dither?: boolean;
    palette?: 'CYBER_CYAN' | 'ROMAN_GOLD' | 'CRIMSON_NEO' | 'AMETHYST' | 'EMERALD_QUANTUM' | 'TITANIUM_WHITE' | 'ORIGINAL';
    tileStyle?: 'ROMAN_STONE' | 'QUANTUM_TRANSISTOR' | 'GLYPH_CIPHER' | 'NEON_CIRCUIT';
    groutIntensity?: number;
    customImage?: HTMLImageElement | null;
    hdrGlint?: boolean;
    renderMode?: 'SOFT_MOSAIC' | 'SHARP_VECTOR' | 'HYBRID_TESSERAE' | 'DETAIL_ENHANCED';
    detailEnhanceStrength?: number;
    aiBilinearUpscale?: boolean;
  } = {}
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = resolution >= 256;

  const src = CHARACTER_IMAGE_ASSETS[type];
  const img = options.customImage || (src ? preloadImage(src) : null);

  if (img && img.complete && img.naturalWidth > 0) {
    // 1. Draw source image to offscreen canvas maintaining aspect ratio
    const offCanvas = document.createElement('canvas');
    offCanvas.width = resolution;
    offCanvas.height = resolution;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW = resolution;
    let drawH = resolution;
    let drawX = 0;
    let drawY = 0;

    if (imgAspect > 1) {
      drawH = resolution / imgAspect;
      drawY = (resolution - drawH) / 2;
    } else {
      drawW = resolution * imgAspect;
      drawX = (resolution - drawW) / 2;
    }

    offCtx.drawImage(img, drawX, drawY, drawW, drawH);
    const srcData = offCtx.getImageData(0, 0, resolution, resolution).data;

    ctx.clearRect(0, 0, resolution, resolution);

    // 2. Adaptive Tesserae calculation based on target resolution
    // 64x64 -> 1px/tessera | 128x128 -> 1-2px | 256x256 -> 2px | 512x512 -> 3-4px | 1024x1024 -> 4-6px
    let tileSize = 1;
    if (resolution >= 1024) tileSize = 4;
    else if (resolution >= 512) tileSize = 3;
    else if (resolution >= 256) tileSize = 2;
    else if (resolution >= 128) tileSize = 1.5;
    else tileSize = 1;

    const tileStyle = options.tileStyle || 'ROMAN_STONE';
    const groutIntensity = options.groutIntensity ?? 40;
    const grout = (groutIntensity / 100) * (tileSize > 1 ? 0.6 : 0.2);
    const tileDrawW = Math.max(0.8, tileSize - grout);
    const tileDrawH = Math.max(0.8, tileSize - grout);

    const cols = Math.ceil(resolution / tileSize);
    const rows = Math.ceil(resolution / tileSize);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        const sampleX = Math.min(resolution - 1, Math.floor(x + tileSize / 2));
        const sampleY = Math.min(resolution - 1, Math.floor(y + tileSize / 2));
        const idx = (sampleY * resolution + sampleX) * 4;

        let red = srcData[idx];
        let green = srcData[idx + 1];
        let blue = srcData[idx + 2];
        const alpha = srcData[idx + 3];

        if (alpha < 15) continue;

        const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
        const distFromCenter = Math.hypot(
          (sampleX - resolution / 2) / (resolution / 2),
          (sampleY - resolution / 2) / (resolution / 2)
        );

        // Smart Silhouette Cutout for character isolation
        let finalAlpha = alpha / 255;
        if (brightness < 16 && distFromCenter > 0.46) {
          finalAlpha = 0.0;
        } else if (brightness < 28 && distFromCenter > 0.62) {
          finalAlpha = Math.max(0, (brightness - 16) / 12);
        } else if (brightness < 20) {
          finalAlpha = Math.max(0.2, brightness / 20);
        }

        if (finalAlpha <= 0.03) continue;

        // Neural Color Palette Grading
        if (options.palette === 'CYBER_CYAN') {
          const luma = brightness / 255;
          red = Math.round(luma * 12);
          green = Math.round(luma * 240);
          blue = Math.round(luma * 255);
        } else if (options.palette === 'ROMAN_GOLD') {
          const luma = brightness / 255;
          red = Math.round(luma * 255);
          green = Math.round(luma * 185);
          blue = Math.round(luma * 22);
        } else if (options.palette === 'CRIMSON_NEO') {
          const luma = brightness / 255;
          red = Math.round(luma * 255);
          green = Math.round(luma * 20);
          blue = Math.round(luma * 60);
        } else if (options.palette === 'EMERALD_QUANTUM') {
          const luma = brightness / 255;
          red = Math.round(luma * 10);
          green = Math.round(luma * 255);
          blue = Math.round(luma * 140);
        } else if (options.palette === 'AMETHYST') {
          const luma = brightness / 255;
          red = Math.round(luma * 220);
          green = Math.round(luma * 70);
          blue = Math.round(luma * 240);
        } else if (options.palette === 'TITANIUM_WHITE') {
          const luma = brightness / 255;
          red = Math.round(luma * 235);
          green = Math.round(luma * 245);
          blue = Math.round(luma * 255);
        }

        // Sub-pixel micro-stone noise
        const stoneNoise = ((c * 29 + r * 47) % 15) - 7;
        const finalR = Math.max(0, Math.min(255, red + stoneNoise));
        const finalG = Math.max(0, Math.min(255, green + stoneNoise));
        const finalB = Math.max(0, Math.min(255, blue + stoneNoise));

        // Draw Roman Tesserae Block
        ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalAlpha})`;
        ctx.fillRect(x, y, tileDrawW, tileDrawH);

        // High-Fidelity Details for HD resolutions (128, 256, 512, 1024)
        if (resolution >= 128) {
          if (tileStyle === 'ROMAN_STONE' && brightness > 70) {
            // Bevel Chamfer Specular Edge
            ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * (brightness / 255) * finalAlpha})`;
            ctx.fillRect(x, y, tileDrawW, Math.max(0.6, tileSize * 0.2));
            ctx.fillRect(x, y, Math.max(0.6, tileSize * 0.2), tileDrawH);
          } else if (tileStyle === 'QUANTUM_TRANSISTOR' && brightness > 90) {
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(x + tileDrawW / 2 - 0.5, y + tileDrawH / 2 - 0.5, 1, 1);
          }
        }
      }
    }
  } else {
    // Fallback procedural vector rendered at target resolution
    drawCharacterVectorToCanvas(ctx, type, resolution, resolution);
  }

  // 3. Detail Enhancement & Convolution Filtering Pass
  if (options.renderMode && options.renderMode !== 'HYBRID_TESSERAE') {
    applyDetailEnhancementPass(canvas, options.renderMode, options.detailEnhanceStrength ?? 50);
  }

  // 4. AI-driven Bilinear Upscaling with Noise Reduction for HD Modes (when enabled)
  if (options.aiBilinearUpscale && resolution >= 128) {
    const upscaled = applyAiBilinearUpscaleWithNoiseReduction(canvas, resolution, resolution, {
      noiseReductionStrength: 0.55,
      preserveEdges: true,
    });
    return upscaled;
  }

  return canvas;
}

/**
 * Generates an authentic 64x64 Retro Arcade Pixel Sprite with Roman Mosaic micro-tesserae clustering
 * (Backward compatibility wrapper around generateMosaicSpriteMultiRes)
 */
export function generatePixelSprite64(
  type: MosaicCharacterType,
  options: {
    dither?: boolean;
    palette?: 'CYBER_CYAN' | 'ROMAN_GOLD' | 'CRIMSON_NEO' | 'AMETHYST' | 'ORIGINAL';
    customImage?: HTMLImageElement | null;
  } = {}
): HTMLCanvasElement {
  return generateMosaicSpriteMultiRes(type, 64, options);
}


