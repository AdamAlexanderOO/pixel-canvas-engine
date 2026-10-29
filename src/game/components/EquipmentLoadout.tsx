import React from 'react';
import { Shield, Zap, Brain, Link2, Lock } from 'lucide-react';
import {
  EQUIP_ITEMS, RARITY_COLORS, SLOT_ORDER, SLOTS_PER_TYPE, totalStats,
} from '../utils/equipmentStore';
import type { AppThemeConfig } from '../utils/theme';

interface Props {
  theme: AppThemeConfig;
  equipped: string[];
  onToggle: (id: string) => void;
  onOpen: (tab: string) => void;
}

export const EquipmentLoadout: React.FC<Props> = ({ theme, equipped, onToggle, onOpen }) => {
  const stats = totalStats(equipped);
  const statRow = [
    { k: 'POWER', v: stats.power, Icon: Zap },
    { k: 'SHIELD', v: stats.shield, Icon: Shield },
    { k: 'AI', v: stats.ai, Icon: Brain },
    { k: 'SYNC', v: stats.sync, Icon: Link2 },
  ];

  return (
    <div className="space-y-3 font-mono">
      <div className="grid grid-cols-4 gap-1.5">
        {statRow.map(({ k, v, Icon }) => (
          <div key={k} className="border border-white/10 bg-neutral-950/80 rounded p-2 text-center">
            <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: theme.primary }} />
            <div className="text-[8px] text-neutral-400">{k}</div>
            <div className="text-sm font-bold text-white">+{v}</div>
          </div>
        ))}
      </div>

      {SLOT_ORDER.map((slot) => {
        const items = EQUIP_ITEMS.filter((i) => i.slot === slot);
        const used = items.filter((i) => equipped.includes(i.id)).length;
        return (
          <div key={slot} className="space-y-1.5">
            <div className="flex justify-between text-[10px] tracking-[0.2em]">
              <span style={{ color: theme.primary }}>{slot} SLOTS</span>
              <span className="text-neutral-400">{used}/{SLOTS_PER_TYPE}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {items.map((item) => {
                const on = equipped.includes(item.id);
                const full = !on && used >= SLOTS_PER_TYPE;
                const rc = RARITY_COLORS[item.rarity];
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border p-2.5 bg-neutral-950/80 transition-all"
                    style={{ borderColor: on ? rc : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 0 12px ${rc}55` : 'none' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white">{item.name}</div>
                        <div className="text-[9px]" style={{ color: rc }}>{item.rarity}</div>
                      </div>
                      {on && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: rc, color: '#000' }}>EQUIPPED</span>}
                    </div>
                    <p className="text-[9px] text-neutral-400 mt-1">{item.description}</p>
                    <div className="text-[9px] text-neutral-300 mt-1">
                      PWR+{item.stats.power} SHD+{item.stats.shield} AI+{item.stats.ai} SYN+{item.stats.sync}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <button
                        type="button"
                        disabled={full}
                        onClick={() => onToggle(item.id)}
                        className="flex-1 py-1 rounded text-[10px] font-bold border disabled:opacity-40 flex items-center justify-center gap-1"
                        style={{ borderColor: on ? 'rgba(255,255,255,0.2)' : rc, color: on ? '#d4d4d4' : rc }}
                      >
                        {full && <Lock className="w-3 h-3" />}
                        {on ? 'UNEQUIP' : full ? 'SLOTS FULL' : 'EQUIP'}
                      </button>
                      <button
                        type="button"
                        disabled={!on}
                        onClick={() => onOpen(item.tab)}
                        className="px-2 py-1 rounded text-[10px] font-bold border border-white/15 text-white disabled:opacity-30"
                      >
                        OPEN
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
