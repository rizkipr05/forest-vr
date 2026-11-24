"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Animated Amazon rainforest sky dome with drifting tropical clouds,
 * warm sun disc, and golden atmospheric horizon glow.
 */
export function RainforestSkyDome({ radius = 140 }: { radius?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenithColor: { value: new THREE.Color("#3b9ed8") },
      uMidSkyColor: { value: new THREE.Color("#7dd3fc") },
      uHorizonColor: { value: new THREE.Color("#dcfce7") },
      uSunColor: { value: new THREE.Color("#fef08a") },
      uCloudColor: { value: new THREE.Color("#ffffff") },
      uSunDir: { value: new THREE.Vector3(32, 28, -26).normalize() },
    }),
    []
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group name="RainforestSky">
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[radius, 32, 20]} />
        <shaderMaterial
          ref={matRef}
          side={THREE.FrontSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`
            varying vec3 vWorldDir;
            void main() {
              vWorldDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uZenithColor;
            uniform vec3 uMidSkyColor;
            uniform vec3 uHorizonColor;
            uniform vec3 uSunColor;
            uniform vec3 uCloudColor;
            uniform vec3 uSunDir;
            varying vec3 vWorldDir;

            float hash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }

            float noise2D(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = hash21(i);
              float b = hash21(i + vec2(1.0, 0.0));
              float c = hash21(i + vec2(0.0, 1.0));
              float d = hash21(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float fbmClouds(vec2 p) {
              float v = 0.0;
              float amp = 0.5;
              for (int i = 0; i < 4; i++) {
                v += amp * noise2D(p);
                p = p * 2.05 + vec2(1.7, 9.2);
                amp *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float h = clamp(dir.y, 0.0, 1.0);

              // Sky gradient: lush misty horizon -> bright tropical sky -> deep azure zenith
              vec3 col = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.35, h));
              col = mix(col, uZenithColor, smoothstep(0.28, 0.92, h));

              // Sun disc & warm atmospheric scatter
              float sunAmt = max(dot(dir, uSunDir), 0.0);
              col += uSunColor * (pow(sunAmt, 10.0) * 0.32 + pow(sunAmt, 180.0) * 0.95);

              // Drifting soft cumulus clouds above horizon
              if (dir.y > 0.03) {
                vec2 skyUv = dir.xz / (dir.y + 0.16);
                vec2 drift1 = skyUv * 0.72 + vec2(uTime * 0.014, uTime * 0.006);
                vec2 drift2 = skyUv * 1.45 - vec2(uTime * 0.009, -uTime * 0.005);
                float c1 = fbmClouds(drift1);
                float c2 = fbmClouds(drift2);
                float cloudMask = smoothstep(0.47, 0.76, c1 * 0.7 + c2 * 0.3);
                // Fade clouds gently near horizon to blend into rainforest mist
                cloudMask *= smoothstep(0.03, 0.22, dir.y);
                vec3 litCloud = mix(uCloudColor, uSunColor, pow(sunAmt, 4.0) * 0.35);
                col = mix(col, litCloud, cloudMask * 0.78);
              }

              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>
    </group>
  );
}

/**
 * Lightweight diagonal sunbeams filtering down through the rainforest canopy.
 */
export function RainforestSunbeams() {
  const groupRef = useRef<THREE.Group>(null);

  const beams = useMemo(
    () => [
      { pos: [-8, 12, -3] as [number, number, number], radius: 2.2, height: 26, rotZ: 0.32, rotX: 0.18, opacity: 0.075 },
      { pos: [2, 13, 2] as [number, number, number], radius: 2.8, height: 28, rotZ: 0.3, rotX: 0.16, opacity: 0.065 },
      { pos: [-16, 12, 8] as [number, number, number], radius: 2.0, height: 25, rotZ: 0.34, rotX: 0.2, opacity: 0.07 },
      { pos: [11, 13, -7] as [number, number, number], radius: 2.4, height: 27, rotZ: 0.31, rotX: 0.17, opacity: 0.06 },
      { pos: [-3, 12, -12] as [number, number, number], radius: 2.5, height: 26, rotZ: 0.29, rotX: 0.19, opacity: 0.055 },
    ],
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = beams[idx].opacity * (0.8 + 0.25 * Math.sin(t * 0.6 + idx * 1.4));
      }
    });
  });

  return (
    <group ref={groupRef} name="RainforestSunbeams">
      {beams.map((b, i) => (
        <mesh
          key={i}
          position={b.pos}
          rotation={[b.rotX, 0, b.rotZ]}
        >
          <cylinderGeometry args={[b.radius * 0.45, b.radius * 1.45, b.height, 14, 1, true]} />
          <meshBasicMaterial
            color="#fef9c3"
            transparent
            opacity={b.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
