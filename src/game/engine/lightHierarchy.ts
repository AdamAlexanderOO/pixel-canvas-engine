/**
 * .LIGHT Protocol — Blue (Bridge Layer)
 * ------------------------------------
 * Pure, dependency-free encoder that turns human-readable English into the
 * hierarchical symbolic code (Tier 1 = 50 chars, Tier 2 = 30, Tier 3 = 20),
 * expands it into "Sunset" superglyphs (100 / 250 / 500 / 1000 chars) and
 * flattens the whole block into a transistor bitfield — the 0/1 positions
 * that ultimately decide what the mosaic pixel grid displays.
 *
 * Everything is deterministic: the same English sentence always compiles to
 * the same glyph string, the same bitfield and the same mosaic.
 */

export const LIGHT_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export type SunsetSize = 100 | 250 | 500 | 1000;

export type LightTierId = 'T1_STRUCTURAL' | 'T2_FUNCTIONAL' | 'T3_MICRO';

export interface LightTier {
  id: LightTierId;
  index: 1 | 2 | 3;
  name: string;
  layer: string;
  purpose: string;
  length: number;
  code: string;
  defines: string[];
}

export interface TransistorField {
  /** Grid width in transistor cells. */
  cols: number;
  /** Grid height in transistor cells. */
  rows: number;
  /** Flat 0/1 array, length = cols * rows. */
  bits: Uint8Array;
  /** Tier ownership per cell: 1, 2 or 3 — drives mosaic colour banding. */
  tierMap: Uint8Array;
  onCount: number;
  density: number;
}

export interface LightCompilation {
  source: string;
  seed: number;
  tiers: LightTier[];
  /** T1 + T2 + T3 concatenated — the 100-char hierarchy block. */
  block: string;
  sunset: SunsetSize;
  superGlyph: string;
  field: TransistorField;
  checksum: string;
}

/* ------------------------------------------------------------------ */
/* Deterministic hashing                                               */
/* ------------------------------------------------------------------ */

export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function glyphRun(seed: number, length: number, salt: number): string {
  const rnd = mulberry32(seed ^ Math.imul(salt + 1, 0x9e3779b1));
  let out = '';
  for (let i = 0; i < length; i++) {
    out += LIGHT_ALPHABET[Math.floor(rnd() * LIGHT_ALPHABET.length)];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tier definitions                                                    */
/* ------------------------------------------------------------------ */

const TIER_META: Omit<LightTier, 'code'>[] = [
  {
    id: 'T1_STRUCTURAL',
    index: 1,
    name: 'STRUCTURAL IDENTITY',
    layer: 'Core Mosaic Layer',
    purpose: 'Leap-frog rendering anchor',
    length: 50,
    defines: ['Node identity', 'Domain', 'Behaviour class', 'Version', 'Device compatibility'],
  },
  {
    id: 'T2_FUNCTIONAL',
    index: 2,
    name: 'FUNCTIONAL LOGIC',
    layer: 'Behaviour Pulse Layer',
    purpose: 'Runtime logic engine',
    length: 30,
    defines: ['Behaviour rules', 'Pulse patterns', 'Emotional curves', 'Interaction response', 'Environment hooks'],
  },
  {
    id: 'T3_MICRO',
    index: 3,
    name: 'MICRO-INSTRUCTION SET',
    layer: 'Glyph Spark Layer',
    purpose: 'Executable micro-threads',
    length: 20,
    defines: ['Upgrades', 'Micro-shares', 'Micro-credits', 'Trigger logic', 'Symbolic output'],
  },
];

export const SUNSET_PROFILES: Record<SunsetSize, { name: string; role: string }> = {
  100: { name: 'SUNSET-100', role: 'High-resolution mosaic render + leap-frog compression' },
  250: { name: 'SUNSET-250', role: 'Multi-node fusion, emotional + environmental blending' },
  500: { name: 'SUNSET-500', role: 'Full protocol blocks, AI memory cache, quantum fork nodes' },
  1000: { name: 'SUNSET-1000', role: 'Complete OS modules — super-glyph for device execution' },
};

/* ------------------------------------------------------------------ */
/* Transistor bitfield                                                 */
/* ------------------------------------------------------------------ */

/** Six bits per glyph — the position of every 1 is a conducting transistor. */
export function glyphToBits(glyph: string): number[] {
  const bits: number[] = [];
  for (let i = 0; i < glyph.length; i++) {
    const v = LIGHT_ALPHABET.indexOf(glyph[i]!);
    const code = v < 0 ? 0 : v;
    for (let b = 5; b >= 0; b--) bits.push((code >> b) & 1);
  }
  return bits;
}

export function buildTransistorField(
  compilationBlock: string,
  cols: number,
  rows: number,
  tierLengths: number[],
): TransistorField {
  const total = cols * rows;
  const bits = new Uint8Array(total);
  const tierMap = new Uint8Array(total);

  const raw = glyphToBits(compilationBlock);
  // Tier boundaries expressed in bits (6 bits per glyph).
  const b1 = tierLengths[0]! * 6;
  const b2 = b1 + tierLengths[1]! * 6;

  let onCount = 0;
  for (let i = 0; i < total; i++) {
    const src = i % raw.length;
    // XOR fold gives a stable but non-repeating pattern across the grid.
    const fold = raw[src]! ^ raw[(i * 7 + 3) % raw.length]! ^ ((i >> 6) & 1);
    bits[i] = fold as 0 | 1;
    if (fold) onCount++;
    tierMap[i] = src < b1 ? 1 : src < b2 ? 2 : 3;
  }

  return { cols, rows, bits, tierMap, onCount, density: onCount / total };
}

/* ------------------------------------------------------------------ */
/* Compiler                                                            */
/* ------------------------------------------------------------------ */

export function compileLight(
  source: string,
  sunset: SunsetSize = 100,
  cols = 80,
  rows = 45,
): LightCompilation {
  const clean = source.trim() || 'AURORA CORE IDLE';
  const seed = hashSeed(clean);

  const tiers: LightTier[] = TIER_META.map((meta, i) => ({
    ...meta,
    code: glyphRun(seed, meta.length, i),
  }));

  const block = tiers.map((t) => t.code).join('');

  // Sunset expansion: repeatedly re-hash the block to reach the target size.
  let superGlyph = block;
  let pass = 0;
  while (superGlyph.length < sunset) {
    superGlyph += glyphRun(hashSeed(superGlyph.slice(-64)) ^ seed, Math.min(100, sunset - superGlyph.length), pass++);
  }
  superGlyph = superGlyph.slice(0, sunset);

  const field = buildTransistorField(
    superGlyph,
    cols,
    rows,
    tiers.map((t) => t.length),
  );

  const checksum = (hashSeed(superGlyph) >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return { source: clean, seed, tiers, block, sunset, superGlyph, field, checksum };
}
