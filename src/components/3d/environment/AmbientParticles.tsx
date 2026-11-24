"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getTerrainHeight, mulberry32 } from "@/lib/procedural-noise";

function createButterflyWingGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.28, 0.48, 0.78, 0.42, 0.72, 0.06);
  shape.bezierCurveTo(0.68, -0.1, 0.46, -0.12, 0.56, -0.34);
  shape.bezierCurveTo(0.45, -0.52, 0.12, -0.44, 0, -0.16);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function MorphoButterfly({
  origin,
  phase,
  color = "#38bdf8",
  accent = "#0284c7",
  scale = 0.24,
  wanderRadius = 2.6,
}: {
  origin: [number, number, number];
  phase: number;
  color?: string;
  accent?: string;
  scale?: number;
  wanderRadius?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const wingGeo = useMemo(() => createButterflyWingGeometry(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    if (groupRef.current) {
      const dx = Math.sin(t * 0.85) * wanderRadius + Math.cos(t * 1.9) * 0.55;
      const dz = Math.cos(t * 0.72) * wanderRadius + Math.sin(t * 1.4) * 0.45;
      const dy = Math.sin(t * 2.4) * 0.52 + Math.cos(t * 1.1) * 0.2;
      groupRef.current.position.set(origin[0] + dx, origin[1] + dy, origin[2] + dz);

      const vx = Math.cos(t * 0.85) * 0.85 * wanderRadius - Math.sin(t * 1.9) * 1.04;
      const vz = -Math.sin(t * 0.72) * 0.72 * wanderRadius + Math.cos(t * 1.4) * 0.63;
      groupRef.current.rotation.y = Math.atan2(vx, vz);
      groupRef.current.rotation.x = 0.25 + Math.sin(t * 2.4) * 0.12;
    }
    const flap = Math.sin(t * 15) * 1.05;
    if (leftRef.current) leftRef.current.rotation.y = flap;
    if (rightRef.current) rightRef.current.rotation.y = -flap;
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Slim dark butterfly body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.34, 3, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh ref={rightRef} geometry={wingGeo} position={[0.03, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={accent}
          emissiveIntensity={0.28}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={leftRef} geometry={wingGeo} position={[-0.03, 0, 0]} scale={[-1, 1, 1]}>
        <meshStandardMaterial
          color={color}
          emissive={accent}
          emissiveIntensity={0.28}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * GPU-animated golden rainforest pollen/firefly motes + fluttering tropical butterflies.
 */
export function AmbientParticles({
  count = 180,
  butterflyCount = 16,
}: {
  count?: number;
  butterflyCount?: number;
}) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const rand = mulberry32(8899);
    const pos = new Float32Array(count * 3);
    const sd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 62;
      pos[i * 3 + 1] = 0.7 + rand() * 9.0;
      pos[i * 3 + 2] = (rand() - 0.5) * 62;
      sd[i] = rand() * Math.PI * 2;
    }
    return { positions: pos, seeds: sd };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#fef08a") },
    }),
    []
  );

  const butterflies = useMemo(() => {
    const rand = mulberry32(4321);
    const palette = [
      { color: "#38bdf8", accent: "#0284c7" }, // Blue Morpho
      { color: "#facc15", accent: "#d97706" }, // Brimstone Yellow
      { color: "#fb7185", accent: "#e11d48" }, // Scarlet Swallowtail
      { color: "#34d399", accent: "#059669" }, // Emerald Birdwing
      { color: "#fb923c", accent: "#ea580c" }, // Amazon Monarch
    ];
    return Array.from({ length: butterflyCount }, (_, i) => {
      const x = (rand() - 0.5) * 34;
      const z = (rand() - 0.5) * 32;
      const groundY = Math.max(0.2, getTerrainHeight(x, z));
      const p = palette[i % palette.length];
      return {
        origin: [x, groundY + 1.1 + rand() * 1.8, z] as [number, number, number],
        phase: rand() * 12,
        color: p.color,
        accent: p.accent,
        scale: 0.22 + rand() * 0.1,
        wanderRadius: 1.8 + rand() * 1.8,
      };
    });
  }, [butterflyCount]);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group name="AmbientParticles">
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={shaderRef}
          transparent
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`
            attribute float aSeed;
            uniform float uTime;
            varying float vAlpha;
            void main() {
              vec3 p = position;
              p.x += cos(uTime * 0.55 + aSeed) * 0.65;
              p.y += sin(uTime * 0.9 + aSeed * 1.7) * 0.45;
              p.z += sin(uTime * 0.48 + aSeed * 1.3) * 0.65;
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_PointSize = clamp(24.0 / -mv.z, 2.0, 7.0);
              vAlpha = 0.42 + 0.38 * sin(uTime * 1.8 + aSeed * 3.0);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float soft = smoothstep(0.5, 0.08, d);
              gl_FragColor = vec4(uColor, soft * vAlpha);
            }
          `}
        />
      </points>

      {butterflies.map((b, idx) => (
        <MorphoButterfly
          key={idx}
          origin={b.origin}
          phase={b.phase}
          color={b.color}
          accent={b.accent}
          scale={b.scale}
          wanderRadius={b.wanderRadius}
        />
      ))}
    </group>
  );
}
