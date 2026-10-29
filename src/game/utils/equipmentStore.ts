// Equipment system: every module of the hub is an in-game item that can be
// equipped into a limited number of loadout slots. Equipped items grant stat bonuses.

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ItemSlot = 'CORE' | 'CHIP' | 'OPTIC' | 'MODULE';

export interface EquipItem {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  tab: string; // the app section this item powers
  description: string;
  stats: { power: number; shield: number; ai: number; sync: number };
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  COMMON: '#a3a3a3',
  RARE: '#38bdf8',
  EPIC: '#c084fc',
  LEGENDARY: '#f59e0b',
};

export const SLOT_ORDER: ItemSlot[] = ['CORE', 'CHIP', 'OPTIC', 'MODULE'];
export const SLOTS_PER_TYPE = 2;

export const EQUIP_ITEMS: EquipItem[] = [
  { id: 'console', name: 'Aurora Chassis Core', slot: 'CORE', rarity: 'EPIC', tab: 'CONSOLE', description: 'Hardware console powering the whole deck.', stats: { power: 30, shield: 10, ai: 5, sync: 5 } },
  { id: 'subsystems', name: '8-Matrix Reactor', slot: 'CORE', rarity: 'RARE', tab: 'SUBSYSTEMS', description: 'Eight linked subsystems in one reactor.', stats: { power: 20, shield: 15, ai: 10, sync: 0 } },
  { id: 'pcb', name: 'Light-Protocol PCB', slot: 'CHIP', rarity: 'LEGENDARY', tab: 'PCB', description: 'Photon-traced circuit board.', stats: { power: 15, shield: 0, ai: 25, sync: 20 } },
  { id: 'light', name: '.LIGHT Blue Transistor Die', slot: 'CHIP', rarity: 'EPIC', tab: 'LIGHT', description: '0/1 transistor field compiled from English.', stats: { power: 5, shield: 5, ai: 30, sync: 15 } },
  { id: 'gears', name: 'Holo Gear Silicon Stack', slot: 'CHIP', rarity: 'RARE', tab: 'GEARS', description: 'Layered gears, silicon and hologram mesh.', stats: { power: 10, shield: 10, ai: 10, sync: 10 } },
  { id: 'radar', name: 'Tactical Radar Optic', slot: 'OPTIC', rarity: 'RARE', tab: 'RADAR', description: 'Scans for anomalies and signatures.', stats: { power: 0, shield: 20, ai: 5, sync: 15 } },
  { id: 'mosaic', name: 'Roman Mosaic Lens', slot: 'OPTIC', rarity: 'LEGENDARY', tab: 'MOSAIC', description: 'Pixel-exact mosaic cypher lens.', stats: { power: 5, shield: 5, ai: 20, sync: 30 } },
  { id: 'arcade', name: 'Arcade Combat Module', slot: 'MODULE', rarity: 'EPIC', tab: 'ARCADE', description: '3D shooters and pixel arcade cartridge.', stats: { power: 25, shield: 5, ai: 0, sync: 10 } },
  { id: 'feed', name: 'Continuous Feed Relay', slot: 'MODULE', rarity: 'COMMON', tab: 'ALL_FEED', description: 'Streams every section in one feed.', stats: { power: 5, shield: 5, ai: 5, sync: 5 } },
];

const KEY = 'aurora-equipped-v1';
export const DEFAULT_EQUIPPED = ['console', 'pcb', 'radar', 'arcade'];

export function loadEquipped(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_EQUIPPED;
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id) => EQUIP_ITEMS.some((i) => i.id === id)) : DEFAULT_EQUIPPED;
  } catch {
    return DEFAULT_EQUIPPED;
  }
}

export function saveEquipped(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

/** Returns new equipped list, or null if the slot type is full. */
export function toggleEquip(equipped: string[], id: string): string[] | null {
  if (equipped.includes(id)) return equipped.filter((e) => e !== id);
  const item = EQUIP_ITEMS.find((i) => i.id === id);
  if (!item) return equipped;
  const used = equipped.filter((e) => EQUIP_ITEMS.find((i) => i.id === e)?.slot === item.slot).length;
  if (used >= SLOTS_PER_TYPE) return null;
  return [...equipped, id];
}

export function totalStats(equipped: string[]) {
  return equipped.reduce(
    (acc, id) => {
      const s = EQUIP_ITEMS.find((i) => i.id === id)?.stats;
      if (s) { acc.power += s.power; acc.shield += s.shield; acc.ai += s.ai; acc.sync += s.sync; }
      return acc;
    },
    { power: 0, shield: 0, ai: 0, sync: 0 },
  );
}
