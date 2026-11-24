"use client";

import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import type { SpeciesRecord } from "@/types/amazon";
import { ensureGLTFDecoders } from "@/lib/gltf-loader";
import { getRainforestTextures } from "@/lib/procedural-textures";
import { ProceduralSpeciesFallback } from "./ProceduralSpeciesFallback";

class ModelErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function GLBSpeciesMesh({
  species,
  hovered,
  selected,
}: {
  species: SpeciesRecord;
  hovered: boolean;
  selected: boolean;
}) {
  ensureGLTFDecoders();
  const gltf = useGLTF(species.modelUrl, false, true);
  const rootRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          // Ensure vertex colors activate cleanly when present on geometry
          if (mesh.geometry?.attributes?.color) {
            mat.vertexColors = true;
          }
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  // Subtle interactive highlight emissive tint
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && "emissive" in mat) {
          if (selected) {
            mat.emissive.set(species.accentColor);
            mat.emissiveIntensity = 0.28;
          } else if (hovered) {
            mat.emissive.set("#fef08a");
            mat.emissiveIntensity = 0.2;
          } else {
            mat.emissive.set("#000000");
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, hovered, selected, species.accentColor]);

  // Animate articulated sub-nodes cleanly at 60 FPS
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + species.position.x * 0.35;
    const g = rootRef.current;
    if (!g) return;

    const head = clonedScene.getObjectByName("Head");
    const tail = clonedScene.getObjectByName("Tail");
    const wingL = clonedScene.getObjectByName("WingL");
    const wingR = clonedScene.getObjectByName("WingR");
    const fronds = clonedScene.getObjectByName("Fronds");

    if (species.animationStyle === "flap") {
      const pulse = Math.sin(t * 4.8);
      if (wingL) wingL.rotation.z = -0.18 + Math.max(0, pulse) * 0.34;
      if (wingR) wingR.rotation.z = 0.18 - Math.max(0, pulse) * 0.34;
      if (head) {
        head.rotation.y = Math.sin(t * 1.6) * 0.38;
        head.rotation.z = Math.cos(t * 1.1) * 0.1;
      }
      if (tail) tail.rotation.x = 0.65 + Math.sin(t * 2.5) * 0.12;
      g.position.y = Math.sin(t * 2.2) * 0.04;
    } else if (species.animationStyle === "breathe") {
      g.scale.y = 1 + Math.sin(t * 2.4) * 0.03;
      g.rotation.y = Math.sin(t * 0.65) * 0.14;
      if (head) {
        head.rotation.y = Math.sin(t * 1.1) * 0.28;
        head.rotation.x = Math.sin(t * 1.6) * 0.08;
      }
      if (tail) tail.rotation.y = Math.sin(t * 2.6) * 0.32;
    } else if (species.animationStyle === "sway") {
      const sway = Math.sin(t * 1.5) * 0.065;
      if (fronds) {
        fronds.rotation.z = sway;
        fronds.rotation.x = Math.cos(t * 1.15) * 0.045;
      } else {
        g.rotation.z = sway * 0.85;
        if (head) head.rotation.y = Math.sin(t * 0.8) * 0.35;
      }
    } else if (species.animationStyle === "slither") {
      g.rotation.y = Math.sin(t * 1.2) * 0.16;
      if (head) {
        head.rotation.y = 0.4 + Math.sin(t * 2.4) * 0.35;
        head.position.y += Math.sin(t * 2.6) * 0.0006;
      }
    } else if (species.animationStyle === "hop") {
      const cycle = Math.sin(t * 2.9);
      const jump = Math.max(0, cycle);
      g.position.y = jump * 0.22;
      g.scale.y = 1 + jump * 0.14 - (cycle < 0 ? 0.06 : 0);
      if (head) head.rotation.y = Math.sin(t * 1.3) * 0.25;
    } else if (species.animationStyle === "float") {
      g.position.y = Math.sin(t * 1.7) * 0.045;
      g.rotation.z = Math.sin(t * 1.15) * 0.035;
      g.rotation.y = Math.sin(t * 0.45) * 0.08;
    }
  });

  return (
    <group ref={rootRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Natural props supporting perched animals/plants (stumps, boulders, sloth tree branch, mossy log)
 */
function SpeciesPerch({ perchType }: { perchType?: SpeciesRecord["perchType"] }) {
  const textures = useMemo(() => getRainforestTextures(), []);
  if (perchType === "stump") {
    return (
      <group position={[0, -1.7, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.42, 1.78, 12]} />
          <meshStandardMaterial
            color="#6b4423"
            map={textures?.barkMap ?? null}
            roughness={0.92}
          />
        </mesh>
        <mesh position={[0.25, 1.45, 0]} rotation={[0, 0, -0.7]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.75, 10]} />
          <meshStandardMaterial
            color="#5c3a21"
            map={textures?.barkMap ?? null}
            roughness={0.9}
          />
        </mesh>
      </group>
    );
  }
  if (perchType === "branch") {
    return (
      <group position={[0, 0, 0]}>
        {/* Horizontal sturdy bough for Sloth */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.13, 0.17, 3.4, 12]} />
          <meshStandardMaterial
            color="#6b4423"
            map={textures?.barkMap ?? null}
            roughness={0.92}
          />
        </mesh>
        {/* Supporting tree trunk at side */}
        <mesh position={[-1.55, -1.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.48, 4.4, 12]} />
          <meshStandardMaterial
            color="#5c3a21"
            map={textures?.barkMap ?? null}
            roughness={0.94}
          />
        </mesh>
      </group>
    );
  }
  if (perchType === "boulder") {
    return (
      <mesh position={[0, -0.34, 0]} scale={[1.1, 0.65, 1.0]} castShadow receiveShadow>
        <sphereGeometry args={[0.62, 14, 10]} />
        <meshStandardMaterial
          color="#4b5563"
          map={textures?.rockMap ?? null}
          roughness={0.86}
        />
      </mesh>
    );
  }
  if (perchType === "log") {
    return (
      <mesh position={[0, -0.26, 0]} rotation={[0, 0.3, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 2.2, 12]} />
        <meshStandardMaterial
          color="#6b4423"
          map={textures?.barkMap ?? null}
          roughness={0.94}
        />
      </mesh>
    );
  }
  return null;
}

export function InteractiveSpeciesNode({
  species,
  isSelected,
  isDiscovered,
  inVR = false,
  onSelect,
}: {
  species: SpeciesRecord;
  isSelected: boolean;
  isDiscovered: boolean;
  inVR?: boolean;
  onSelect: (species: SpeciesRecord) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (hovered) {
      document.body.style.cursor = "pointer";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const pulse = isSelected ? 1.15 + Math.sin(t * 4) * 0.08 : hovered ? 1.08 : 1;
      ringRef.current.scale.set(pulse, pulse, pulse);
      ringRef.current.rotation.z = t * 0.45;
    }
    if (beaconRef.current) {
      beaconRef.current.position.y =
        (species.slug === "kapok-tree" ? 8.2 : 1.7) + Math.sin(t * 2.5) * 0.16;
      beaconRef.current.rotation.y = t * 1.4;
    }
  });

  const ringY =
    species.perchType === "stump"
      ? -1.62
      : species.perchType === "branch"
      ? -2.25
      : species.perchType === "boulder"
      ? -0.5
      : species.perchType === "log"
      ? -0.4
      : 0.06;

  return (
    <group
      position={[species.position.x, species.position.y, species.position.z]}
      rotation={[0, species.rotationY, 0]}
      scale={species.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(species);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <SpeciesPerch perchType={species.perchType} />

      <ModelErrorBoundary fallback={<ProceduralSpeciesFallback species={species} />}>
        <Suspense fallback={<ProceduralSpeciesFallback species={species} />}>
          <GLBSpeciesMesh species={species} hovered={hovered} selected={isSelected} />
        </Suspense>
      </ModelErrorBoundary>

      {/* Subtle interactive discovery halo ring */}
      <mesh ref={ringRef} position={[0, ringY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.12, 32]} />
        <meshBasicMaterial
          color={isSelected ? "#facc15" : isDiscovered ? "#34d399" : species.accentColor}
          transparent
          opacity={isSelected || hovered ? 0.85 : 0.28}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle golden selection indicator only when hovered or selected (keeps forest natural) */}
      {(hovered || isSelected) && (
        <mesh
          ref={beaconRef}
          position={[0, species.slug === "kapok-tree" ? 8.2 : 1.7, 0]}
        >
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#f59e0b"
            emissiveIntensity={0.85}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Kid-friendly floating DOM tag on hover when not selected and not in VR */}
      {!inVR && hovered && !isSelected && (
        <Html
          position={[0, species.slug === "kapok-tree" ? 4.2 : 1.95, 0]}
          center
          distanceFactor={9}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-2xl border-2 border-white bg-emerald-950/90 px-3 py-1 text-center shadow-xl backdrop-blur-md">
            <p className="font-display text-xs font-bold text-amber-300">{species.name}</p>
            <p className="text-[10px] font-semibold text-emerald-100">
              {isDiscovered ? "✓ Sudah Ditemukan • Klik Info" : "Klik untuk Pelajari!"}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}
