import React, { useEffect, useRef } from 'react';
import type { LightCompilation } from '../engine/lightHierarchy';
import type { AppThemeConfig } from '../utils/theme';

/**
 * Transistor Display Field
 * ------------------------
 * Renders the compiled .LIGHT bitfield at a 640x360 virtual resolution and
 * lets the browser integer-upscale it (image-rendering: pixelated), exactly
 * like a modern smartphone pixel-art pipeline. Each cell is one transistor:
 * a 1 conducts (lit sub-pixel), a 0 stays dark.
 */

interface Props {
  compilation: LightCompilation;
  theme: AppThemeConfig;
  powerOn: boolean;
  fluxFrequency: number;
}

const VW = 640;
const VH = 360;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

export const TransistorMosaicMatrix: React.FC<Props> = ({
  compilation,
  theme,
  powerOn,
  fluxFrequency,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { field } = compilation;
    const cellW = VW / field.cols;
    const cellH = VH / field.rows;
    const base = hexToRgb(theme.primary);
    const accent = hexToRgb(theme.accent);
    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const speed = powerOn ? 0.35 + fluxFrequency / 90 : 0.05;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, VW, VH);

      for (let y = 0; y < field.rows; y++) {
        for (let x = 0; x < field.cols; x++) {
          const i = y * field.cols + x;
          const on = field.bits[i] === 1;
          const tier = field.tierMap[i]!;

          // Propagation wave: transistor states ripple along conductive rows.
          const wave = Math.sin((x * 0.22 + y * 0.14) - t * speed * 3);
          const lit = on ? 0.55 + wave * 0.35 : 0.06 + Math.max(0, wave) * 0.05;
          const col = tier === 3 ? accent : base;
          const mix = tier === 2 ? 0.75 : 1;
          const a = powerOn ? Math.max(0.03, lit) : 0.08;

          ctx.fillStyle = `rgba(${Math.round(col[0] * mix)},${Math.round(col[1] * mix)},${Math.round(col[2] * mix)},${a.toFixed(3)})`;
          ctx.fillRect(
            Math.floor(x * cellW),
            Math.floor(y * cellH),
            Math.max(1, Math.floor(cellW) - 1),
            Math.max(1, Math.floor(cellH) - 1),
          );
        }
      }

      // Scan bar — the display refresh sweeping the transistor grid.
      const sweep = ((t * speed * 60) % VH) | 0;
      ctx.fillStyle = `rgba(255,255,255,${powerOn ? 0.07 : 0.02})`;
      ctx.fillRect(0, sweep, VW, 2);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [compilation, theme, powerOn, fluxFrequency]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        width={VW}
        height={VH}
        className="pixel-canvas w-full h-auto rounded border border-white/10 bg-black"
      />
      <div className="mt-1.5 grid grid-cols-3 gap-1 font-mono text-[9px] text-neutral-400">
        <div className="border border-white/5 bg-white/[0.02] rounded p-1">
          VIRTUAL RES <span className="text-white">640×360</span>
        </div>
        <div className="border border-white/5 bg-white/[0.02] rounded p-1">
          TRANSISTORS{' '}
          <span className="text-white">
            {compilation.field.cols * compilation.field.rows}
          </span>
        </div>
        <div className="border border-white/5 bg-white/[0.02] rounded p-1">
          DUTY <span className="text-white">{(compilation.field.density * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
