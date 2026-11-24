"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  getRiverCenterX,
  getRiverHalfWidth,
  mulberry32,
} from "@/lib/procedural-noise";

export function RiverEnvironment() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pebblesRef = useRef<THREE.InstancedMesh>(null);

  // Build river ribbon geometry following the meandering river channel
  const riverGeo = useMemo(() => {
    const lengthZ = 130;
    const segZ = 56;
    const segX = 12;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let iz = 0; iz <= segZ; iz++) {
      const tz = iz / segZ;
      const z = (tz - 0.5) * lengthZ;
      const cx = getRiverCenterX(z);
      const hw = getRiverHalfWidth(z) + 2.4; // extend slightly under sloped bank

      for (let ix = 0; ix <= segX; ix++) {
        const tx = ix / segX;
        const x = cx + (tx * 2 - 1) * hw;
        positions.push(x, 0.0, z);
        uvs.push(tx, tz * 10);
      }
    }

    for (let iz = 0; iz < segZ; iz++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iz * (segX + 1) + ix;
        const b = (iz + 1) * (segX + 1) + ix;
        const c = (iz + 1) * (segX + 1) + (ix + 1);
        const d = iz * (segX + 1) + (ix + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const riverUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallowColor: { value: new THREE.Color("#2dd4bf") },
      uDeepColor: { value: new THREE.Color("#0f766e") },
      uSkyColor: { value: new THREE.Color("#bae6fd") },
      uFoamColor: { value: new THREE.Color("#ecfccb") },
      uSunColor: { value: new THREE.Color("#fef08a") },
    }),
    []
  );

  // Submerged & bank river pebbles
  const pebbleGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.32, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) * 0.52);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    const mesh = pebblesRef.current;
    if (!mesh) return;
    const rand = mulberry32(4455);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < 110; i++) {
      const z = (rand() - 0.5) * 90;
      const cx = getRiverCenterX(z);
      const hw = getRiverHalfWidth(z);
      const side = rand() > 0.5 ? 1 : -1;
      const x = cx + side * (hw * (0.65 + rand() * 0.45));
      dummy.position.set(x, -0.22 + rand() * 0.35, z);
      dummy.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
      const s = 0.6 + rand() * 1.4;
      dummy.scale.set(s, s * 0.65, s * 0.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.11, 0.14, 0.32 + rand() * 0.18);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group name="RiverEnvironment">
      <mesh geometry={riverGeo} receiveShadow>
        <shaderMaterial
          ref={matRef}
          transparent
          uniforms={riverUniforms}
          vertexShader={`
            uniform float uTime;
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
              vUv = uv;
              vec3 p = position;
              float ripple = sin(p.z * 0.9 - uTime * 2.2 + p.x * 0.7) * 0.035
                           + cos(p.x * 1.4 + uTime * 1.6) * 0.02;
              p.y += ripple;
              vec4 world = modelMatrix * vec4(p, 1.0);
              vWorldPos = world.xyz;
              gl_Position = projectionMatrix * viewMatrix * world;
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uShallowColor;
            uniform vec3 uDeepColor;
            uniform vec3 uSkyColor;
            uniform vec3 uFoamColor;
            uniform vec3 uSunColor;
            varying vec2 vUv;
            varying vec3 vWorldPos;

            void main() {
              float edgeDist = abs(vUv.x - 0.5) * 2.0;
              float flow1 = sin(vUv.y * 8.0 - uTime * 2.2 + sin(vUv.x * 10.0) * 1.2);
              float flow2 = cos(vUv.y * 14.0 - uTime * 2.8 - vUv.x * 12.0);
              float shimmer = smoothstep(0.55, 0.98, (flow1 + flow2) * 0.5);

              vec3 baseCol = mix(uDeepColor, uShallowColor, smoothstep(0.18, 0.88, edgeDist));
              baseCol = mix(baseCol, uSkyColor, 0.24 + 0.08 * flow1);
              baseCol = mix(baseCol, uSunColor, shimmer * 0.34);

              // Gentle sunlit riverbank foam
              float foam = smoothstep(0.72, 0.94, edgeDist + flow1 * 0.06);
              vec3 finalCol = mix(baseCol, uFoamColor, foam * 0.42);

              float alpha = mix(0.88, 0.72, smoothstep(0.7, 1.0, edgeDist));
              gl_FragColor = vec4(finalCol, alpha);
            }
          `}
        />
      </mesh>

      <instancedMesh ref={pebblesRef} args={[pebbleGeo, undefined, 110]} receiveShadow>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
