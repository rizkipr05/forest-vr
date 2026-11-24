"use client";

import React, { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { ensureGLTFDecoders } from "@/lib/gltf-loader";
import { getRiverCenterX, getTerrainHeight } from "@/lib/procedural-noise";

function cloneGlb(scene: THREE.Group) {
  const clone = scene.clone(true);
  clone.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      if (mesh.material) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        if (mesh.geometry?.attributes?.color) {
          mat.vertexColors = true;
        }
        mesh.material = mat;
      }
    }
  });
  return clone;
}

/**
 * Articulated Amazon Spider Monkey swinging playfully from a tree bough or vine.
 */
function SwingingMonkey({
  anchor,
  phase = 0,
  furColor = "#6b3e26",
  faceColor = "#e7c6a5",
}: {
  anchor: [number, number, number];
  phase?: number;
  furColor?: string;
  faceColor?: string;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    if (pivotRef.current) {
      pivotRef.current.rotation.z = Math.sin(t * 2.1) * 0.42;
      pivotRef.current.rotation.y = Math.sin(t * 0.7) * 0.25;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.4) * 0.45;
      headRef.current.rotation.z = Math.cos(t * 1.1) * 0.12;
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 3.2) * 0.38;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * 3.2) * 0.38;
    if (tailRef.current) tailRef.current.rotation.x = 0.6 + Math.sin(t * 2.5) * 0.32;
  });

  return (
    <group position={anchor}>
      {/* Vine line above monkey */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 2.2, 6]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.85} />
      </mesh>
      <group ref={pivotRef}>
        {/* Raised arms holding vine */}
        <mesh position={[-0.14, -0.35, 0]} rotation={[0, 0, -0.18]}>
          <capsuleGeometry args={[0.05, 0.52, 4, 6]} />
          <meshStandardMaterial color={furColor} roughness={0.75} />
        </mesh>
        <mesh position={[0.14, -0.35, 0]} rotation={[0, 0, 0.18]}>
          <capsuleGeometry args={[0.05, 0.52, 4, 6]} />
          <meshStandardMaterial color={furColor} roughness={0.75} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, -0.82, 0]}>
          <capsuleGeometry args={[0.16, 0.34, 4, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.78} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, -0.82, 0.1]}>
          <sphereGeometry args={[0.13, 8, 8]} />
          <meshStandardMaterial color={faceColor} roughness={0.75} />
        </mesh>
        {/* Head */}
        <group ref={headRef} position={[0, -0.52, 0.14]}>
          <mesh>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.02, 0.09]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={faceColor} roughness={0.7} />
          </mesh>
          <mesh position={[-0.14, 0.03, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={faceColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.14, 0.03, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={faceColor} roughness={0.7} />
          </mesh>
          <mesh position={[-0.045, 0.03, 0.17]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#111827" roughness={0.2} />
          </mesh>
          <mesh position={[0.045, 0.03, 0.17]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#111827" roughness={0.2} />
          </mesh>
        </group>
        {/* Legs */}
        <mesh ref={leftLegRef} position={[-0.1, -1.18, 0.04]}>
          <capsuleGeometry args={[0.055, 0.36, 4, 6]} />
          <meshStandardMaterial color={furColor} roughness={0.75} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.1, -1.18, 0.04]}>
          <capsuleGeometry args={[0.055, 0.36, 4, 6]} />
          <meshStandardMaterial color={furColor} roughness={0.75} />
        </mesh>
        {/* Long curling tail */}
        <mesh ref={tailRef} position={[0, -0.95, -0.22]} rotation={[0.6, 0, 0]}>
          <capsuleGeometry args={[0.035, 0.65, 4, 6]} />
          <meshStandardMaterial color={furColor} roughness={0.78} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Articulated monkey climbing smoothly up and down a rainforest tree trunk.
 */
function ClimbingMonkey({
  trunkPos,
  phase = 0,
  furColor = "#7c4a2d",
}: {
  trunkPos: [number, number, number];
  phase?: number;
  furColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    const climbY = 2.6 + Math.sin(t * 0.85) * 1.45;
    const orbit = Math.sin(t * 0.45) * 0.55;
    if (groupRef.current) {
      groupRef.current.position.set(
        trunkPos[0] + Math.sin(orbit) * 0.48,
        trunkPos[1] + climbY,
        trunkPos[2] + Math.cos(orbit) * 0.48
      );
      groupRef.current.rotation.y = orbit + Math.PI;
    }
    const stride = Math.sin(t * 4.5) * 0.55;
    if (armLRef.current) armLRef.current.rotation.x = stride;
    if (armRRef.current) armRRef.current.rotation.x = -stride;
  });

  return (
    <group ref={groupRef} scale={0.9}>
      <mesh>
        <capsuleGeometry args={[0.14, 0.34, 4, 8]} />
        <meshStandardMaterial color={furColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.32, 0.06]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={furColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.3, 0.14]}>
        <sphereGeometry args={[0.085, 8, 6]} />
        <meshStandardMaterial color="#e7c6a5" roughness={0.7} />
      </mesh>
      <mesh ref={armLRef} position={[-0.14, 0.15, 0.14]} rotation={[0.4, 0, 0]}>
        <capsuleGeometry args={[0.045, 0.36, 4, 6]} />
        <meshStandardMaterial color={furColor} roughness={0.75} />
      </mesh>
      <mesh ref={armRRef} position={[0.14, 0.15, 0.14]} rotation={[-0.4, 0, 0]}>
        <capsuleGeometry args={[0.045, 0.36, 4, 6]} />
        <meshStandardMaterial color={furColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.22, -0.22]} rotation={[-0.85, 0, 0]}>
        <capsuleGeometry args={[0.03, 0.55, 4, 6]} />
        <meshStandardMaterial color={furColor} roughness={0.78} />
      </mesh>
    </group>
  );
}

/**
 * School of colorful Amazon river fish swimming smoothly under the turquoise water.
 */
function RiverFish({
  zBase,
  speed = 0.65,
  phase = 0,
  color = "#f97316",
  scale = 1,
}: {
  zBase: number;
  speed?: number;
  phase?: number;
  color?: string;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    const z = zBase + Math.sin(t) * 5.2;
    const x = getRiverCenterX(z) + Math.cos(t * 1.4) * 1.8;
    const nz = zBase + Math.sin(t + 0.05) * 5.2;
    const nx = getRiverCenterX(nz) + Math.cos((t + 0.05) * 1.4) * 1.8;

    if (groupRef.current) {
      groupRef.current.position.set(x, -0.24 + Math.sin(t * 2.2) * 0.05, z);
      groupRef.current.lookAt(nx, -0.24, nz);
    }
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 11 + phase) * 0.48;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.65, 1.35, 0.85]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh ref={tailRef} position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.11, 0.18, 4]} />
        <meshStandardMaterial color="#fef08a" roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Patrolling GLB Jaguar walking along a natural clearing path near the riverbanks.
 */
function ProwlingJaguar({
  centerX,
  centerZ,
  radiusX,
  radiusZ,
  speed = 0.24,
  phase = 0,
}: {
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  speed?: number;
  phase?: number;
}) {
  ensureGLTFDecoders();
  const gltf = useGLTF("/models/jaguar.glb", false, true);
  const obj = useMemo(() => cloneGlb(gltf.scene), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    const x = centerX + Math.cos(t) * radiusX;
    const z = centerZ + Math.sin(t) * radiusZ;
    const y = getTerrainHeight(x, z);

    const nx = centerX + Math.cos(t + 0.05) * radiusX;
    const nz = centerZ + Math.sin(t + 0.05) * radiusZ;
    const ny = getTerrainHeight(nx, nz);

    if (groupRef.current) {
      const strideBob = Math.abs(Math.sin(clock.getElapsedTime() * 5.2 + phase)) * 0.045;
      groupRef.current.position.set(x, y + strideBob, z);
      groupRef.current.lookAt(nx, ny + strideBob, nz);
    }

    const head = obj.getObjectByName("Head");
    const tail = obj.getObjectByName("Tail");
    if (head) head.rotation.y = Math.sin(clock.getElapsedTime() * 1.4) * 0.22;
    if (tail) tail.rotation.y = Math.sin(clock.getElapsedTime() * 3.5) * 0.3;
  });

  return (
    <group ref={groupRef} scale={0.95}>
      <primitive object={obj} />
    </group>
  );
}

/**
 * Hopping Poison Dart Frog on mossy riverside rocks.
 */
function HoppingFrog({
  origin,
  phase = 0,
}: {
  origin: [number, number, number];
  phase?: number;
}) {
  ensureGLTFDecoders();
  const gltf = useGLTF("/models/poison-dart-frog.glb", false, true);
  const obj = useMemo(() => cloneGlb(gltf.scene), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    const hopCycle = Math.max(0, Math.sin(t * 2.8));
    if (groupRef.current) {
      groupRef.current.position.set(
        origin[0] + Math.sin(t * 0.7) * 0.45,
        origin[1] + hopCycle * 0.28,
        origin[2] + Math.cos(t * 0.7) * 0.45
      );
      groupRef.current.rotation.y = t * 0.7 + Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef} scale={0.78}>
      <primitive object={obj} />
    </group>
  );
}

/**
 * Swimming Anaconda undulating in the river shallows.
 */
function SwimmingAnaconda({
  zBase,
  phase = 0,
}: {
  zBase: number;
  phase?: number;
}) {
  ensureGLTFDecoders();
  const gltf = useGLTF("/models/anaconda.glb", false, true);
  const obj = useMemo(() => cloneGlb(gltf.scene), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.38 + phase;
    const z = zBase + Math.sin(t) * 3.5;
    const x = getRiverCenterX(z) + Math.cos(t * 1.3) * 1.4;
    const nz = zBase + Math.sin(t + 0.05) * 3.5;
    const nx = getRiverCenterX(nz) + Math.cos((t + 0.05) * 1.3) * 1.4;
    if (groupRef.current) {
      groupRef.current.position.set(x, -0.02 + Math.sin(t * 3) * 0.02, z);
      groupRef.current.lookAt(nx, -0.02, nz);
    }
    const head = obj.getObjectByName("Head");
    if (head) head.rotation.y = Math.sin(clock.getElapsedTime() * 2.8) * 0.35;
  });

  return (
    <group ref={groupRef} scale={0.95}>
      <primitive object={obj} />
    </group>
  );
}

/**
 * Extra living Amazon animals distributed across canopy, trunks, trails, and river.
 */
export function AmbientWildlife({ compact = false }: { compact?: boolean }) {
  return (
    <group name="AmbientWildlife">
      {/* Swinging & Climbing Amazon Monkeys */}
      <SwingingMonkey
        anchor={[-16.2, getTerrainHeight(-16.2, 8.8) + 5.8, 8.8]}
        phase={0.4}
        furColor="#6b3e26"
      />
      <SwingingMonkey
        anchor={[12.8, getTerrainHeight(12.8, -1.8) + 6.0, -1.8]}
        phase={2.3}
        furColor="#4a2c18"
      />
      <ClimbingMonkey
        trunkPos={[-14.5, getTerrainHeight(-14.5, -9.5), -9.5]}
        phase={1.1}
        furColor="#7c4a2d"
      />
      {!compact && (
        <>
          <SwingingMonkey
            anchor={[-3.2, getTerrainHeight(-3.2, 15.2) + 5.6, 15.2]}
            phase={4.1}
            furColor="#5c3a21"
          />
          <ClimbingMonkey
            trunkPos={[19.5, getTerrainHeight(19.5, 13.5), 13.5]}
            phase={3.2}
            furColor="#5a351e"
          />
        </>
      )}

      {/* School of River Fish */}
      <RiverFish zBase={-4} speed={0.55} phase={0.2} color="#f97316" scale={1.0} />
      <RiverFish zBase={-2} speed={0.62} phase={1.8} color="#38bdf8" scale={0.85} />
      <RiverFish zBase={5} speed={0.5} phase={3.4} color="#facc15" scale={0.95} />
      {!compact && (
        <>
          <RiverFish zBase={-12} speed={0.58} phase={2.5} color="#fb7185" scale={0.9} />
          <RiverFish zBase={10} speed={0.48} phase={4.6} color="#34d399" scale={1.05} />
        </>
      )}

      {/* Extra GLB Wildlife (reuses already cached GLBs!) */}
      <Suspense fallback={null}>
        <HoppingFrog
          origin={[-3.2, getTerrainHeight(-3.2, 3.4) + 0.15, 3.4]}
          phase={0.5}
        />
        {!compact && (
          <>
            <ProwlingJaguar
              centerX={-12.5}
              centerZ={-5.5}
              radiusX={3.8}
              radiusZ={4.2}
              speed={0.22}
              phase={0.7}
            />
            <SwimmingAnaconda zBase={11.5} phase={1.3} />
            <HoppingFrog
              origin={[8.2, getTerrainHeight(8.2, -4.5) + 0.15, -4.5]}
              phase={2.2}
            />
          </>
        )}
      </Suspense>
    </group>
  );
}
