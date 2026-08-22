/**
 * Aurora Rig Schema
 * -----------------
 * Data model for hybrid characters: real volumetric 3D part hierarchies
 * (Unity-style transform tree with joints, sockets and animation clips)
 * skinned with regions of the hand-drawn / mosaic concept art.
 *
 * Nothing here touches three.js — it is pure data, so rigs can be authored,
 * serialised, edited in the Rig Studio and shipped inside save files.
 */

import type { MosaicCharacterType } from '../utils/mosaicCharacterRenderer';

export type RigPartShape =
  | 'BOX'
  | 'PLATE'
  | 'CAPSULE'
  | 'CYLINDER'
  | 'SPHERE'
  | 'CONE'
  | 'WEDGE';

export type RigArchetype =
  | 'HUMANOID_MECH'
  | 'BIPED_TROOPER'
  | 'AEROSPACE_FRAME'
  | 'HOVER_DRONE'
  | 'CAPITAL_SHIP'
  | 'HANDHELD_WEAPON'
  | 'STATIC_PROP';

/** Vec3 tuple in metres (world scale: 1 unit = 1 metre). */
export type Vec3 = [number, number, number];

/** Normalised crop of the source artwork: [u, v, width, height] in 0..1. */
export type UVRegion = [number, number, number, number];

export interface RigMaterialDef {
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  doubleSided?: boolean;
  /** Skip the artwork and render as a solid glow volume (thrusters, visors). */
  glowOnly?: boolean;
  tint?: string;
}

export interface RigPartDef {
  id: string;
  name: string;
  /** Parent part id, or null for the rig root. */
  parent: string | null;
  shape: RigPartShape;
  /** Bounding size of the volume. */
  size: Vec3;
  /** Offset from the parent joint. */
  position: Vec3;
  /** Euler rotation in degrees. */
  rotation: Vec3;
  /**
   * Joint pivot offset inside the part (metres). The geometry is shifted by
   * -pivot so rotation happens around a shoulder/hip/hinge instead of centre.
   */
  pivot?: Vec3;
  /** Which slice of the hand-drawn art is mapped onto this volume. */
  uvRegion: UVRegion;
  material: RigMaterialDef;
  /** Deformation group used by damage / dismemberment systems. */
  hitGroup?: 'HEAD' | 'TORSO' | 'ARM' | 'LEG' | 'WING' | 'HULL' | 'WEAPON';
  /** Relative hit-point contribution of this part (0..1). */
  hitWeight?: number;
  locked?: boolean;
}

export type RigChannel =
  | 'rotX'
  | 'rotY'
  | 'rotZ'
  | 'posX'
  | 'posY'
  | 'posZ'
  | 'scale';

export interface RigKey {
  /** Normalised clip time, 0..1. */
  t: number;
  /** Degrees for rot*, metres for pos*, multiplier for scale. */
  v: number;
}

export interface RigTrackDef {
  partId: string;
  channel: RigChannel;
  keys: RigKey[];
}

export interface RigClipDef {
  id: string;
  name: string;
  /** Seconds for a full cycle. */
  duration: number;
  loop: boolean;
  tracks: RigTrackDef[];
}

export interface RigSocketDef {
  id: string;
  name: string;
  partId: string;
  position: Vec3;
  rotation: Vec3;
  /** What is allowed to be attached here. */
  accepts: ('WEAPON' | 'SHIELD' | 'THRUSTER' | 'FX' | 'CAMERA')[];
}

export interface CharacterRigDef {
  id: string;
  name: string;
  archetype: RigArchetype;
  /** Source artwork used to skin the volumes. */
  characterType: MosaicCharacterType;
  description: string;
  /** Total height in metres — used for camera framing and collision capsules. */
  height: number;
  /** Uniform scale multiplier applied to the whole rig. */
  scale: number;
  parts: RigPartDef[];
  sockets: RigSocketDef[];
  clips: RigClipDef[];
  defaultClip: string;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* Evaluation helpers                                                  */
/* ------------------------------------------------------------------ */

export function sampleTrack(track: RigTrackDef, t: number): number {
  const keys = track.keys;
  if (keys.length === 0) return 0;
  const first = keys[0]!;
  if (keys.length === 1 || t <= first.t) return first.v;
  const last = keys[keys.length - 1]!;
  if (t >= last.t) return last.v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const k = (t - a.t) / span;
      // Smoothstep easing keeps hand-authored keys feeling organic.
      const e = k * k * (3 - 2 * k);
      return a.v + (b.v - a.v) * e;
    }
  }
  return last.v;
}

export function cloneRig(def: CharacterRigDef): CharacterRigDef {
  return JSON.parse(JSON.stringify(def)) as CharacterRigDef;
}

export function partChildren(def: CharacterRigDef, partId: string | null): RigPartDef[] {
  return def.parts.filter((p) => p.parent === partId);
}

export function countTriangles(def: CharacterRigDef): number {
  const perShape: Record<RigPartShape, number> = {
    BOX: 12,
    PLATE: 2,
    WEDGE: 8,
    CAPSULE: 320,
    CYLINDER: 96,
    SPHERE: 224,
    CONE: 48,
  };
  return def.parts.reduce((sum, p) => sum + perShape[p.shape], 0);
}

export const DEG = Math.PI / 180;
