"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BRIDGE_CONFIG,
  fbm2D,
  getBridgeDeckY,
  getRiverCenterX,
  getRiverHalfWidth,
  getTerrainHeight,
  mulberry32,
} from "@/lib/procedural-noise";
import { getRainforestTextures } from "@/lib/procedural-textures";

const TERRAIN_SIZE = 132;
const TERRAIN_SEGMENTS = 64;

export function ForestGround({
  grassCount = 1600,
  showBridge = true,
}: {
  grassCount?: number;
  showBridge?: boolean;
}) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const shaderTimeRef = useRef<{ value: number }>({ value: 0 });
  const textures = useMemo(() => getRainforestTextures(), []);

  // Build displaced & vertex-colored terrain geometry
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cRiverBed = new THREE.Color("#4e3f2a");
    const cSand = new THREE.Color("#bfa06b");
    const cMossDark = new THREE.Color("#1f4d2b");
    const cMossMid = new THREE.Color("#2e6f36");
    const cGrassRich = new THREE.Color("#428738");
    const cTrail = new THREE.Color("#7f6642");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const n = fbm2D(x * 0.08 + 12, z * 0.08 - 7, 3) * 0.5 + 0.5;
      const distTrail = Math.min(
        Math.abs(z - 0) + (x < -16 || x > 14 ? 8 : 0),
        Math.hypot(x + 14, z - 8) * 0.35
      );

      if (y < -0.15) {
        tmp.copy(cRiverBed).lerp(cSand, Math.max(0, (y + 1.5) / 1.4));
      } else if (y < 0.42) {
        tmp.copy(cSand).lerp(cMossDark, Math.max(0, (y - 0.05) / 0.37));
      } else {
        tmp.copy(cMossDark).lerp(cMossMid, n);
        if (n > 0.52) {
          tmp.lerp(cGrassRich, (n - 0.52) * 1.4);
        }
        // Subtle earthy trail leading up to the wooden river bridge
        if (distTrail < 2.2) {
          const trailBlend = (1 - distTrail / 2.2) * 0.55;
          tmp.lerp(cTrail, trailBlend);
        }
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Curved tapered grass blade geometry for instancing
  const grassBladeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.14, 0.62, 1, 2);
    geo.translate(0, 0.31, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = y / 0.62;
      // Taper width toward tip & curve gracefully
      pos.setX(i, pos.getX(i) * (1 - t * 0.88));
      pos.setZ(i, t * t * 0.14);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const grassMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#43a047",
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shaderTimeRef.current;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>\nuniform float uTime;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float hFactor = clamp(position.y / 0.58, 0.0, 1.0);
           vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float breeze = sin(uTime * 1.9 + instPos.x * 0.45 + instPos.z * 0.35) * 0.14;
           transformed.x += breeze * hFactor * hFactor;
           transformed.z += cos(uTime * 1.4 + instPos.z * 0.5) * 0.07 * hFactor * hFactor;`
        );
    };
    return mat;
  }, []);

  // Populate grass instances deterministically across dry forest land
  useEffect(() => {
    const mesh = grassRef.current;
    if (!mesh) return;

    const rand = mulberry32(202611);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let placed = 0;
    let attempts = 0;

    while (placed < grassCount && attempts < grassCount * 6) {
      attempts++;
      const x = (rand() - 0.5) * 98;
      const z = (rand() - 0.5) * 98;
      const riverX = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z);

      // Keep clear of river channel & wooden bridge trailhead
      if (Math.abs(x - riverX) < halfW + 1.1) continue;
      if (Math.abs(z) < 2.2 && x > -10 && x < 15) continue;

      const y = getTerrainHeight(x, z);
      if (y < 0.25) continue;

      dummy.position.set(x, y - 0.03, z);
      dummy.rotation.set(
        (rand() - 0.5) * 0.2,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 0.2
      );
      const s = 0.65 + rand() * 0.95;
      dummy.scale.set(s, s * (0.8 + rand() * 0.6), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);

      color.setHSL(0.28 + rand() * 0.07, 0.55 + rand() * 0.2, 0.32 + rand() * 0.18);
      mesh.setColorAt(placed, color);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [grassCount]);

  // Animate grass wind uniform gently via R3F frame loop
  useFrame(({ clock }) => {
    shaderTimeRef.current.value = clock.getElapsedTime();
  });

  const plankMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9a6437",
        map: textures?.barkMap ?? null,
        roughness: 0.86,
      }),
    [textures]
  );

  const postMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6f4627",
        map: textures?.barkMap ?? null,
        roughness: 0.9,
      }),
    [textures]
  );

  const railMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b07d4f",
        roughness: 0.85,
      }),
    []
  );

  // Wooden footbridge planks & posts across the river at z = 0
  const bridgePlanks = useMemo(() => {
    const planks: { x: number; y: number; rotZ: number }[] = [];
    const span = BRIDGE_CONFIG.xEnd - BRIDGE_CONFIG.xStart;
    const count = 28;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = BRIDGE_CONFIG.xStart + t * span;
      const y = getBridgeDeckY(x);
      const nextY = getBridgeDeckY(x + 0.2);
      const rotZ = Math.atan2(nextY - y, 0.2);
      planks.push({ x, y, rotZ });
    }
    return planks;
  }, []);

  const bridgePosts = useMemo(() => {
    const xs = [-4.5, -1.2, 2.2, 5.6, 9.0, 11.0];
    return xs.map((x) => ({ x, y: getBridgeDeckY(x) }));
  }, []);

  return (
    <group name="ForestGround">
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          map={textures?.groundMap ?? null}
          roughness={0.93}
          metalness={0.02}
        />
      </mesh>

      <instancedMesh
        ref={grassRef}
        args={[grassBladeGeo, grassMaterial, grassCount]}
      />

      {showBridge && (
        <group name="AmazonFootbridge">
          {/* Two main arched side beams */}
          {bridgePlanks.map((p, idx) => (
            <mesh
              key={`plank-${idx}`}
              position={[p.x, p.y - 0.04, BRIDGE_CONFIG.zCenter]}
              rotation={[0, 0, p.rotZ]}
              material={plankMaterial}
              receiveShadow
            >
              <boxGeometry args={[0.48, 0.1, BRIDGE_CONFIG.halfDepth * 2]} />
            </mesh>
          ))}

          {/* Timber handrail posts & ropes */}
          {bridgePosts.map((post, idx) => (
            <React.Fragment key={`post-${idx}`}>
              {[-1, 1].map((side) => (
                <group
                  key={`side-${side}`}
                  position={[
                    post.x,
                    post.y,
                    BRIDGE_CONFIG.zCenter + side * (BRIDGE_CONFIG.halfDepth - 0.1),
                  ]}
                >
                  {/* Vertical post extending down into riverbed/bank */}
                  <mesh position={[0, -0.35, 0]} material={postMaterial} castShadow>
                    <cylinderGeometry args={[0.09, 0.11, 2.5, 8]} />
                  </mesh>
                  {/* Top railing segment */}
                  {idx < bridgePosts.length - 1 && (
                    <mesh
                      position={[
                        (bridgePosts[idx + 1].x - post.x) / 2,
                        0.82 + (bridgePosts[idx + 1].y - post.y) / 2,
                        0,
                      ]}
                      rotation={[
                        0,
                        0,
                        Math.atan2(
                          bridgePosts[idx + 1].y - post.y,
                          bridgePosts[idx + 1].x - post.x
                        ) -
                          Math.PI / 2,
                      ]}
                      material={railMaterial}
                      castShadow
                    >
                      <cylinderGeometry
                        args={[
                          0.045,
                          0.045,
                          Math.hypot(
                            bridgePosts[idx + 1].x - post.x,
                            bridgePosts[idx + 1].y - post.y
                          ),
                          7,
                        ]}
                      />
                    </mesh>
                  )}
                </group>
              ))}
            </React.Fragment>
          ))}
        </group>
      )}
    </group>
  );
}
