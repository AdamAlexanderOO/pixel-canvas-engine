/**
 * Expanded character data — every entry in the character map now carries a
 * full volumetric rig definition (parts, joints, sockets, animation clips)
 * instead of a single flat image on a quad.
 */

import type {
  CharacterRigDef,
  RigClipDef,
  RigPartDef,
  RigSocketDef,
  Vec3,
} from '../engine/rigSchema';
import type { MosaicCharacterType } from '../utils/mosaicCharacterRenderer';

const M = (
  metalness: number,
  roughness: number,
  emissive?: string,
  emissiveIntensity = 0.35,
) => ({ metalness, roughness, emissive, emissiveIntensity });

const GLOW = (color: string, intensity = 2.2) => ({
  metalness: 0.1,
  roughness: 0.3,
  emissive: color,
  emissiveIntensity: intensity,
  glowOnly: true,
});

/* ------------------------------------------------------------------ */
/* Shared clip library                                                 */
/* ------------------------------------------------------------------ */

function bipedIdle(): RigClipDef {
  return {
    id: 'idle',
    name: 'Idle / Standby',
    duration: 3.2,
    loop: true,
    tracks: [
      { partId: 'pelvis', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.055 }, { t: 1, v: 0 }] },
      { partId: 'torso', channel: 'rotX', keys: [{ t: 0, v: 1.5 }, { t: 0.5, v: -1.5 }, { t: 1, v: 1.5 }] },
      { partId: 'head', channel: 'rotY', keys: [{ t: 0, v: -6 }, { t: 0.35, v: 7 }, { t: 0.7, v: -3 }, { t: 1, v: -6 }] },
      { partId: 'armL', channel: 'rotX', keys: [{ t: 0, v: -6 }, { t: 0.5, v: -12 }, { t: 1, v: -6 }] },
      { partId: 'armR', channel: 'rotX', keys: [{ t: 0, v: -10 }, { t: 0.5, v: -4 }, { t: 1, v: -10 }] },
    ],
  };
}

function bipedRun(): RigClipDef {
  return {
    id: 'run',
    name: 'Combat Run',
    duration: 0.72,
    loop: true,
    tracks: [
      { partId: 'pelvis', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.25, v: 0.12 }, { t: 0.5, v: 0 }, { t: 0.75, v: 0.12 }, { t: 1, v: 0 }] },
      { partId: 'torso', channel: 'rotX', keys: [{ t: 0, v: 8 }, { t: 1, v: 8 }] },
      { partId: 'legL', channel: 'rotX', keys: [{ t: 0, v: 42 }, { t: 0.5, v: -38 }, { t: 1, v: 42 }] },
      { partId: 'legR', channel: 'rotX', keys: [{ t: 0, v: -38 }, { t: 0.5, v: 42 }, { t: 1, v: -38 }] },
      { partId: 'shinL', channel: 'rotX', keys: [{ t: 0, v: -12 }, { t: 0.5, v: -58 }, { t: 1, v: -12 }] },
      { partId: 'shinR', channel: 'rotX', keys: [{ t: 0, v: -58 }, { t: 0.5, v: -12 }, { t: 1, v: -58 }] },
      { partId: 'armL', channel: 'rotX', keys: [{ t: 0, v: -46 }, { t: 0.5, v: 34 }, { t: 1, v: -46 }] },
      { partId: 'armR', channel: 'rotX', keys: [{ t: 0, v: 34 }, { t: 0.5, v: -46 }, { t: 1, v: 34 }] },
    ],
  };
}

function bipedFire(): RigClipDef {
  return {
    id: 'fire',
    name: 'Weapon Discharge',
    duration: 0.34,
    loop: false,
    tracks: [
      { partId: 'armR', channel: 'rotX', keys: [{ t: 0, v: -84 }, { t: 0.18, v: -66 }, { t: 1, v: -84 }] },
      { partId: 'torso', channel: 'rotY', keys: [{ t: 0, v: 0 }, { t: 0.18, v: -7 }, { t: 1, v: 0 }] },
      { partId: 'shoulderR', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.18, v: -0.14 }, { t: 1, v: 0 }] },
    ],
  };
}

function bipedHit(): RigClipDef {
  return {
    id: 'hit',
    name: 'Impact Stagger',
    duration: 0.42,
    loop: false,
    tracks: [
      { partId: 'torso', channel: 'rotX', keys: [{ t: 0, v: 0 }, { t: 0.3, v: -16 }, { t: 1, v: 0 }] },
      { partId: 'head', channel: 'rotX', keys: [{ t: 0, v: 0 }, { t: 0.3, v: -22 }, { t: 1, v: 0 }] },
      { partId: 'pelvis', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.3, v: -0.22 }, { t: 1, v: 0 }] },
    ],
  };
}

function flightIdle(): RigClipDef {
  return {
    id: 'idle',
    name: 'Cruise',
    duration: 4,
    loop: true,
    tracks: [
      { partId: 'hull', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.09 }, { t: 1, v: 0 }] },
      { partId: 'wingL', channel: 'rotZ', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 3 }, { t: 1, v: 0 }] },
      { partId: 'wingR', channel: 'rotZ', keys: [{ t: 0, v: 0 }, { t: 0.5, v: -3 }, { t: 1, v: 0 }] },
    ],
  };
}

function flightBank(): RigClipDef {
  return {
    id: 'bank',
    name: 'Hard Bank',
    duration: 1.1,
    loop: true,
    tracks: [
      { partId: 'hull', channel: 'rotZ', keys: [{ t: 0, v: -26 }, { t: 0.5, v: 26 }, { t: 1, v: -26 }] },
      { partId: 'wingL', channel: 'rotZ', keys: [{ t: 0, v: 12 }, { t: 0.5, v: -12 }, { t: 1, v: 12 }] },
      { partId: 'wingR', channel: 'rotZ', keys: [{ t: 0, v: -12 }, { t: 0.5, v: 12 }, { t: 1, v: -12 }] },
      { partId: 'thrusterCore', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.5 }, { t: 1, v: 1 }] },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Archetype factories                                                 */
/* ------------------------------------------------------------------ */

interface MechOptions {
  bulk?: number;
  height?: number;
  glow?: string;
  winged?: boolean;
  heavy?: boolean;
}

/**
 * Humanoid mech: 18-part hierarchy with real shoulder/elbow/hip/knee joints.
 * The UV regions slice the hand-drawn key art so the painted chest ends up on
 * the chest volume, the painted head on the head volume, and so on.
 */
function humanoidMechParts(o: MechOptions = {}): RigPartDef[] {
  const b = o.bulk ?? 1;
  const glow = o.glow ?? '#00f0ff';
  const arm: Vec3 = [0.34 * b, 1.0, 0.34 * b];
  const parts: RigPartDef[] = [
    {
      id: 'pelvis', name: 'Pelvis', parent: null, shape: 'BOX',
      size: [0.95 * b, 0.55, 0.7 * b], position: [0, 1.55, 0], rotation: [0, 0, 0],
      uvRegion: [0.32, 0.5, 0.36, 0.14], material: M(0.85, 0.3), hitGroup: 'TORSO', hitWeight: 0.15,
    },
    {
      id: 'torso', name: 'Chest Chassis', parent: 'pelvis', shape: 'BOX',
      size: [1.36 * b, 1.25, 0.86 * b], position: [0, 0.85, 0], rotation: [0, 0, 0], pivot: [0, -0.6, 0],
      uvRegion: [0.28, 0.28, 0.44, 0.26], material: M(0.88, 0.24, glow, 0.25), hitGroup: 'TORSO', hitWeight: 0.3,
    },
    {
      id: 'core', name: 'Reactor Core', parent: 'torso', shape: 'SPHERE',
      size: [0.34, 0.34, 0.34], position: [0, 0.05, 0.46 * b], rotation: [0, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 2.6), hitGroup: 'TORSO', hitWeight: 0.05,
    },
    {
      id: 'neck', name: 'Neck Gimbal', parent: 'torso', shape: 'CYLINDER',
      size: [0.24, 0.2, 0.24], position: [0, 0.72, 0], rotation: [0, 0, 0],
      uvRegion: [0.46, 0.22, 0.08, 0.05], material: M(0.9, 0.35),
    },
    {
      id: 'head', name: 'Sensor Head', parent: 'neck', shape: 'BOX',
      size: [0.62, 0.58, 0.66], position: [0, 0.36, 0], rotation: [0, 0, 0], pivot: [0, -0.25, 0],
      uvRegion: [0.38, 0.06, 0.24, 0.18], material: M(0.8, 0.28, glow, 0.4), hitGroup: 'HEAD', hitWeight: 0.12,
    },
    {
      id: 'visor', name: 'Optic Visor', parent: 'head', shape: 'PLATE',
      size: [0.46, 0.12, 0.02], position: [0, 0.04, 0.35], rotation: [0, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 3),
    },
    {
      id: 'shoulderL', name: 'Pauldron L', parent: 'torso', shape: 'WEDGE',
      size: [0.62 * b, 0.52, 0.72 * b], position: [-0.86 * b, 0.5, 0], rotation: [0, 0, -8],
      uvRegion: [0.06, 0.26, 0.18, 0.16], material: M(0.9, 0.22), hitGroup: 'ARM', hitWeight: 0.06,
    },
    {
      id: 'shoulderR', name: 'Pauldron R', parent: 'torso', shape: 'WEDGE',
      size: [0.62 * b, 0.52, 0.72 * b], position: [0.86 * b, 0.5, 0], rotation: [0, 0, 8],
      uvRegion: [0.76, 0.26, 0.18, 0.16], material: M(0.9, 0.22), hitGroup: 'ARM', hitWeight: 0.06,
    },
    {
      id: 'armL', name: 'Upper Arm L', parent: 'shoulderL', shape: 'CAPSULE',
      size: arm, position: [-0.1, -0.42, 0], rotation: [-6, 0, 0], pivot: [0, 0.44, 0],
      uvRegion: [0.05, 0.42, 0.13, 0.2], material: M(0.86, 0.3), hitGroup: 'ARM', hitWeight: 0.05,
    },
    {
      id: 'armR', name: 'Upper Arm R', parent: 'shoulderR', shape: 'CAPSULE',
      size: arm, position: [0.1, -0.42, 0], rotation: [-10, 0, 0], pivot: [0, 0.44, 0],
      uvRegion: [0.82, 0.42, 0.13, 0.2], material: M(0.86, 0.3), hitGroup: 'ARM', hitWeight: 0.05,
    },
    {
      id: 'foreL', name: 'Forearm L', parent: 'armL', shape: 'BOX',
      size: [0.32 * b, 0.86, 0.32 * b], position: [0, -0.9, 0], rotation: [-14, 0, 0], pivot: [0, 0.38, 0],
      uvRegion: [0.04, 0.62, 0.12, 0.18], material: M(0.84, 0.32), hitGroup: 'ARM', hitWeight: 0.04,
    },
    {
      id: 'foreR', name: 'Forearm R', parent: 'armR', shape: 'BOX',
      size: [0.32 * b, 0.86, 0.32 * b], position: [0, -0.9, 0], rotation: [-18, 0, 0], pivot: [0, 0.38, 0],
      uvRegion: [0.84, 0.62, 0.12, 0.18], material: M(0.84, 0.32), hitGroup: 'ARM', hitWeight: 0.04,
    },
    {
      id: 'legL', name: 'Thigh L', parent: 'pelvis', shape: 'CAPSULE',
      size: [0.42 * b, 1.05, 0.42 * b], position: [-0.36 * b, -0.42, 0], rotation: [0, 0, 0], pivot: [0, 0.48, 0],
      uvRegion: [0.3, 0.63, 0.16, 0.18], material: M(0.86, 0.3), hitGroup: 'LEG', hitWeight: 0.06,
    },
    {
      id: 'legR', name: 'Thigh R', parent: 'pelvis', shape: 'CAPSULE',
      size: [0.42 * b, 1.05, 0.42 * b], position: [0.36 * b, -0.42, 0], rotation: [0, 0, 0], pivot: [0, 0.48, 0],
      uvRegion: [0.54, 0.63, 0.16, 0.18], material: M(0.86, 0.3), hitGroup: 'LEG', hitWeight: 0.06,
    },
    {
      id: 'shinL', name: 'Shin L', parent: 'legL', shape: 'BOX',
      size: [0.38 * b, 0.96, 0.4 * b], position: [0, -1.0, 0], rotation: [0, 0, 0], pivot: [0, 0.44, 0],
      uvRegion: [0.3, 0.8, 0.16, 0.14], material: M(0.85, 0.3), hitGroup: 'LEG', hitWeight: 0.05,
    },
    {
      id: 'shinR', name: 'Shin R', parent: 'legR', shape: 'BOX',
      size: [0.38 * b, 0.96, 0.4 * b], position: [0, -1.0, 0], rotation: [0, 0, 0], pivot: [0, 0.44, 0],
      uvRegion: [0.54, 0.8, 0.16, 0.14], material: M(0.85, 0.3), hitGroup: 'LEG', hitWeight: 0.05,
    },
    {
      id: 'footL', name: 'Foot L', parent: 'shinL', shape: 'BOX',
      size: [0.46 * b, 0.24, 0.72 * b], position: [0, -0.6, 0.1], rotation: [0, 0, 0],
      uvRegion: [0.3, 0.93, 0.16, 0.06], material: M(0.8, 0.4), hitGroup: 'LEG', hitWeight: 0.02,
    },
    {
      id: 'footR', name: 'Foot R', parent: 'shinR', shape: 'BOX',
      size: [0.46 * b, 0.24, 0.72 * b], position: [0, -0.6, 0.1], rotation: [0, 0, 0],
      uvRegion: [0.54, 0.93, 0.16, 0.06], material: M(0.8, 0.4), hitGroup: 'LEG', hitWeight: 0.02,
    },
    {
      id: 'thrusterCore', name: 'Dorsal Thruster', parent: 'torso', shape: 'CONE',
      size: [0.4, 0.7, 0.4], position: [0, -0.35, -0.62 * b], rotation: [180, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 2),
    },
  ];

  if (o.winged) {
    parts.push(
      {
        id: 'wingL', name: 'Aero Wing L', parent: 'torso', shape: 'WEDGE',
        size: [1.9, 0.16, 1.1], position: [-1.15 * b, 0.2, -0.5], rotation: [0, 14, 18],
        uvRegion: [0.0, 0.1, 0.22, 0.22], material: M(0.9, 0.2, glow, 0.3), hitGroup: 'WING', hitWeight: 0.04,
      },
      {
        id: 'wingR', name: 'Aero Wing R', parent: 'torso', shape: 'WEDGE',
        size: [1.9, 0.16, 1.1], position: [1.15 * b, 0.2, -0.5], rotation: [0, -14, -18],
        uvRegion: [0.78, 0.1, 0.22, 0.22], material: M(0.9, 0.2, glow, 0.3), hitGroup: 'WING', hitWeight: 0.04,
      },
    );
  }
  if (o.heavy) {
    parts.push({
      id: 'backCannon', name: 'Shoulder Cannon', parent: 'shoulderR', shape: 'CYLINDER',
      size: [0.28, 1.5, 0.28], position: [0.28, 0.45, -0.2], rotation: [90, 0, 0],
      uvRegion: [0.7, 0.12, 0.2, 0.12], material: M(0.95, 0.18), hitGroup: 'WEAPON', hitWeight: 0.03,
    });
  }
  return parts;
}

function mechSockets(): RigSocketDef[] {
  return [
    { id: 'hand_r', name: 'Right Hand', partId: 'foreR', position: [0, -0.5, 0.1], rotation: [0, 0, 0], accepts: ['WEAPON'] },
    { id: 'hand_l', name: 'Left Hand', partId: 'foreL', position: [0, -0.5, 0.1], rotation: [0, 0, 0], accepts: ['WEAPON', 'SHIELD'] },
    { id: 'back', name: 'Dorsal Mount', partId: 'torso', position: [0, 0.2, -0.6], rotation: [0, 0, 0], accepts: ['THRUSTER', 'WEAPON'] },
    { id: 'cam_tps', name: 'TPS Camera Rail', partId: 'torso', position: [0, 1.1, -4.2], rotation: [-8, 0, 0], accepts: ['CAMERA'] },
  ];
}

interface ShipOptions {
  span?: number;
  length?: number;
  glow?: string;
  capital?: boolean;
}

function aerospaceParts(o: ShipOptions = {}): RigPartDef[] {
  const span = o.span ?? 4.4;
  const len = o.length ?? 5.2;
  const glow = o.glow ?? '#00f0ff';
  return [
    {
      id: 'hull', name: 'Primary Hull', parent: null, shape: 'WEDGE',
      size: [1.5, 0.85, len], position: [0, 0, 0], rotation: [0, 0, 0],
      uvRegion: [0.3, 0.3, 0.4, 0.4], material: M(0.92, 0.2, glow, 0.2), hitGroup: 'HULL', hitWeight: 0.4,
    },
    {
      id: 'nose', name: 'Nose Cone', parent: 'hull', shape: 'CONE',
      size: [1.1, 1.7, 1.1], position: [0, 0, len * 0.62], rotation: [90, 0, 0],
      uvRegion: [0.42, 0.06, 0.16, 0.18], material: M(0.9, 0.22), hitGroup: 'HULL', hitWeight: 0.08,
    },
    {
      id: 'canopy', name: 'Canopy', parent: 'hull', shape: 'SPHERE',
      size: [0.8, 0.5, 1.2], position: [0, 0.42, len * 0.16], rotation: [0, 0, 0],
      uvRegion: [0.4, 0.24, 0.2, 0.14], material: { ...M(0.2, 0.05, glow, 1.2), opacity: 0.75 },
    },
    {
      id: 'wingL', name: 'Port Wing', parent: 'hull', shape: 'WEDGE',
      size: [span, 0.14, 1.9], position: [-span * 0.56, -0.05, -0.35], rotation: [0, 10, 6],
      uvRegion: [0.02, 0.34, 0.26, 0.3], material: M(0.9, 0.24), hitGroup: 'WING', hitWeight: 0.12,
    },
    {
      id: 'wingR', name: 'Starboard Wing', parent: 'hull', shape: 'WEDGE',
      size: [span, 0.14, 1.9], position: [span * 0.56, -0.05, -0.35], rotation: [0, -10, -6],
      uvRegion: [0.72, 0.34, 0.26, 0.3], material: M(0.9, 0.24), hitGroup: 'WING', hitWeight: 0.12,
    },
    {
      id: 'finL', name: 'Port Fin', parent: 'wingL', shape: 'WEDGE',
      size: [0.12, 0.9, 1.1], position: [-span * 0.42, 0.4, -0.5], rotation: [0, 0, -12],
      uvRegion: [0.04, 0.68, 0.14, 0.2], material: M(0.88, 0.3, glow, 0.4), hitGroup: 'WING', hitWeight: 0.04,
    },
    {
      id: 'finR', name: 'Starboard Fin', parent: 'wingR', shape: 'WEDGE',
      size: [0.12, 0.9, 1.1], position: [span * 0.42, 0.4, -0.5], rotation: [0, 0, 12],
      uvRegion: [0.82, 0.68, 0.14, 0.2], material: M(0.88, 0.3, glow, 0.4), hitGroup: 'WING', hitWeight: 0.04,
    },
    {
      id: 'engineL', name: 'Port Engine', parent: 'hull', shape: 'CYLINDER',
      size: [0.6, 2.0, 0.6], position: [-0.72, -0.1, -len * 0.45], rotation: [90, 0, 0],
      uvRegion: [0.2, 0.72, 0.16, 0.2], material: M(0.95, 0.18), hitGroup: 'HULL', hitWeight: 0.08,
    },
    {
      id: 'engineR', name: 'Starboard Engine', parent: 'hull', shape: 'CYLINDER',
      size: [0.6, 2.0, 0.6], position: [0.72, -0.1, -len * 0.45], rotation: [90, 0, 0],
      uvRegion: [0.64, 0.72, 0.16, 0.2], material: M(0.95, 0.18), hitGroup: 'HULL', hitWeight: 0.08,
    },
    {
      id: 'thrusterCore', name: 'Thruster Plume', parent: 'hull', shape: 'CONE',
      size: [0.9, 1.6, 0.9], position: [0, -0.05, -len * 0.72], rotation: [-90, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 2.8),
    },
    ...(o.capital
      ? ([
          {
            id: 'towerA', name: 'Command Tower', parent: 'hull', shape: 'BOX',
            size: [1.2, 1.5, 2.2], position: [0, 0.9, -len * 0.2], rotation: [0, 0, 0],
            uvRegion: [0.36, 0.1, 0.28, 0.18], material: M(0.9, 0.25, glow, 0.3), hitGroup: 'HULL', hitWeight: 0.1,
          },
          {
            id: 'turretA', name: 'Dorsal Turret', parent: 'towerA', shape: 'CYLINDER',
            size: [0.7, 0.5, 0.7], position: [0, 0.95, 0.4], rotation: [0, 0, 0],
            uvRegion: [0.44, 0.02, 0.12, 0.08], material: M(0.95, 0.2), hitGroup: 'WEAPON', hitWeight: 0.05,
          },
        ] as RigPartDef[])
      : []),
  ];
}

function shipSockets(): RigSocketDef[] {
  return [
    { id: 'gun_l', name: 'Port Hardpoint', partId: 'wingL', position: [-1.4, 0, 0.9], rotation: [0, 0, 0], accepts: ['WEAPON'] },
    { id: 'gun_r', name: 'Starboard Hardpoint', partId: 'wingR', position: [1.4, 0, 0.9], rotation: [0, 0, 0], accepts: ['WEAPON'] },
    { id: 'cam_chase', name: 'Chase Camera', partId: 'hull', position: [0, 1.6, -7], rotation: [-6, 0, 0], accepts: ['CAMERA'] },
  ];
}

function droneParts(glow = '#ff3355'): RigPartDef[] {
  return [
    {
      id: 'hull', name: 'Drone Core', parent: null, shape: 'SPHERE',
      size: [1.3, 1.1, 1.3], position: [0, 0, 0], rotation: [0, 0, 0],
      uvRegion: [0.3, 0.28, 0.4, 0.42], material: M(0.9, 0.25, glow, 0.35), hitGroup: 'HULL', hitWeight: 0.4,
    },
    {
      id: 'eye', name: 'Optic Lens', parent: 'hull', shape: 'CYLINDER',
      size: [0.5, 0.14, 0.5], position: [0, 0, 0.62], rotation: [90, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 3.2), hitGroup: 'HEAD', hitWeight: 0.15,
    },
    {
      id: 'ringA', name: 'Gyro Ring', parent: 'hull', shape: 'CYLINDER',
      size: [2.1, 0.1, 2.1], position: [0, 0, 0], rotation: [0, 0, 0],
      uvRegion: [0.1, 0.1, 0.8, 0.1], material: M(0.95, 0.18, glow, 0.5),
    },
    {
      id: 'podL', name: 'Port Pod', parent: 'hull', shape: 'CAPSULE',
      size: [0.34, 1.0, 0.34], position: [-0.95, -0.1, 0], rotation: [90, 0, 0],
      uvRegion: [0.05, 0.4, 0.16, 0.22], material: M(0.9, 0.24), hitGroup: 'WEAPON', hitWeight: 0.12,
    },
    {
      id: 'podR', name: 'Starboard Pod', parent: 'hull', shape: 'CAPSULE',
      size: [0.34, 1.0, 0.34], position: [0.95, -0.1, 0], rotation: [90, 0, 0],
      uvRegion: [0.79, 0.4, 0.16, 0.22], material: M(0.9, 0.24), hitGroup: 'WEAPON', hitWeight: 0.12,
    },
    {
      id: 'thrusterCore', name: 'Hover Jet', parent: 'hull', shape: 'CONE',
      size: [0.6, 0.9, 0.6], position: [0, -0.7, 0], rotation: [180, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 2.4),
    },
  ];
}

function droneClips(): RigClipDef[] {
  return [
    {
      id: 'idle', name: 'Hover Scan', duration: 2.4, loop: true,
      tracks: [
        { partId: 'hull', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.22 }, { t: 1, v: 0 }] },
        { partId: 'ringA', channel: 'rotY', keys: [{ t: 0, v: 0 }, { t: 1, v: 360 }] },
        { partId: 'eye', channel: 'rotZ', keys: [{ t: 0, v: -10 }, { t: 0.5, v: 10 }, { t: 1, v: -10 }] },
      ],
    },
    {
      id: 'fire', name: 'Pod Salvo', duration: 0.3, loop: false,
      tracks: [
        { partId: 'podL', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.2, v: -0.2 }, { t: 1, v: 0 }] },
        { partId: 'podR', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.2, v: -0.2 }, { t: 1, v: 0 }] },
        { partId: 'eye', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.2, v: 1.6 }, { t: 1, v: 1 }] },
      ],
    },
  ];
}

function weaponParts(glow: string, barrelLen = 1.9): RigPartDef[] {
  return [
    {
      id: 'hull', name: 'Receiver', parent: null, shape: 'BOX',
      size: [0.3, 0.42, 1.2], position: [0, 0, 0], rotation: [0, 0, 0],
      uvRegion: [0.28, 0.36, 0.44, 0.28], material: M(0.95, 0.2), hitGroup: 'WEAPON', hitWeight: 0.5,
    },
    {
      id: 'barrel', name: 'Barrel Assembly', parent: 'hull', shape: 'CYLINDER',
      size: [0.18, barrelLen, 0.18], position: [0, 0.04, barrelLen * 0.5 + 0.5], rotation: [90, 0, 0],
      uvRegion: [0.55, 0.3, 0.4, 0.16], material: M(0.96, 0.16),
    },
    {
      id: 'coil', name: 'Accelerator Coil', parent: 'barrel', shape: 'CYLINDER',
      size: [0.32, 0.5, 0.32], position: [0, 0.2, 0], rotation: [0, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 2.4),
    },
    {
      id: 'grip', name: 'Grip', parent: 'hull', shape: 'BOX',
      size: [0.16, 0.5, 0.24], position: [0, -0.42, -0.2], rotation: [12, 0, 0],
      uvRegion: [0.3, 0.66, 0.14, 0.2], material: M(0.6, 0.6),
    },
    {
      id: 'mag', name: 'Cell Magazine', parent: 'hull', shape: 'BOX',
      size: [0.22, 0.5, 0.4], position: [0, -0.36, 0.2], rotation: [0, 0, 0],
      uvRegion: [0.5, 0.66, 0.18, 0.2], material: M(0.7, 0.4, glow, 0.6),
    },
    {
      id: 'sight', name: 'Holo Sight', parent: 'hull', shape: 'PLATE',
      size: [0.2, 0.18, 0.02], position: [0, 0.34, 0.1], rotation: [0, 0, 0],
      uvRegion: [0, 0, 1, 1], material: GLOW(glow, 3),
    },
  ];
}

function weaponClips(): RigClipDef[] {
  return [
    {
      id: 'idle', name: 'Ready Sway', duration: 3, loop: true,
      tracks: [
        { partId: 'hull', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.02 }, { t: 1, v: 0 }] },
        { partId: 'hull', channel: 'rotZ', keys: [{ t: 0, v: -1 }, { t: 0.5, v: 1 }, { t: 1, v: -1 }] },
      ],
    },
    {
      id: 'fire', name: 'Recoil', duration: 0.22, loop: false,
      tracks: [
        { partId: 'hull', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.25, v: -0.22 }, { t: 1, v: 0 }] },
        { partId: 'hull', channel: 'rotX', keys: [{ t: 0, v: 0 }, { t: 0.25, v: 7 }, { t: 1, v: 0 }] },
        { partId: 'coil', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.2, v: 1.8 }, { t: 1, v: 1 }] },
      ],
    },
  ];
}

function mural(id: string, name: string, type: MosaicCharacterType, description: string): CharacterRigDef {
  return {
    id, name, archetype: 'STATIC_PROP', characterType: type, description,
    height: 4, scale: 1,
    parts: [
      {
        id: 'hull', name: 'Mosaic Slab', parent: null, shape: 'BOX',
        size: [4.2, 6.2, 0.5], position: [0, 3.1, 0], rotation: [0, 0, 0],
        uvRegion: [0, 0, 1, 1], material: M(0.4, 0.7, '#ffb347', 0.15), hitGroup: 'HULL', hitWeight: 1,
      },
      {
        id: 'frame', name: 'Gilded Frame', parent: 'hull', shape: 'BOX',
        size: [4.6, 6.6, 0.28], position: [0, 0, -0.16], rotation: [0, 0, 0],
        uvRegion: [0, 0, 1, 1], material: M(0.95, 0.25, '#ffcc66', 0.5),
      },
    ],
    sockets: [],
    clips: [
      {
        id: 'idle', name: 'Ambient Shimmer', duration: 6, loop: true,
        tracks: [{ partId: 'hull', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.005 }, { t: 1, v: 1 }] }],
      },
    ],
    defaultClip: 'idle',
    tags: ['prop', 'mosaic'],
  };
}

/* ------------------------------------------------------------------ */
/* The expanded character map                                          */
/* ------------------------------------------------------------------ */

export const CHARACTER_RIGS: Record<MosaicCharacterType, CharacterRigDef> = {
  HERO_MECH_FRONT: {
    id: 'rig_hero_mech', name: 'Aurora Hero Mech', archetype: 'HUMANOID_MECH',
    characterType: 'HERO_MECH_FRONT',
    description: 'Player chassis: 19 volumetric parts, painted plating mapped per-limb, four combat clips.',
    height: 4.2, scale: 1,
    parts: humanoidMechParts({ bulk: 1, glow: '#00f0ff' }),
    sockets: mechSockets(),
    clips: [bipedIdle(), bipedRun(), bipedFire(), bipedHit()],
    defaultClip: 'idle', tags: ['player', 'mech', 'tps'],
  },
  HERO_MECH_BACK: {
    id: 'rig_hero_mech_rear', name: 'Aurora Hero Mech (Rear Plating)', archetype: 'HUMANOID_MECH',
    characterType: 'HERO_MECH_BACK',
    description: 'Rear-plate variant used for dorsal art on the same joint hierarchy.',
    height: 4.2, scale: 1,
    parts: humanoidMechParts({ bulk: 1, glow: '#2ee6ff' }),
    sockets: mechSockets(),
    clips: [bipedIdle(), bipedRun(), bipedHit()],
    defaultClip: 'idle', tags: ['player', 'mech'],
  },
  VALKYRIE_GUNDAM: {
    id: 'rig_valkyrie', name: 'Valkyrie Gundam Striker', archetype: 'HUMANOID_MECH',
    characterType: 'VALKYRIE_GUNDAM',
    description: 'Winged aerial striker: humanoid rig plus articulated aero wings and gold tesserae plating.',
    height: 4.6, scale: 1.05,
    parts: humanoidMechParts({ bulk: 1.05, glow: '#ffc65c', winged: true }),
    sockets: mechSockets(),
    clips: [
      bipedIdle(), bipedRun(), bipedFire(), bipedHit(),
      {
        id: 'boost', name: 'Aero Boost', duration: 1.4, loop: true,
        tracks: [
          { partId: 'torso', channel: 'rotX', keys: [{ t: 0, v: 22 }, { t: 1, v: 22 }] },
          { partId: 'wingL', channel: 'rotZ', keys: [{ t: 0, v: 10 }, { t: 0.5, v: 34 }, { t: 1, v: 10 }] },
          { partId: 'wingR', channel: 'rotZ', keys: [{ t: 0, v: -10 }, { t: 0.5, v: -34 }, { t: 1, v: -10 }] },
          { partId: 'thrusterCore', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.7 }, { t: 1, v: 1 }] },
          { partId: 'legL', channel: 'rotX', keys: [{ t: 0, v: -28 }, { t: 1, v: -28 }] },
          { partId: 'legR', channel: 'rotX', keys: [{ t: 0, v: -34 }, { t: 1, v: -34 }] },
        ],
      },
    ],
    defaultClip: 'idle', tags: ['ally', 'mech', 'flight'],
  },
  GOLIATH_TITAN: {
    id: 'rig_goliath', name: 'Goliath Titan', archetype: 'HUMANOID_MECH',
    characterType: 'GOLIATH_TITAN',
    description: 'Heavy assault titan: widened bulk, shoulder cannon hardpoint, slower stomping gait.',
    height: 5.6, scale: 1.35,
    parts: humanoidMechParts({ bulk: 1.35, glow: '#ff2f4d', heavy: true }),
    sockets: mechSockets(),
    clips: [
      bipedIdle(),
      { ...bipedRun(), id: 'run', name: 'Siege Stomp', duration: 1.15 },
      bipedFire(), bipedHit(),
    ],
    defaultClip: 'idle', tags: ['enemy', 'heavy', 'tps'],
  },
  SENTINEL_DROID: {
    id: 'rig_sentinel', name: 'Sentinel Droid', archetype: 'BIPED_TROOPER',
    characterType: 'SENTINEL_DROID',
    description: 'Lean FPS sentinel: slim humanoid rig tuned for fast strafing and hip-fire animation.',
    height: 3.4, scale: 0.82,
    parts: humanoidMechParts({ bulk: 0.8, glow: '#ff6a00' }),
    sockets: mechSockets(),
    clips: [bipedIdle(), { ...bipedRun(), duration: 0.6 }, bipedFire(), bipedHit()],
    defaultClip: 'idle', tags: ['enemy', 'fps'],
  },
  CYBER_PILOT: {
    id: 'rig_pilot', name: 'Cyber Pilot', archetype: 'BIPED_TROOPER',
    characterType: 'CYBER_PILOT',
    description: 'Human-scale pilot rig used in hangar scenes and cockpit cutaways.',
    height: 1.85, scale: 0.45,
    parts: humanoidMechParts({ bulk: 0.75, glow: '#7ce7ff' }),
    sockets: mechSockets(),
    clips: [bipedIdle(), bipedRun(), bipedHit()],
    defaultClip: 'idle', tags: ['npc', 'human'],
  },
  MECH_ARMOR: {
    id: 'rig_mech_armor', name: 'Cyber Mech Armor Suit', archetype: 'HUMANOID_MECH',
    characterType: 'MECH_ARMOR',
    description: 'Armour display rig — every plate is an independent part so the assembly modal can swap them.',
    height: 4.0, scale: 1,
    parts: humanoidMechParts({ bulk: 1.1, glow: '#b98cff' }),
    sockets: mechSockets(),
    clips: [
      bipedIdle(),
      {
        id: 'exploded', name: 'Exploded Assembly', duration: 3, loop: true,
        tracks: [
          { partId: 'shoulderL', channel: 'posX', keys: [{ t: 0, v: 0 }, { t: 0.5, v: -0.6 }, { t: 1, v: 0 }] },
          { partId: 'shoulderR', channel: 'posX', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.6 }, { t: 1, v: 0 }] },
          { partId: 'head', channel: 'posY', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.6 }, { t: 1, v: 0 }] },
          { partId: 'torso', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 0.35 }, { t: 1, v: 0 }] },
        ],
      },
    ],
    defaultClip: 'idle', tags: ['armory'],
  },
  STARFIGHTER_INTERCEPTOR: {
    id: 'rig_starfighter', name: 'Starfighter Interceptor', archetype: 'AEROSPACE_FRAME',
    characterType: 'STARFIGHTER_INTERCEPTOR',
    description: 'Player space frame: hull, nose, canopy, twin swept wings, fins, dual engines and plume.',
    height: 1.6, scale: 1,
    parts: aerospaceParts({ span: 4.6, length: 5.4, glow: '#00f0ff' }),
    sockets: shipSockets(),
    clips: [flightIdle(), flightBank(), {
      id: 'fire', name: 'Cannon Burst', duration: 0.24, loop: false,
      tracks: [
        { partId: 'hull', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.3, v: -0.18 }, { t: 1, v: 0 }] },
        { partId: 'nose', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.25, v: 1.08 }, { t: 1, v: 1 }] },
      ],
    }],
    defaultClip: 'idle', tags: ['player', 'space'],
  },
  STEALTH_CORVETTE: {
    id: 'rig_corvette', name: 'Stealth Corvette', archetype: 'AEROSPACE_FRAME',
    characterType: 'STEALTH_CORVETTE',
    description: 'Angular raider with narrow span and dampened emissive plating.',
    height: 1.8, scale: 1.25,
    parts: aerospaceParts({ span: 3.6, length: 7.2, glow: '#8affc1' }),
    sockets: shipSockets(),
    clips: [flightIdle(), flightBank()],
    defaultClip: 'idle', tags: ['enemy', 'space'],
  },
  CRUISER_BOSS: {
    id: 'rig_cruiser', name: 'Cruiser Boss', archetype: 'CAPITAL_SHIP',
    characterType: 'CRUISER_BOSS',
    description: 'Capital hull with command tower and dorsal turret; parts are individually destructible.',
    height: 5, scale: 3.1,
    parts: aerospaceParts({ span: 6.5, length: 12, glow: '#ff2f4d', capital: true }),
    sockets: shipSockets(),
    clips: [
      flightIdle(),
      {
        id: 'fire', name: 'Turret Sweep', duration: 2.2, loop: true,
        tracks: [
          { partId: 'turretA', channel: 'rotY', keys: [{ t: 0, v: -45 }, { t: 0.5, v: 45 }, { t: 1, v: -45 }] },
          { partId: 'towerA', channel: 'rotY', keys: [{ t: 0, v: -6 }, { t: 0.5, v: 6 }, { t: 1, v: -6 }] },
        ],
      },
    ],
    defaultClip: 'idle', tags: ['boss', 'space'],
  },
  CYBER_DRONE: {
    id: 'rig_drone', name: 'Cyber Drone Fighter', archetype: 'HOVER_DRONE',
    characterType: 'CYBER_DRONE',
    description: 'Spherical hover core with spinning gyro ring and twin weapon pods.',
    height: 1.6, scale: 1,
    parts: droneParts('#ff3355'),
    sockets: [
      { id: 'gun_c', name: 'Core Emitter', partId: 'eye', position: [0, 0, 0.3], rotation: [0, 0, 0], accepts: ['WEAPON'] },
    ],
    clips: droneClips(),
    defaultClip: 'idle', tags: ['enemy', 'drone'],
  },
  PLASMA_RIFLE: {
    id: 'rig_plasma_rifle', name: 'Cyber Plasma Rifle', archetype: 'HANDHELD_WEAPON',
    characterType: 'PLASMA_RIFLE',
    description: 'FPS viewmodel rig: receiver, barrel, coil, grip, cell magazine and holo sight.',
    height: 0.5, scale: 1,
    parts: weaponParts('#00f0ff', 1.8),
    sockets: [
      { id: 'muzzle', name: 'Muzzle', partId: 'barrel', position: [0, 1.0, 0], rotation: [0, 0, 0], accepts: ['FX'] },
      { id: 'grip_hand', name: 'Grip Anchor', partId: 'grip', position: [0, -0.2, 0], rotation: [0, 0, 0], accepts: ['WEAPON'] },
    ],
    clips: weaponClips(),
    defaultClip: 'idle', tags: ['weapon', 'fps'],
  },
  GAUSS_RAILGUN: {
    id: 'rig_gauss', name: 'Gauss Railgun', archetype: 'HANDHELD_WEAPON',
    characterType: 'GAUSS_RAILGUN',
    description: 'Long-barrel magnetic accelerator with heavier recoil clip.',
    height: 0.6, scale: 1.15,
    parts: weaponParts('#ffc65c', 2.8),
    sockets: [
      { id: 'muzzle', name: 'Muzzle', partId: 'barrel', position: [0, 1.5, 0], rotation: [0, 0, 0], accepts: ['FX'] },
    ],
    clips: [
      weaponClips()[0]!,
      {
        id: 'fire', name: 'Rail Discharge', duration: 0.5, loop: false,
        tracks: [
          { partId: 'hull', channel: 'posZ', keys: [{ t: 0, v: 0 }, { t: 0.2, v: -0.45 }, { t: 1, v: 0 }] },
          { partId: 'hull', channel: 'rotX', keys: [{ t: 0, v: 0 }, { t: 0.2, v: 13 }, { t: 1, v: 0 }] },
          { partId: 'coil', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.15, v: 2.3 }, { t: 1, v: 1 }] },
        ],
      },
    ],
    defaultClip: 'idle', tags: ['weapon', 'heavy'],
  },
  BEAM_SABER: {
    id: 'rig_beam_saber', name: 'Beam Saber', archetype: 'HANDHELD_WEAPON',
    characterType: 'BEAM_SABER',
    description: 'Melee hilt with a projected plasma blade volume that scales on ignition.',
    height: 2.2, scale: 1,
    parts: [
      {
        id: 'hull', name: 'Hilt', parent: null, shape: 'CYLINDER',
        size: [0.16, 0.8, 0.16], position: [0, 0, 0], rotation: [0, 0, 0],
        uvRegion: [0.4, 0.55, 0.2, 0.4], material: M(0.95, 0.2), hitGroup: 'WEAPON', hitWeight: 0.4,
      },
      {
        id: 'emitter', name: 'Emitter Ring', parent: 'hull', shape: 'CYLINDER',
        size: [0.22, 0.12, 0.22], position: [0, 0.46, 0], rotation: [0, 0, 0],
        uvRegion: [0.42, 0.44, 0.16, 0.08], material: M(0.9, 0.15, '#8affff', 1.2),
      },
      {
        id: 'blade', name: 'Plasma Blade', parent: 'emitter', shape: 'CAPSULE',
        size: [0.16, 2.2, 0.16], position: [0, 1.2, 0], rotation: [0, 0, 0],
        uvRegion: [0, 0, 1, 1], material: { metalness: 0, roughness: 0.1, emissive: '#8affff', emissiveIntensity: 3.4, glowOnly: true, opacity: 0.9 },
      },
    ],
    sockets: [{ id: 'tip', name: 'Blade Tip', partId: 'blade', position: [0, 1.1, 0], rotation: [0, 0, 0], accepts: ['FX'] }],
    clips: [
      {
        id: 'idle', name: 'Ignition Hum', duration: 1.6, loop: true,
        tracks: [{ partId: 'blade', channel: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.04 }, { t: 1, v: 1 }] }],
      },
      {
        id: 'fire', name: 'Overhead Slash', duration: 0.45, loop: false,
        tracks: [
          { partId: 'hull', channel: 'rotX', keys: [{ t: 0, v: -70 }, { t: 0.4, v: 60 }, { t: 1, v: -70 }] },
          { partId: 'hull', channel: 'rotZ', keys: [{ t: 0, v: 20 }, { t: 0.4, v: -25 }, { t: 1, v: 20 }] },
        ],
      },
    ],
    defaultClip: 'idle', tags: ['weapon', 'melee'],
  },
  ROMAN_CYBER_MOSAIC: mural(
    'rig_mural_roman', 'Roman Cyber Mosaic', 'ROMAN_CYBER_MOSAIC',
    'Arena mural prop: slab plus gilded frame, lit by the level emissive pass.',
  ),
  DEEP_SPACE_NEBULA: mural(
    'rig_mural_nebula', 'Deep Space Nebula Panel', 'DEEP_SPACE_NEBULA',
    'Skybox-facing painted panel used for hangar and space station dressing.',
  ),
};

export const RIG_LIST: CharacterRigDef[] = Object.values(CHARACTER_RIGS);

export function getRig(type: MosaicCharacterType): CharacterRigDef {
  return CHARACTER_RIGS[type];
}
