"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface BirdFlightConfig {
  radiusX: number;
  radiusZ: number;
  altitude: number;
  speed: number;
  phase: number;
  color: string;
  wingColor: string;
  beakColor: string;
  scale: number;
  flapSpeed: number;
}

const DEFAULT_FLOCK: BirdFlightConfig[] = [
  { radiusX: 16, radiusZ: 22, altitude: 11.2, speed: 0.26, phase: 0.2, color: "#dc2626", wingColor: "#2563eb", beakColor: "#fef08a", scale: 1.05, flapSpeed: 7.4 },
  { radiusX: 18, radiusZ: 24, altitude: 12.1, speed: 0.26, phase: 0.48, color: "#ef4444", wingColor: "#facc15", beakColor: "#fde047", scale: 0.95, flapSpeed: 7.8 },
  { radiusX: 21, radiusZ: 17, altitude: 13.8, speed: 0.21, phase: 2.1, color: "#f8fafc", wingColor: "#e2e8f0", beakColor: "#f97316", scale: 0.92, flapSpeed: 6.2 },
  { radiusX: 14, radiusZ: 26, altitude: 10.4, speed: 0.29, phase: 3.8, color: "#0284c7", wingColor: "#fde047", beakColor: "#1e293b", scale: 1.0, flapSpeed: 7.2 },
  { radiusX: 23, radiusZ: 20, altitude: 14.5, speed: 0.19, phase: 5.0, color: "#f8fafc", wingColor: "#cbd5e1", beakColor: "#f97316", scale: 0.9, flapSpeed: 6.0 },
  { radiusX: 26, radiusZ: 28, altitude: 15.8, speed: 0.17, phase: 1.25, color: "#1e293b", wingColor: "#1e293b", beakColor: "#fb923c", scale: 1.12, flapSpeed: 6.5 },
  { radiusX: 12, radiusZ: 15, altitude: 9.2, speed: 0.34, phase: 2.9, color: "#dc2626", wingColor: "#3b82f6", beakColor: "#fef08a", scale: 0.88, flapSpeed: 8.1 },
  { radiusX: 28, radiusZ: 22, altitude: 16.5, speed: 0.16, phase: 4.3, color: "#16a34a", wingColor: "#facc15", beakColor: "#fb923c", scale: 0.96, flapSpeed: 7.0 },
  { radiusX: 19, radiusZ: 30, altitude: 13.0, speed: 0.22, phase: 5.7, color: "#0ea5e9", wingColor: "#f59e0b", beakColor: "#1e293b", scale: 1.02, flapSpeed: 7.3 },
  { radiusX: 25, radiusZ: 16, altitude: 14.9, speed: 0.2, phase: 0.9, color: "#f8fafc", wingColor: "#e2e8f0", beakColor: "#f59e0b", scale: 0.94, flapSpeed: 6.4 },
  { radiusX: 15, radiusZ: 19, altitude: 10.8, speed: 0.28, phase: 3.1, color: "#e11d48", wingColor: "#2563eb", beakColor: "#fef08a", scale: 0.92, flapSpeed: 7.9 },
  { radiusX: 31, radiusZ: 27, altitude: 17.6, speed: 0.15, phase: 4.9, color: "#1e293b", wingColor: "#334155", beakColor: "#f97316", scale: 1.15, flapSpeed: 5.8 },
];

function SingleBird({ config }: { config: BirdFlightConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  const wingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.45, 0.14, 1.02, -0.06);
    shape.quadraticCurveTo(0.58, -0.24, 0, -0.19);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const t = elapsed * config.speed + config.phase;
    const x = Math.cos(t) * config.radiusX + Math.sin(t * 2.0) * 1.8;
    const z = Math.sin(t * 0.85) * config.radiusZ;
    const y = config.altitude + Math.sin(t * 2.3) * 1.1;

    const nt = t + 0.05;
    const nx = Math.cos(nt) * config.radiusX + Math.sin(nt * 2.0) * 1.8;
    const nz = Math.sin(nt * 0.85) * config.radiusZ;
    const ny = config.altitude + Math.sin(nt * 2.3) * 1.1;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.lookAt(nx, ny, nz);
      // Gentle banking tilt into turns
      groupRef.current.rotateZ(Math.sin(t * 1.7) * 0.22);
    }

    // Alternate between active flapping and brief soaring glides
    const glideEnvelope = 0.55 + 0.45 * Math.sin(elapsed * 0.85 + config.phase * 2.0);
    const flap = Math.sin(elapsed * config.flapSpeed + config.phase * 4) * 0.62 * glideEnvelope;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef} scale={config.scale}>
      {/* Bird torso */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
        <meshStandardMaterial color={config.color} roughness={0.55} />
      </mesh>
      {/* Head & Beak */}
      <mesh position={[0, 0.05, 0.24]}>
        <sphereGeometry args={[0.085, 8, 6]} />
        <meshStandardMaterial color={config.color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.03, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.045, 0.18, 6]} />
        <meshStandardMaterial color={config.beakColor} roughness={0.45} />
      </mesh>
      {/* Tail streamer */}
      <mesh position={[0, 0, -0.38]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.065, 0.46, 6]} />
        <meshStandardMaterial color={config.wingColor} roughness={0.55} />
      </mesh>
      {/* Left & Right Wings */}
      <mesh ref={rightWingRef} geometry={wingGeo} position={[0.05, 0.02, 0.05]}>
        <meshStandardMaterial color={config.wingColor} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        ref={leftWingRef}
        geometry={wingGeo}
        position={[-0.05, 0.02, 0.05]}
        scale={[-1, 1, 1]}
      >
        <meshStandardMaterial color={config.wingColor} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function FlyingBird({ count = 12 }: { count?: number }) {
  const flock = useMemo(() => DEFAULT_FLOCK.slice(0, count), [count]);
  return (
    <group name="FlyingBirdFlock">
      {flock.map((bird, idx) => (
        <SingleBird key={idx} config={bird} />
      ))}
    </group>
  );
}
