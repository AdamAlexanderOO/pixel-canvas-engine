import * as THREE from 'three';

export type ArcadeWorld = 'SPACE' | 'ARENA' | 'RUNNER';

function tokenColor(name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Color();
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  context.fillRect(0, 0, 1, 1);
  const pixel = context.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, THREE.SRGBColorSpace);
}

/** Decorative geometry only: never participates in collision or game state. */
export function addArcadeArtDirection(scene: THREE.Scene, world: ArcadeWorld, compact = false) {
  const color = tokenColor;
  const cyan = color('--arcade-cyan');
  const coral = color('--arcade-coral');
  const steel = color('--arcade-steel');
  const white = color('--arcade-text');
  const group = new THREE.Group();
  group.name = 'Arcade scenery';
  scene.add(group);
  const materials: THREE.Material[] = [];
  const solid = new THREE.MeshStandardMaterial({ color: steel, roughness: 0.72, metalness: 0.35 });
  const neon = new THREE.MeshBasicMaterial({ color: cyan });
  const warm = new THREE.MeshBasicMaterial({ color: coral });
  materials.push(solid, neon, warm);
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    group.add(object);
    return object;
  };
  const fill = new THREE.HemisphereLight(white, steel, 1.4);
  const rim = new THREE.DirectionalLight(coral, 2.4);
  rim.position.set(-16, 14, -12);
  group.add(fill, rim);

  if (world === 'SPACE') {
    const planetMat = new THREE.MeshStandardMaterial({ color: steel, roughness: 1, metalness: 0.1 });
    materials.push(planetMat);
    const radius = compact ? 9 : 85;
    const planet = mesh(new THREE.SphereGeometry(radius, 32, 24), planetMat, compact ? 24 : 270, compact ? 13 : 120, compact ? -95 : -620);
    const ringMat = new THREE.MeshBasicMaterial({ color: coral, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    materials.push(ringMat);
    const ring = mesh(new THREE.RingGeometry(radius * 1.35, radius * 1.9, 64), ringMat, planet.position.x, planet.position.y, planet.position.z);
    ring.rotation.set(1.05, 0.25, 0.3);
    for (let i = 0; i < 5; i++) {
      const beacon = mesh(new THREE.TorusGeometry(compact ? 13 : 45, compact ? 0.06 : 0.3, 6, 64), neon, 0, 0, -(compact ? 28 : 150) - i * (compact ? 24 : 120));
      beacon.rotation.z = i * 0.15;
    }
  } else {
    const floorY = compact ? -2.5 : 0;
    for (let i = 0; i < 22; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -14 - Math.floor(i / 2) * 7;
      const height = 6 + ((i * 7) % 13);
      const x = side * (world === 'RUNNER' ? 12 : compact ? 18 : 58);
      mesh(new THREE.BoxGeometry(4, height, 4), solid, x, floorY + height / 2, z);
      for (let row = 1; row < height; row += 2) {
        mesh(new THREE.BoxGeometry(2.8, 0.12, 4.05), i % 3 === 0 ? warm : neon, x, floorY + row, z);
      }
    }
    if (compact) {
      const floor = mesh(new THREE.PlaneGeometry(100, 180), solid, 0, floorY - 0.02, -40);
      floor.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 9; i++) {
        mesh(new THREE.BoxGeometry(0.09, 0.05, 180), neon, -8 + i * 2, floorY + 0.04, -40);
      }
    }
  }

  return () => {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    materials.forEach((material) => material.dispose());
    scene.remove(group);
  };
}

export function detailArcadeCharacter(group: THREE.Group, runner: boolean) {
  const armor = new THREE.MeshStandardMaterial({ color: tokenColor('--arcade-text'), metalness: 0.45, roughness: 0.55 });
  const glow = new THREE.MeshBasicMaterial({ color: tokenColor('--arcade-cyan') });
  const scale = runner ? 0.48 : 1;
  const part = (size: [number, number, number], pos: [number, number, number], luminous = false) => {
    const item = new THREE.Mesh(new THREE.BoxGeometry(...size.map((v) => v * scale) as [number, number, number]), luminous ? glow : armor);
    item.position.set(...pos.map((v) => v * scale) as [number, number, number]);
    group.add(item);
  };
  if (runner) part([0.9, 0.8, 0.8], [0, 0.25, 0]);
  part([0.65, 0.12, 0.1], [0, runner ? 0.25 : 1.45, -0.45], true);
  for (const side of [-1, 1]) {
    part([0.55, 1.4, 0.7], [side * 0.55, runner ? -3.7 : -1.65, 0]);
    part([0.65, 0.35, 1.05], [side * 0.55, runner ? -4.5 : -2.25, -0.2]);
    part([0.45, 1.35, 0.55], [side * 1.3, runner ? -2 : -0.35, 0]);
    part([0.15, 0.7, 0.15], [side * 0.55, runner ? -3.7 : -1.65, -0.4], true);
  }
  return () => { armor.dispose(); glow.dispose(); };
}