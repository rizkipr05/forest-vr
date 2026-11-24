"use client";

import React, { Component, Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { RotateCw, Sparkles, Sun, Trees } from "lucide-react";
import type { SpeciesRecord } from "@/types/amazon";
import { ensureGLTFDecoders } from "@/lib/gltf-loader";
import { getRainforestTextures } from "@/lib/procedural-textures";
import { ProceduralSpeciesFallback } from "./ProceduralSpeciesFallback";

class ViewerErrorBoundary extends Component<
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
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function TurntableModel({ species }: { species: SpeciesRecord }) {
  ensureGLTFDecoders();
  const gltf = useGLTF(species.modelUrl, false, true);

  const { scene, scaleFactor, yOffset } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          if (mesh.geometry?.attributes?.color) {
            mat.vertexColors = true;
          }
          mesh.material = mat;
        }
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    const normScale = 2.15 / maxDim;
    clone.position.set(-center.x * normScale, -box.min.y * normScale, -center.z * normScale);
    return { scene: clone, scaleFactor: normScale, yOffset: -0.65 };
  }, [gltf.scene]);

  return (
    <group position={[0, yOffset, 0]} scale={scaleFactor}>
      <primitive object={scene} />
    </group>
  );
}

export function SpeciesModelViewer({ species }: { species: SpeciesRecord }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightMode, setLightMode] = useState<"morning" | "canopy">("morning");
  const textures = useMemo(() => getRainforestTextures(), []);

  return (
    <div
      className={`relative h-[390px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs transition-colors duration-500 sm:h-[450px] ${
        lightMode === "morning"
          ? "bg-gradient-to-b from-sky-50 via-emerald-50/50 to-emerald-100/70"
          : "bg-gradient-to-b from-[#0b2419] via-[#133824] to-[#1a4a31]"
      }`}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: lightMode === "morning" ? 1.05 : 1.15,
        }}
        camera={{ position: [2.8, 1.75, 3.2], fov: 42 }}
      >
        <hemisphereLight
          args={[
            lightMode === "morning" ? "#f0fdf4" : "#bae6fd",
            lightMode === "morning" ? "#1b4332" : "#064e3b",
            lightMode === "morning" ? 0.95 : 0.7,
          ]}
        />
        <directionalLight
          position={[4, 6, 4]}
          intensity={lightMode === "morning" ? 1.85 : 1.45}
          color={lightMode === "morning" ? "#fffbeb" : "#d9f99d"}
          castShadow
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.0005}
        />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.85}
          color={lightMode === "morning" ? "#a7f3d0" : "#38bdf8"}
        />

        <ViewerErrorBoundary fallback={<ProceduralSpeciesFallback species={species} />}>
          <Suspense fallback={null}>
            <TurntableModel species={species} />
          </Suspense>
        </ViewerErrorBoundary>

        <mesh position={[0, -0.74, 0]} receiveShadow>
          <cylinderGeometry args={[1.65, 1.85, 0.18, 36]} />
          <meshStandardMaterial
            color="#2b6b3e"
            map={textures?.groundMap ?? null}
            roughness={0.88}
          />
        </mesh>
        <OrbitControls
          enablePan={false}
          minDistance={2.1}
          maxDistance={6.5}
          maxPolarAngle={Math.PI / 2 - 0.04}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        Model 3D Interaktif • Putar &amp; Zoom
      </div>

      <div className="absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setLightMode((prev) => (prev === "morning" ? "canopy" : "morning"))
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3.5 py-2 font-display text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white cursor-pointer"
        >
          {lightMode === "morning" ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-500" /> Cahaya Pagi
            </>
          ) : (
            <>
              <Trees className="h-3.5 w-3.5 text-emerald-600" /> Teduh Kanopi
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3.5 py-2 font-display text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 text-emerald-600 ${autoRotate ? "animate-spin" : ""}`} />
          {autoRotate ? "Putar Otomatis: Aktif" : "Putar Otomatis: Mati"}
        </button>
      </div>
    </div>
  );
}
