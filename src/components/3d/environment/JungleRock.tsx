"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getRiverCenterX,
  getRiverHalfWidth,
  getTerrainHeight,
  mulberry32,
} from "@/lib/procedural-noise";
import { AMAZON_SPECIES } from "@/data/species";
import { getRainforestTextures } from "@/lib/procedural-textures";

function createMossyBoulderGeo(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.95, 11, 8);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cStone = new THREE.Color("#64748b");
  const cDark = new THREE.Color("#475569");
  const cMoss = new THREE.Color("#3f7d3a");
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const disp = 0.85 + 0.25 * Math.sin(x * 2.4 + z * 1.9) * Math.cos(y * 2.9);
    x *= disp * 1.15;
    y *= disp * 0.68;
    z *= disp;
    pos.setXYZ(i, x, y, z);

    // Moss on top, stone underneath
    if (y > 0.16) {
      tmp.copy(cStone).lerp(cMoss, Math.min(1, (y - 0.16) * 2.2));
    } else {
      tmp.copy(cDark).lerp(cStone, Math.max(0, y + 0.5));
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function JungleRock({ count = 72 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const rockGeo = useMemo(() => createMossyBoulderGeo(), []);
  const textures = useMemo(() => getRainforestTextures(), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = mulberry32(5521);
    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 6) {
      attempts++;
      // Place many rocks naturally near riverbanks & forest hills
      const nearRiver = placed < count * 0.65;
      const z = (rand() - 0.5) * 90;
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);
      const side = rand() > 0.5 ? 1 : -1;
      const x = nearRiver
        ? riverX + side * (halfW + 0.2 + rand() * 4.5)
        : (rand() - 0.5) * 86;

      if (Math.abs(z) < 2.5 && x > -9 && x < 14) continue;
      if (AMAZON_SPECIES.some((sp) => Math.hypot(sp.position.x - x, sp.position.z - z) < 2.4)) {
        continue;
      }

      const y = getTerrainHeight(x, z);
      dummy.position.set(x, y + 0.05, z);
      dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI * 2, (rand() - 0.5) * 0.35);
      const s = 0.55 + rand() * 1.25;
      dummy.scale.set(s * (0.9 + rand() * 0.4), s * 0.75, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={ref} args={[rockGeo, undefined, count]} receiveShadow>
      <meshStandardMaterial
        vertexColors
        map={textures?.rockMap ?? null}
        roughness={0.88}
        metalness={0.04}
      />
    </instancedMesh>
  );
}
