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

/**
 * Creates a multi-frond tropical plant rosette BufferGeometry (palm/elephant-ear cluster)
 * with UV coordinates for realistic leaf veining.
 */
function createTropicalClusterGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;

  const frondCount = 7;
  for (let f = 0; f < frondCount; f++) {
    const yaw = (f / frondCount) * Math.PI * 2 + (f % 2) * 0.22;
    const segL = 5;
    const segW = 2;
    const len = 1.38;
    const maxW = 0.35;

    for (let i = 0; i <= segL; i++) {
      const t = i / segL;
      const dist = t * len;
      const archY = Math.sin(t * Math.PI * 0.85) * 0.62 - t * t * 0.22 + 0.08;
      const w = Math.sin(t * Math.PI) * maxW;

      for (let j = 0; j <= segW; j++) {
        const u = (j / segW) * 2 - 1;
        const lx = u * w;
        const lz = dist;
        const ly = archY + Math.abs(u) * 0.045;

        const rx = lx * Math.cos(yaw) + lz * Math.sin(yaw);
        const rz = -lx * Math.sin(yaw) + lz * Math.cos(yaw);
        positions.push(rx, ly, rz);
        uvs.push(j / segW, t);
      }
    }

    for (let i = 0; i < segL; i++) {
      for (let j = 0; j < segW; j++) {
        const a = vertOffset + i * (segW + 1) + j;
        const b = vertOffset + (i + 1) * (segW + 1) + j;
        const c = vertOffset + (i + 1) * (segW + 1) + (j + 1);
        const d = vertOffset + i * (segW + 1) + (j + 1);
        indices.push(a, b, d, b, c, d);
      }
    }
    vertOffset += (segL + 1) * (segW + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function TropicalPlant({ count = 160 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const shaderTimeRef = useRef<{ value: number }>({ value: 0 });
  const plantGeo = useMemo(() => createTropicalClusterGeometry(), []);
  const textures = useMemo(() => getRainforestTextures(), []);

  const plantMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: textures?.leafMap ?? null,
      roughness: 0.56,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shaderTimeRef.current;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float tipFactor = clamp(length(position.xz) * 0.72, 0.0, 1.0);
           float sway = sin(uTime * 1.65 + instPos.x * 0.4 + instPos.z * 0.35) * 0.095;
           transformed.x += sway * tipFactor;
           transformed.y += cos(uTime * 2.1 + instPos.z * 0.45) * 0.035 * tipFactor;`
        );
    };
    return mat;
  }, [textures]);

  useFrame(({ clock }) => {
    shaderTimeRef.current.value = clock.getElapsedTime();
  });

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const rand = mulberry32(314159);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 8) {
      attempts++;
      const x = (rand() - 0.5) * 88;
      const z = (rand() - 0.5) * 88;
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);

      if (Math.abs(x - riverX) < halfW + 1.0) continue;
      if (Math.abs(z) < 2.2 && x > -9 && x < 14) continue;
      if (AMAZON_SPECIES.some((sp) => Math.hypot(sp.position.x - x, sp.position.z - z) < 2.4)) {
        continue;
      }

      const y = getTerrainHeight(x, z);
      if (y < 0.22) continue;

      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      const s = 0.65 + rand() * 1.0;
      dummy.scale.set(s, s * (0.85 + rand() * 0.55), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);

      color.setHSL(0.3 + rand() * 0.09, 0.64, 0.28 + rand() * 0.18);
      mesh.setColorAt(placed, color);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh
      ref={ref}
      args={[plantGeo, plantMaterial, count]}
      receiveShadow
    />
  );
}
