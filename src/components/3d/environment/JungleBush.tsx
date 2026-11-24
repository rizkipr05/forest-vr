"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  getRiverCenterX,
  getRiverHalfWidth,
  getTerrainHeight,
  mulberry32,
} from "@/lib/procedural-noise";
import { AMAZON_SPECIES } from "@/data/species";
import { getRainforestTextures } from "@/lib/procedural-textures";

function createOrganicBushGeo(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.88, 12, 9);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const lump = 1 + 0.22 * Math.sin(x * 3.6 + z * 2.5) * Math.cos(y * 3.2);
    pos.setXYZ(i, x * lump * 1.18, Math.max(-0.2, y * lump * 0.76 + 0.36), z * lump * 1.15);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * 5-petal tropical wildflower blossom geometry (hibiscus / jungle orchid feel).
 */
function createWildflowerBlossomGeo(): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  let offset = 0;

  const petals = 5;
  for (let p = 0; p < petals; p++) {
    const ang = (p / petals) * Math.PI * 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const pts: [number, number, number][] = [
      [0, 0, 0],
      [-0.06, 0.04, 0.08],
      [0, 0.07, 0.16],
      [0.06, 0.04, 0.08],
    ];
    for (const [lx, ly, lz] of pts) {
      positions.push(lx * cos + lz * sin, ly, -lx * sin + lz * cos);
    }
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    offset += 4;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function JungleBush({ count = 120 }: { count?: number }) {
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const reedRef = useRef<THREE.InstancedMesh>(null);
  const shaderTimeRef = useRef<{ value: number }>({ value: 0 });
  const textures = useMemo(() => getRainforestTextures(), []);

  const bushGeo = useMemo(() => createOrganicBushGeo(), []);
  const flowerGeo = useMemo(() => createWildflowerBlossomGeo(), []);
  const reedGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.055, 1.35, 5);
    geo.translate(0, 0.675, 0);
    return geo;
  }, []);

  const maxFlowers = count * 3;
  const maxReeds = 110;

  const bushMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: textures?.foliageMap ?? null,
      roughness: 0.84,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shaderTimeRef.current;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float topFactor = clamp(position.y * 0.85, 0.0, 1.0);
           transformed.x += sin(uTime * 1.5 + instPos.x * 0.4 + instPos.z * 0.3) * 0.065 * topFactor;`
        );
    };
    return mat;
  }, [textures]);

  const reedMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#4d7c0f",
      roughness: 0.72,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shaderTimeRef.current;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float hFactor = clamp(position.y / 1.35, 0.0, 1.0);
           transformed.x += sin(uTime * 1.9 + instPos.z * 0.6) * 0.16 * hFactor * hFactor;`
        );
    };
    return mat;
  }, []);

  useFrame(({ clock }) => {
    shaderTimeRef.current.value = clock.getElapsedTime();
  });

  useEffect(() => {
    const mesh = bushRef.current;
    const fMesh = flowerRef.current;
    const rMesh = reedRef.current;
    if (!mesh || !fMesh || !rMesh) return;

    const rand = mulberry32(77123);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const flowerPalette = [0.96, 0.08, 0.84, 0.14]; // coral, marigold, orchid, golden-yellow
    let placed = 0;
    let fPlaced = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 7) {
      attempts++;
      const x = (rand() - 0.5) * 90;
      const z = (rand() - 0.5) * 90;
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);

      if (Math.abs(x - riverX) < halfW + 1.4) continue;
      if (Math.abs(z) < 2.6 && x > -9 && x < 14) continue;
      if (AMAZON_SPECIES.some((sp) => Math.hypot(sp.position.x - x, sp.position.z - z) < 2.7)) {
        continue;
      }

      const y = getTerrainHeight(x, z);
      if (y < 0.28) continue;

      const s = 0.65 + rand() * 0.95;
      dummy.position.set(x, y - 0.08, z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(s, s * (0.75 + rand() * 0.45), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);

      color.setHSL(0.32 + rand() * 0.06, 0.56, 0.22 + rand() * 0.16);
      mesh.setColorAt(placed, color);

      // Add vibrant 5-petal tropical wildflowers to ~60% of bushes
      if (rand() > 0.4 && fPlaced + 3 < maxFlowers) {
        const blossomHue = flowerPalette[placed % flowerPalette.length];
        for (let b = 0; b < 3; b++) {
          dummy.position.set(
            x + (rand() - 0.5) * 0.95 * s,
            y + (0.5 + rand() * 0.38) * s,
            z + (rand() - 0.5) * 0.95 * s
          );
          dummy.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI * 2, (rand() - 0.5) * 0.4);
          dummy.scale.setScalar(0.95 + rand() * 0.65);
          dummy.updateMatrix();
          fMesh.setMatrixAt(fPlaced, dummy.matrix);
          color.setHSL(blossomHue, 0.92, 0.58);
          fMesh.setColorAt(fPlaced, color);
          fPlaced++;
        }
      }

      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    fMesh.count = fPlaced;
    fMesh.instanceMatrix.needsUpdate = true;
    if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true;

    // Populate riverbank reeds along shallow water edge
    let rPlaced = 0;
    for (let i = 0; i < maxReeds; i++) {
      const z = (rand() - 0.5) * 76;
      if (Math.abs(z) < 2.6) continue;
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);
      const side = rand() > 0.5 ? 1 : -1;
      const x = riverX + side * (halfW - 0.15 + rand() * 1.15);
      const y = getTerrainHeight(x, z);
      if (y < -0.25 || y > 0.6) continue;

      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
      const rs = 0.75 + rand() * 0.65;
      dummy.scale.set(rs, rs * (0.85 + rand() * 0.45), rs);
      dummy.updateMatrix();
      rMesh.setMatrixAt(rPlaced, dummy.matrix);
      color.setHSL(0.24 + rand() * 0.07, 0.62, 0.28 + rand() * 0.14);
      rMesh.setColorAt(rPlaced, color);
      rPlaced++;
    }
    rMesh.count = rPlaced;
    rMesh.instanceMatrix.needsUpdate = true;
    if (rMesh.instanceColor) rMesh.instanceColor.needsUpdate = true;
  }, [count, maxFlowers]);

  return (
    <group name="JungleBush">
      <instancedMesh ref={bushRef} args={[bushGeo, bushMaterial, count]} receiveShadow />
      <instancedMesh ref={flowerRef} args={[flowerGeo, undefined, maxFlowers]}>
        <meshStandardMaterial roughness={0.4} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={reedRef} args={[reedGeo, reedMaterial, maxReeds]} />
    </group>
  );
}
