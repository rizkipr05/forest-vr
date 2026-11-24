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

/**
 * Create a smooth organic displaced foliage puff geometry with natural leaf clustering.
 */
function createOrganicCanopyGeo(radius = 1.6, seed = 1) {
  const geo = new THREE.SphereGeometry(radius, 12, 9);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const wobble =
      1 +
      0.14 * Math.sin(x * 2.1 + seed) * Math.cos(z * 1.9 - seed) +
      0.08 * Math.sin(y * 3.0 + x);
    pos.setXYZ(i, x * wobble, y * wobble * 0.68, z * wobble);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Reusable single hero ProceduralTree with buttress roots, curved trunk,
 * forked branches, layered foliage, and hanging jungle lianas.
 */
export function ProceduralTree({
  position = [0, 0, 0],
  scale = 1,
  rotationY = 0,
  seed = 1,
}: {
  position?: [number, number, number];
  scale?: number;
  rotationY?: number;
  seed?: number;
}) {
  const textures = useMemo(() => getRainforestTextures(), []);
  const canopyGeo = useMemo(() => createOrganicCanopyGeo(1.85, seed), [seed]);
  const trunkGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.14 * Math.sin(seed), 2.4, 0.1 * Math.cos(seed)),
      new THREE.Vector3(-0.1 * Math.cos(seed), 5.0, -0.08 * Math.sin(seed)),
      new THREE.Vector3(0.05, 7.2, 0),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.36, 9, false);
  }, [seed]);

  const lianaGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.18, -1.3, 0.12),
      new THREE.Vector3(-0.12, -2.7, -0.06),
      new THREE.Vector3(0.06, -3.9, 0.08),
    ]);
    return new THREE.TubeGeometry(curve, 10, 0.035, 6, false);
  }, []);

  const barkMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#785032",
        map: textures?.barkMap ?? null,
        roughness: 0.92,
      }),
    [textures]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={trunkGeo} material={barkMaterial} castShadow receiveShadow />

      {/* Buttress roots */}
      {[0, 1.57, 3.14, 4.71].map((ang, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(ang) * 0.48, 0.55, Math.sin(ang) * 0.48]}
          rotation={[0, -ang, 0.48]}
          material={barkMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.11, 0.3, 1.5, 7]} />
        </mesh>
      ))}

      {/* Multi-layered broad rainforest umbrella crowns & forked boughs */}
      <mesh position={[-0.75, 5.85, 0.45]} rotation={[0.3, 0.2, 0.55]} material={barkMaterial} castShadow>
        <cylinderGeometry args={[0.1, 0.19, 2.3, 7]} />
      </mesh>
      <mesh position={[0.8, 6.0, -0.45]} rotation={[-0.25, -0.1, -0.58]} material={barkMaterial} castShadow>
        <cylinderGeometry args={[0.1, 0.19, 2.3, 7]} />
      </mesh>
      <mesh geometry={canopyGeo} position={[0, 7.6, 0]} scale={[1.38, 0.82, 1.32]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#2e7d32"
          map={textures?.foliageMap ?? null}
          roughness={0.8}
        />
      </mesh>
      <mesh
        geometry={canopyGeo}
        position={[-1.7, 6.55, 0.95]}
        scale={[0.98, 0.66, 0.95]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#388e3c"
          map={textures?.foliageMap ?? null}
          roughness={0.78}
        />
      </mesh>
      <mesh
        geometry={canopyGeo}
        position={[1.75, 6.7, -0.85]}
        scale={[1.02, 0.68, 0.96]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#43a047"
          map={textures?.foliageMap ?? null}
          roughness={0.78}
        />
      </mesh>
      <mesh
        geometry={canopyGeo}
        position={[0.25, 8.35, 0.35]}
        scale={[0.88, 0.6, 0.88]}
        castShadow
      >
        <meshStandardMaterial
          color="#66bb6a"
          map={textures?.foliageMap ?? null}
          roughness={0.72}
        />
      </mesh>

      {/* Hanging vines */}
      <mesh geometry={lianaGeo} position={[1.3, 6.3, 0.7]}>
        <meshStandardMaterial color="#4d7c0f" roughness={0.85} />
      </mesh>
      <mesh geometry={lianaGeo} position={[-1.1, 6.1, -0.7]} scale={[1, 0.82, 1]}>
        <meshStandardMaterial color="#65a30d" roughness={0.85} />
      </mesh>
    </group>
  );
}

/**
 * Instanced canopy forest surrounding the explorer trails and riverbanks.
 */
export function ForestCanopyInstanced({ count = 78 }: { count?: number }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownLowRef = useRef<THREE.InstancedMesh>(null);
  const crownHighRef = useRef<THREE.InstancedMesh>(null);
  const textures = useMemo(() => getRainforestTextures(), []);

  const trunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.28, 0.54, 7.6, 12, 4);
    geo.translate(0, 3.8, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setX(i, pos.getX(i) + Math.sin(y * 0.45) * 0.18);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const crownGeo = useMemo(() => createOrganicCanopyGeo(2.65, 7.3), []);

  useEffect(() => {
    const tMesh = trunkRef.current;
    const cLow = crownLowRef.current;
    const cHigh = crownHighRef.current;
    if (!tMesh || !cLow || !cHigh) return;

    const rand = mulberry32(998877);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 8) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const dist = 14 + rand() * 44;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Avoid river channel, footbridge, and player start clearing
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);
      if (Math.abs(x - riverX) < halfW + 2.8) continue;
      if (Math.hypot(x + 14, z - 8) < 6.5) continue;
      if (Math.abs(z) < 4.5 && x > -9 && x < 14) continue;

      // Avoid colliding with interactive species spots
      const nearSpecies = AMAZON_SPECIES.some(
        (sp) => Math.hypot(sp.position.x - x, sp.position.z - z) < 4.6
      );
      if (nearSpecies) continue;

      const y = getTerrainHeight(x, z);
      if (y < 0.35) continue;

      const s = 0.85 + rand() * 0.95;
      const rot = rand() * Math.PI * 2;

      dummy.position.set(x, y - 0.15, z);
      dummy.rotation.set(0, rot, 0);
      dummy.scale.set(s, s * (0.9 + rand() * 0.45), s);
      dummy.updateMatrix();
      tMesh.setMatrixAt(placed, dummy.matrix);
      color.setHSL(0.075, 0.42, 0.22 + rand() * 0.08);
      tMesh.setColorAt(placed, color);

      // Lower foliage cluster
      dummy.position.set(x + (rand() - 0.5) * 1.1, y + 6.4 * s, z + (rand() - 0.5) * 1.1);
      dummy.scale.set(s * 1.15, s * 0.85, s * 1.15);
      dummy.updateMatrix();
      cLow.setMatrixAt(placed, dummy.matrix);
      color.setHSL(0.32 + rand() * 0.06, 0.58, 0.24 + rand() * 0.1);
      cLow.setColorAt(placed, color);

      // Upper sunlit crown
      dummy.position.set(x, y + 8.1 * s, z);
      dummy.scale.set(s * 0.95, s * 0.8, s * 0.95);
      dummy.updateMatrix();
      cHigh.setMatrixAt(placed, dummy.matrix);
      color.setHSL(0.28 + rand() * 0.07, 0.65, 0.32 + rand() * 0.12);
      cHigh.setColorAt(placed, color);

      placed++;
    }

    [tMesh, cLow, cHigh].forEach((m) => {
      m.count = placed;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
  }, [count]);

  return (
    <group name="ForestCanopyInstanced">
      <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, count]} castShadow receiveShadow>
        <meshStandardMaterial map={textures?.barkMap ?? null} roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={crownLowRef} args={[crownGeo, undefined, count]} castShadow>
        <meshStandardMaterial map={textures?.foliageMap ?? null} roughness={0.84} />
      </instancedMesh>
      <instancedMesh ref={crownHighRef} args={[crownGeo, undefined, count]} castShadow>
        <meshStandardMaterial map={textures?.foliageMap ?? null} roughness={0.78} />
      </instancedMesh>
    </group>
  );
}
