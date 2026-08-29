import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import type { AppThemeConfig } from '../utils/theme';
import { haptics } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

/**
 * VULT-RUM • GEN-12 — True Interactive Mesh
 * -----------------------------------------
 * Translucent volumetric data nodes (icosahedra / octahedra) with a working
 * raycaster handshake. The HUD is pointer-events:none so the pointer "laser"
 * always reaches 3D space. Clicking a node siphons torque: it spins a full
 * turn, pulses its emissive material and fires a haptic tick.
 */

interface NodeSpec {
  label: string;
  detail: string;
  shape: 'ICO' | 'OCTA';
}

const NODES: NodeSpec[] = [
  { label: 'WIFI_1M', detail: '1,000,000 redundant sync nodes • BFT f < N/3', shape: 'ICO' },
  { label: 'TORQUE_4M', detail: '4,000,000 t kinetic torque • Ek = ½Iω²', shape: 'OCTA' },
  { label: 'SATURATE', detail: 'Asset saturation • 64-bit micro-mesh siphon', shape: 'ICO' },
  { label: 'SOVEREIGN', detail: 'Latin cipher lock • modular time-shift key', shape: 'OCTA' },
];

interface Props {
  theme: AppThemeConfig;
  powerOn: boolean;
  fluxFrequency: number;
  onSiphon?: (label: string) => void;
}

export const VultRumMeshDeck: React.FC<Props> = ({ theme, powerOn, fluxFrequency, onSiphon }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<NodeSpec | null>(null);
  const [torque, setTorque] = useState(100);
  const stateRef = useRef({ powerOn, flux: fluxFrequency, color: theme.primary });

  useEffect(() => {
    stateRef.current = { powerOn, flux: fluxFrequency, color: theme.primary };
  }, [powerOn, fluxFrequency, theme.primary]);

  // Torque recovery loop (linear regeneration).
  useEffect(() => {
    const id = window.setInterval(() => setTorque((v) => Math.min(100, v + 4)), 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = Math.round(width * 0.5625);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const colorHex = new THREE.Color(theme.primary);
    const accentHex = new THREE.Color(theme.accent);

    const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>[] = [];
    NODES.forEach((spec, i) => {
      const geo =
        spec.shape === 'ICO'
          ? new THREE.IcosahedronGeometry(2.1, 0)
          : new THREE.OctahedronGeometry(2.3, 0);
      const mat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? colorHex : accentHex,
        emissive: i % 2 === 0 ? colorHex : accentHex,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.32,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - 1.5) * 6.4, 0, 0);
      mesh.userData = { index: i };
      scene.add(mesh);
      meshes.push(mesh);
    });

    const light = new THREE.PointLight(colorHex, 3, 120);
    light.position.set(0, 4, 14);
    scene.add(light, new THREE.AmbientLight(0x222222));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-10, -10);
    let hovered: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> | null = null;

    const toNdc = (clientX: number, clientY: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    };

    const onMove = (e: PointerEvent) => toNdc(e.clientX, e.clientY);
    const onLeave = () => pointer.set(-10, -10);

    const siphon = (e: PointerEvent) => {
      toNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (!hit) return;
      const mesh = hit.object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>;
      gsap.to(mesh.rotation, { y: mesh.rotation.y + Math.PI * 2, duration: 1, ease: 'power2.out' });
      gsap.to(mesh.scale, { x: 1.45, y: 1.45, z: 1.45, yoyo: true, repeat: 1, duration: 0.2 });
      gsap.fromTo(mesh.material, { emissiveIntensity: 8 }, { emissiveIntensity: 0.25, duration: 0.9 });
      haptics.trigger('heavy');
      sounds.playClick(520);
      const spec = NODES[mesh.userData.index as number]!;
      setTorque((v) => Math.max(0, v - 12));
      onSiphon?.(spec.label);
    };

    const el = renderer.domElement;
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', siphon);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const spin = stateRef.current.powerOn ? 0.004 + stateRef.current.flux / 20000 : 0.0005;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      const next = (hit?.object as typeof hovered) ?? null;
      if (next !== hovered) {
        if (hovered) hovered.material.opacity = 0.32;
        hovered = next;
        if (hovered) hovered.material.opacity = 1;
        setTarget(hovered ? NODES[hovered.userData.index as number]! : null);
      }

      meshes.forEach((m, i) => {
        m.rotation.y += spin;
        m.rotation.x += spin * 0.4;
        m.position.y = Math.sin(t * 0.9 + i) * 1.3;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || 640;
      const h = Math.round(w * 0.5625);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', siphon);
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [theme.primary, theme.accent, onSiphon]);

  return (
    <div className="relative w-full select-none">
      <div ref={mountRef} className="w-full rounded border border-white/10 bg-black overflow-hidden" />

      {/* HUD — pointer-events:none so the raycaster laser passes through */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 font-mono">
        <div>
          <div className="text-[9px] tracking-[0.25em]" style={{ color: theme.accent }}>
            ENGINE: VULT_R12 // WIFI 1M
          </div>
          <div
            className="text-base font-bold mt-1"
            style={{ color: theme.primary, textShadow: `0 0 10px ${theme.glowRgba}` }}
          >
            {target ? target.label : 'SCANNING_VOID...'}
          </div>
          {target && <div className="text-[9px] text-neutral-300 mt-0.5">{target.detail}</div>}
        </div>
        <div className="text-[9px] tracking-[0.25em]" style={{ color: theme.accent }}>
          KINETIC TORQUE: 4,000,000T • CAPACITY {torque}%
        </div>
      </div>
    </div>
  );
};
