import * as THREE from 'three';
import { CHARACTER_IMAGE_ASSETS, MosaicCharacterType } from './mosaicCharacterRenderer';

export type CharacterTargetSlot =
  | 'ALL'
  | 'FPS_WEAPON'
  | 'TPS_MECH'
  | 'SPACE_STARFIGHTER'
  | 'PIXEL_SPRITE'
  | 'ARENA_MURAL';

export type MosaicTileStyle =
  | 'ROMAN_STONE'
  | 'QUANTUM_TRANSISTOR'
  | 'GLYPH_CIPHER'
  | 'NEON_CIRCUIT';

export type ColorPaletteMode =
  | 'ORIGINAL'
  | 'CYBER_CYAN'
  | 'SOLAR_GOLD'
  | 'CRIMSON_NEO'
  | 'EMERALD_QUANTUM'
  | 'AMETHYST_VOID'
  | 'TITANIUM_WHITE';

export interface CustomConversionSettings {
  tileSize: number; // 2 to 12
  tileStyle: MosaicTileStyle;
  groutIntensity: number; // 0 to 100
  primaryGlow: string;
  secondaryGlow: string;
  palette: ColorPaletteMode;
  alphaCutout: boolean; // Auto-cutout dark/studio borders for character silhouette
  preservePainterlyTone: boolean;
}

export interface CustomCharacterAsset {
  id: string;
  name: string;
  sourceType: 'UPLOAD' | 'PRESET';
  imageUrl: string; // Base64 data URL or asset path
  targetSlot: CharacterTargetSlot;
  createdAt: number;
  settings: CustomConversionSettings;
  pixelSpriteDataUrl?: string; // 64x64 pixel sprite cache
  description?: string;
}

export const DEFAULT_CONVERSION_SETTINGS: CustomConversionSettings = {
  tileSize: 4,
  tileStyle: 'ROMAN_STONE',
  groutIntensity: 40,
  primaryGlow: '#00f0ff',
  secondaryGlow: '#0066ff',
  palette: 'ORIGINAL',
  alphaCutout: true,
  preservePainterlyTone: true,
};

// Built-in High Quality Preset Character Assets
export const PRESET_CHARACTER_ASSETS: CustomCharacterAsset[] = [
  {
    id: 'preset_valkyrie_gundam',
    name: 'Valkyrie Gundam Striker',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.VALKYRIE_GUNDAM,
    targetSlot: 'ALL',
    createdAt: 1787000000000,
    description: 'High-mobility aerial assault chassis forged with Roman solar gold tesserae plating.',
    settings: {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      groutIntensity: 42,
      primaryGlow: '#ffb700',
      secondaryGlow: '#ff5500',
      palette: 'SOLAR_GOLD',
      alphaCutout: true,
      preservePainterlyTone: true,
    },
  },
  {
    id: 'preset_hero_mech',
    name: 'Centurion Vanguard Titan',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.HERO_MECH_FRONT,
    targetSlot: 'TPS_MECH',
    createdAt: 1787000000001,
    description: 'Heavy vanguard bipedal battle mech with energized tesserae breastplate and ion thrusters.',
    settings: {
      tileSize: 4,
      tileStyle: 'ROMAN_STONE',
      groutIntensity: 45,
      primaryGlow: '#00f0ff',
      secondaryGlow: '#0066ff',
      palette: 'CYBER_CYAN',
      alphaCutout: true,
      preservePainterlyTone: true,
    },
  },
  {
    id: 'preset_starfighter_hero',
    name: 'Solar Falcon Interceptor',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.STARFIGHTER_INTERCEPTOR,
    targetSlot: 'SPACE_STARFIGHTER',
    createdAt: 1787000000002,
    description: 'Hyper-velocity delta-wing starfighter with twin Gauss railgun nacelles and sub-light boost.',
    settings: {
      tileSize: 3,
      tileStyle: 'QUANTUM_TRANSISTOR',
      groutIntensity: 38,
      primaryGlow: '#00ffff',
      secondaryGlow: '#0088cc',
      palette: 'CYBER_CYAN',
      alphaCutout: true,
      preservePainterlyTone: true,
    },
  },
  {
    id: 'preset_cyber_pilot',
    name: 'Ronin Cyber Pilot',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.CYBER_PILOT,
    targetSlot: 'PIXEL_SPRITE',
    createdAt: 1787000000003,
    description: 'Elite neural-link fighter pilot avatar wearing ceremonial Roman cyber armor.',
    settings: {
      tileSize: 4,
      tileStyle: 'ROMAN_STONE',
      groutIntensity: 40,
      primaryGlow: '#ff0055',
      secondaryGlow: '#d946ef',
      palette: 'CRIMSON_NEO',
      alphaCutout: true,
      preservePainterlyTone: true,
    },
  },
  {
    id: 'preset_plasma_rifle',
    name: 'Helios Plasma Carbine',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.PLASMA_RIFLE,
    targetSlot: 'FPS_WEAPON',
    createdAt: 1787000000004,
    description: 'High-density micro-tesserae plasma containment weapon with superconducting rails.',
    settings: {
      tileSize: 3,
      tileStyle: 'NEON_CIRCUIT',
      groutIntensity: 40,
      primaryGlow: '#00f0ff',
      secondaryGlow: '#00ffff',
      palette: 'CYBER_CYAN',
      alphaCutout: true,
      preservePainterlyTone: true,
    },
  },
  {
    id: 'preset_roman_mural',
    name: 'Imperial Roman Cyber Mosaic',
    sourceType: 'PRESET',
    imageUrl: CHARACTER_IMAGE_ASSETS.ROMAN_CYBER_MOSAIC,
    targetSlot: 'ARENA_MURAL',
    createdAt: 1787000000005,
    description: 'Ancient Roman mosaic fresco restored with glowing cyan neural pathways and stone tesserae.',
    settings: {
      tileSize: 3,
      tileStyle: 'ROMAN_STONE',
      groutIntensity: 50,
      primaryGlow: '#ffb700',
      secondaryGlow: '#00f0ff',
      palette: 'ORIGINAL',
      alphaCutout: false,
      preservePainterlyTone: true,
    },
  },
];

const STORAGE_KEY_CUSTOM_ASSETS = 'aurora_custom_character_assets_v2';
const STORAGE_KEY_ACTIVE_EQUIP = 'aurora_active_character_equipment_v2';

export interface ActiveCharacterEquipment {
  fpsWeaponAssetId: string | null;
  tpsMechAssetId: string | null;
  spaceShipAssetId: string | null;
  pixelArcadeAssetId: string | null;
  arenaMuralAssetId: string | null;
}

const DEFAULT_EQUIPMENT: ActiveCharacterEquipment = {
  fpsWeaponAssetId: 'preset_plasma_rifle',
  tpsMechAssetId: 'preset_valkyrie_gundam',
  spaceShipAssetId: 'preset_starfighter_hero',
  pixelArcadeAssetId: 'preset_cyber_pilot',
  arenaMuralAssetId: 'preset_roman_mural',
};

// Listeners for reactive updates across games
type AssetChangeListener = () => void;
const listeners: Set<AssetChangeListener> = new Set();

export function subscribeToCustomAssetChanges(listener: AssetChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Error in asset change listener:', e);
    }
  });
}

// In-Memory Custom Asset Store
let customAssetsCache: CustomCharacterAsset[] | null = null;
let activeEquipmentCache: ActiveCharacterEquipment | null = null;

export function getCustomCharacterAssets(): CustomCharacterAsset[] {
  if (customAssetsCache) return customAssetsCache;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_ASSETS);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomCharacterAsset[];
        customAssetsCache = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom character assets from localStorage', e);
    }
  }

  customAssetsCache = [];
  return customAssetsCache;
}

export function getAllCharacterAssets(): CustomCharacterAsset[] {
  const custom = getCustomCharacterAssets();
  return [...custom, ...PRESET_CHARACTER_ASSETS];
}

export function saveCustomCharacterAsset(asset: CustomCharacterAsset): void {
  const existing = getCustomCharacterAssets();
  const index = existing.findIndex((a) => a.id === asset.id);

  let updated: CustomCharacterAsset[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = asset;
  } else {
    updated = [asset, ...existing];
  }

  customAssetsCache = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist custom asset to localStorage', e);
    }
  }

  notifyListeners();
}

export function deleteCustomCharacterAsset(id: string): void {
  const existing = getCustomCharacterAssets();
  const updated = existing.filter((a) => a.id !== id);
  customAssetsCache = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete custom asset from localStorage', e);
    }
  }

  // Also clean up active equipment if deleted asset was equipped
  const active = getActiveCharacterEquipment();
  let changed = false;
  const newEquip = { ...active };
  if (newEquip.fpsWeaponAssetId === id) { newEquip.fpsWeaponAssetId = null; changed = true; }
  if (newEquip.tpsMechAssetId === id) { newEquip.tpsMechAssetId = null; changed = true; }
  if (newEquip.spaceShipAssetId === id) { newEquip.spaceShipAssetId = null; changed = true; }
  if (newEquip.pixelArcadeAssetId === id) { newEquip.pixelArcadeAssetId = null; changed = true; }
  if (newEquip.arenaMuralAssetId === id) { newEquip.arenaMuralAssetId = null; changed = true; }

  if (changed) {
    setActiveCharacterEquipment(newEquip);
  } else {
    notifyListeners();
  }
}

export function getActiveCharacterEquipment(): ActiveCharacterEquipment {
  if (activeEquipmentCache) return activeEquipmentCache;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_EQUIP);
      if (stored) {
        const parsed = JSON.parse(stored) as ActiveCharacterEquipment;
        activeEquipmentCache = { ...DEFAULT_EQUIPMENT, ...parsed };
        return activeEquipmentCache;
      }
    } catch (e) {
      console.warn('Failed to load active equipment from localStorage', e);
    }
  }

  activeEquipmentCache = { ...DEFAULT_EQUIPMENT };
  return activeEquipmentCache;
}

export function setActiveCharacterEquipment(equip: Partial<ActiveCharacterEquipment>): void {
  const current = getActiveCharacterEquipment();
  const updated: ActiveCharacterEquipment = { ...current, ...equip };
  activeEquipmentCache = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_EQUIP, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save active equipment to localStorage', e);
    }
  }

  notifyListeners();
}

export function getEquippedAssetForSlot(
  slot: 'FPS_WEAPON' | 'TPS_MECH' | 'SPACE_STARFIGHTER' | 'PIXEL_SPRITE' | 'ARENA_MURAL'
): CustomCharacterAsset | null {
  const equip = getActiveCharacterEquipment();
  const all = getAllCharacterAssets();

  let assetId: string | null = null;
  if (slot === 'FPS_WEAPON') assetId = equip.fpsWeaponAssetId;
  else if (slot === 'TPS_MECH') assetId = equip.tpsMechAssetId;
  else if (slot === 'SPACE_STARFIGHTER') assetId = equip.spaceShipAssetId;
  else if (slot === 'PIXEL_SPRITE') assetId = equip.pixelArcadeAssetId;
  else if (slot === 'ARENA_MURAL') assetId = equip.arenaMuralAssetId;

  if (!assetId) return null;
  return all.find((a) => a.id === assetId) || null;
}

/**
 * High-Resolution Image to Roman Mosaic Canvas Conversion Engine
 */
export function convertImageElementToMosaicCanvas(
  img: HTMLImageElement,
  settings: CustomConversionSettings,
  targetWidth = 512,
  targetHeight = 512
): HTMLCanvasElement {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = targetWidth;
  offCanvas.height = targetHeight;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;

  // Aspect ratio calculations
  const imgAspect = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1);
  const canvasAspect = targetWidth / targetHeight;
  let drawW = targetWidth;
  let drawH = targetHeight;
  let drawX = 0;
  let drawY = 0;

  if (imgAspect > canvasAspect) {
    drawW = targetWidth;
    drawH = targetWidth / imgAspect;
    drawY = (targetHeight - drawH) / 2;
  } else {
    drawH = targetHeight;
    drawW = targetHeight * imgAspect;
    drawX = (targetWidth - drawW) / 2;
  }

  offCtx.drawImage(img, drawX, drawY, drawW, drawH);
  const srcData = offCtx.getImageData(0, 0, targetWidth, targetHeight).data;

  outCtx.clearRect(0, 0, targetWidth, targetHeight);

  const tileSize = Math.max(2, settings.tileSize);
  const cols = Math.ceil(targetWidth / tileSize);
  const rows = Math.ceil(targetHeight / tileSize);
  const grout = (settings.groutIntensity / 100) * 0.75;
  const tileDrawW = Math.max(1, tileSize - grout);
  const tileDrawH = Math.max(1, tileSize - grout);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;

      const sampleX = Math.min(targetWidth - 1, Math.floor(x + tileSize / 2));
      const sampleY = Math.min(targetHeight - 1, Math.floor(y + tileSize / 2));
      const idx = (sampleY * targetWidth + sampleX) * 4;

      let red = srcData[idx];
      let green = srcData[idx + 1];
      let blue = srcData[idx + 2];
      const initialAlpha = srcData[idx + 3];

      if (initialAlpha < 10) continue;

      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const distFromCenter = Math.hypot(
        (sampleX - targetWidth / 2) / (targetWidth / 2),
        (sampleY - targetHeight / 2) / (targetHeight / 2)
      );

      let alpha = 1.0;
      if (settings.alphaCutout) {
        if (brightness < 18 && distFromCenter > 0.45) {
          alpha = 0.0;
        } else if (brightness < 32 && distFromCenter > 0.6) {
          alpha = Math.max(0, (brightness - 18) / 14);
        } else if (brightness < 20) {
          alpha = Math.max(0.15, brightness / 20);
        }
      }

      if (alpha <= 0.02) continue;

      // Palette Remapping
      if (settings.palette === 'CYBER_CYAN') {
        const luma = brightness / 255;
        red = Math.round(luma * 10);
        green = Math.round(luma * 240);
        blue = Math.round(luma * 255);
      } else if (settings.palette === 'SOLAR_GOLD') {
        const luma = brightness / 255;
        red = Math.round(luma * 255);
        green = Math.round(luma * 183);
        blue = Math.round(luma * 20);
      } else if (settings.palette === 'CRIMSON_NEO') {
        const luma = brightness / 255;
        red = Math.round(luma * 255);
        green = Math.round(luma * 15);
        blue = Math.round(luma * 65);
      } else if (settings.palette === 'EMERALD_QUANTUM') {
        const luma = brightness / 255;
        red = Math.round(luma * 10);
        green = Math.round(luma * 255);
        blue = Math.round(luma * 136);
      } else if (settings.palette === 'AMETHYST_VOID') {
        const luma = brightness / 255;
        red = Math.round(luma * 217);
        green = Math.round(luma * 70);
        blue = Math.round(luma * 239);
      } else if (settings.palette === 'TITANIUM_WHITE') {
        const luma = brightness / 255;
        red = Math.round(luma * 230);
        green = Math.round(luma * 240);
        blue = Math.round(luma * 255);
      }

      // Micro-tesserae natural stone variation
      const noise = ((c * 23 + r * 41) % 15) - 7;
      const finalR = Math.max(0, Math.min(255, red + noise));
      const finalG = Math.max(0, Math.min(255, green + noise));
      const finalB = Math.max(0, Math.min(255, blue + noise));

      outCtx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`;

      if (settings.tileStyle === 'ROMAN_STONE') {
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
        if (brightness > 60) {
          outCtx.fillStyle = `rgba(255, 255, 255, ${0.18 * (brightness / 255) * alpha})`;
          outCtx.fillRect(x, y, tileDrawW, 0.9);
          outCtx.fillRect(x, y, 0.9, tileDrawH);
        }
      } else if (settings.tileStyle === 'QUANTUM_TRANSISTOR') {
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
        if (brightness > 100) {
          outCtx.fillStyle = settings.primaryGlow;
          outCtx.fillRect(x + tileDrawW / 2 - 0.5, y + tileDrawH / 2 - 0.5, 1, 1);
        }
      } else if (settings.tileStyle === 'NEON_CIRCUIT') {
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
        if (c % 3 === 0 || r % 3 === 0) {
          outCtx.fillStyle = settings.primaryGlow;
          outCtx.fillRect(x, y, tileDrawW, 0.5);
        }
      } else {
        outCtx.fillRect(x, y, tileDrawW, tileDrawH);
      }
    }
  }

  return outCanvas;
}

/**
 * Converts any custom uploaded image to an authentic Multi-Fidelity Mosaic Sprite
 * supporting 64x64, 128x128, 256x256, 512x512, and 1024x1024 Ultra-HD with Level-4 Roman Mosaic processing.
 */
export function convertImageToMultiResMosaicSpriteCanvas(
  img: HTMLImageElement,
  settings: CustomConversionSettings,
  resolution: number = 64
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = resolution >= 256;

  // Render to offscreen canvas preserving aspect ratio
  const offCanvas = document.createElement('canvas');
  offCanvas.width = resolution;
  offCanvas.height = resolution;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;

  const imgAspect = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1);
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

  // Determine tessera tile size based on target resolution
  let tileSize = 1;
  if (resolution >= 1024) tileSize = 4;
  else if (resolution >= 512) tileSize = 3;
  else if (resolution >= 256) tileSize = 2;
  else if (resolution >= 128) tileSize = 1.5;
  else tileSize = 1;

  const grout = (settings.groutIntensity / 100) * (tileSize > 1 ? 0.6 : 0.25);
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

      if (alpha < 20) continue;

      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const distFromCenter = Math.hypot(
        (sampleX - resolution / 2) / (resolution / 2),
        (sampleY - resolution / 2) / (resolution / 2)
      );

      let finalAlpha = alpha / 255;
      if (settings.alphaCutout) {
        if (brightness < 18 && distFromCenter > 0.46) {
          finalAlpha = 0.0;
        } else if (brightness < 30 && distFromCenter > 0.62) {
          finalAlpha = Math.max(0, (brightness - 18) / 12);
        } else if (brightness < 22) {
          finalAlpha = Math.max(0.2, brightness / 22);
        }
      }

      if (finalAlpha <= 0.03) continue;

      // Color quantization & Neural Palette Grading
      if (settings.palette === 'CYBER_CYAN') {
        const luma = brightness / 255;
        red = Math.round(luma * 10);
        green = Math.round(luma * 240);
        blue = Math.round(luma * 255);
      } else if (settings.palette === 'SOLAR_GOLD') {
        const luma = brightness / 255;
        red = Math.round(luma * 255);
        green = Math.round(luma * 183);
        blue = Math.round(luma * 20);
      } else if (settings.palette === 'CRIMSON_NEO') {
        const luma = brightness / 255;
        red = Math.round(luma * 255);
        green = Math.round(luma * 15);
        blue = Math.round(luma * 65);
      } else if (settings.palette === 'EMERALD_QUANTUM') {
        const luma = brightness / 255;
        red = Math.round(luma * 10);
        green = Math.round(luma * 255);
        blue = Math.round(luma * 136);
      } else if (settings.palette === 'AMETHYST_VOID') {
        const luma = brightness / 255;
        red = Math.round(luma * 217);
        green = Math.round(luma * 70);
        blue = Math.round(luma * 239);
      } else if (settings.palette === 'TITANIUM_WHITE') {
        const luma = brightness / 255;
        red = Math.round(luma * 230);
        green = Math.round(luma * 240);
        blue = Math.round(luma * 255);
      }

      // Micro-tessera stone noise variation
      const noise = ((c * 23 + r * 41) % 15) - 7;
      const finalR = Math.max(0, Math.min(255, red + noise));
      const finalG = Math.max(0, Math.min(255, green + noise));
      const finalB = Math.max(0, Math.min(255, blue + noise));

      ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalAlpha})`;
      ctx.fillRect(x, y, tileDrawW, tileDrawH);

      // Sub-pixel Bevel Highlights for HD resolutions
      if (resolution >= 128) {
        if (settings.tileStyle === 'ROMAN_STONE' && brightness > 60) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * (brightness / 255) * finalAlpha})`;
          ctx.fillRect(x, y, tileDrawW, Math.max(0.6, tileSize * 0.25));
          ctx.fillRect(x, y, Math.max(0.6, tileSize * 0.25), tileDrawH);
        } else if (settings.tileStyle === 'QUANTUM_TRANSISTOR' && brightness > 95) {
          ctx.fillStyle = settings.primaryGlow;
          ctx.fillRect(x + tileDrawW / 2 - 0.5, y + tileDrawH / 2 - 0.5, 1, 1);
        }
      }
    }
  }

  return canvas;
}

/**
 * Converts any custom uploaded image to an authentic 64x64 Retro Arcade Pixel Sprite
 */
export function convertImageToPixelSprite64Canvas(
  img: HTMLImageElement,
  settings: CustomConversionSettings
): HTMLCanvasElement {
  return convertImageToMultiResMosaicSpriteCanvas(img, settings, 64);
}

/**
 * Creates a Three.js CanvasTexture from any Custom Character Asset
 */
export function createCustomAssetThreeTexture(
  asset: CustomCharacterAsset,
  targetWidth = 512,
  targetHeight = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Placeholder while loading
  ctx.fillStyle = '#060b18';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.strokeStyle = '#00f0ff';
  ctx.strokeRect(4, 4, targetWidth - 8, targetHeight - 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = asset.imageUrl;

  const apply = () => {
    const converted = convertImageElementToMosaicCanvas(
      img,
      asset.settings,
      targetWidth,
      targetHeight
    );
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(converted, 0, 0);
    texture.needsUpdate = true;
  };

  if (img.complete && img.naturalWidth > 0) {
    apply();
  } else {
    img.onload = apply;
  }

  return texture;
}
