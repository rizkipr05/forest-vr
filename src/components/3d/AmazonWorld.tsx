"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { RainforestSkyDome, RainforestSunbeams } from "./environment/RainforestSkyDome";
import {
  TeleportTarget,
  XR,
  XROrigin,
  createXRStore,
  useXR,
  useXRControllerLocomotion,
} from "@react-three/xr";
import { AMAZON_SPECIES, getSpeciesBySlug } from "@/data/species";
import type { SpeciesRecord } from "@/types/amazon";
import { getTerrainHeight, getWalkableHeight } from "@/lib/procedural-noise";
import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import { useWebXRSupport } from "@/hooks/use-webxr-support";
import { audioService } from "@/services/audio-service";

import { ForestGround } from "./environment/ForestGround";
import { RiverEnvironment } from "./environment/RiverEnvironment";
import { ForestCanopyInstanced, ProceduralTree } from "./environment/ProceduralTree";
import { TropicalPlant } from "./environment/TropicalPlant";
import { JungleBush } from "./environment/JungleBush";
import { JungleRock } from "./environment/JungleRock";
import { FlyingBird } from "./environment/FlyingBird";
import { AmbientParticles } from "./environment/AmbientParticles";
import { AmbientWildlife } from "./environment/AmbientWildlife";
import { InteractiveSpeciesNode } from "./interactive/InteractiveSpeciesNode";
import { VRInScenePanel } from "./interactive/VRInScenePanel";
import { DEFAULT_SPAWN, DesktopExplorerControls } from "./controls/DesktopExplorerControls";
import { MobileJoystickHUD } from "./controls/MobileJoystickHUD";
import { ExplorerHUD } from "./controls/ExplorerHUD";

function VRExplorerRig({
  resetSignal,
  children,
}: {
  resetSignal: number;
  children?: React.ReactNode;
}) {
  const originRef = useRef<THREE.Group>(null);
  const inVR = useXR((s) => s.session != null);

  useXRControllerLocomotion(
    originRef,
    { speed: 4.2 },
    { type: "snap", degrees: 35 },
    "left"
  );

  useEffect(() => {
    if (!originRef.current) return;
    const startY = getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z);
    originRef.current.position.set(DEFAULT_SPAWN.x, startY, DEFAULT_SPAWN.z);
  }, [resetSignal]);

  // Keep player grounded cleanly on terrain while teleporting
  const handleTeleport = (point: THREE.Vector3) => {
    if (!originRef.current) return;
    const boundedX = Math.max(-42, Math.min(42, point.x));
    const boundedZ = Math.max(-42, Math.min(42, point.z));
    const y = getWalkableHeight(boundedX, boundedZ);
    originRef.current.position.set(boundedX, y, boundedZ);
  };

  return (
    <>
      <XROrigin
        ref={originRef}
        position={[
          DEFAULT_SPAWN.x,
          getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z),
          DEFAULT_SPAWN.z,
        ]}
      />
      {inVR ? (
        <TeleportTarget onTeleport={handleTeleport}>{children}</TeleportTarget>
      ) : (
        children
      )}
    </>
  );
}

function AmazonSceneContent({
  selectedSpecies,
  teleportTarget,
  discoveredSlugs,
  moveRef,
  lookDeltaRef,
  resetSignal,
  onSelectSpecies,
  onClearSelection,
  onVRStateChange,
}: {
  selectedSpecies: SpeciesRecord | null;
  teleportTarget: SpeciesRecord | null;
  discoveredSlugs: string[];
  moveRef: ReturnType<typeof useKeyboardControls>;
  lookDeltaRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  resetSignal: number;
  onSelectSpecies: (sp: SpeciesRecord) => void;
  onClearSelection: () => void;
  onVRStateChange: (inVR: boolean) => void;
}) {
  const inVR = useXR((s) => s.session != null);

  useEffect(() => {
    onVRStateChange(inVR);
  }, [inVR, onVRStateChange]);

  return (
    <>
      <color attach="background" args={["#d8efe4"]} />
      <fogExp2 attach="fog" args={["#cde8d8", 0.011]} />
      <RainforestSkyDome radius={145} />
      <RainforestSunbeams />

      <hemisphereLight args={["#f0fdf4", "#1b4332", 1.15]} />
      <directionalLight
        position={[26, 38, 22]}
        intensity={2.25}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={5}
        shadow-camera-far={110}
        shadow-camera-left={-44}
        shadow-camera-right={44}
        shadow-camera-top={44}
        shadow-camera-bottom={-44}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-20, 14, -18]} intensity={0.7} color="#86efac" />

      <DesktopExplorerControls
        moveRef={moveRef}
        lookDeltaRef={lookDeltaRef}
        focusedSpecies={selectedSpecies}
        teleportTarget={teleportTarget}
        resetSignal={resetSignal}
        inVR={inVR}
      />

      {/* Terrain with VR teleportation target support */}
      <VRExplorerRig resetSignal={resetSignal}>
        <ForestGround grassCount={1350} showBridge />
      </VRExplorerRig>

      <RiverEnvironment />

      {/* Hero Procedural Canopy Trees */}
      <ProceduralTree
        position={[-19, getTerrainHeight(-19, 10), 10]}
        scale={1.25}
        seed={1}
      />
      <ProceduralTree
        position={[-14.5, getTerrainHeight(-14.5, -9.5), -9.5]}
        scale={1.18}
        rotationY={1.1}
        seed={4}
      />
      <ProceduralTree
        position={[14.5, getTerrainHeight(14.5, -2.5), -2.5]}
        scale={1.32}
        rotationY={2.2}
        seed={8}
      />
      <ProceduralTree
        position={[19.5, getTerrainHeight(19.5, 13.5), 13.5]}
        scale={1.2}
        rotationY={0.5}
        seed={13}
      />
      <ProceduralTree
        position={[-4.5, getTerrainHeight(-4.5, 16.5), 16.5]}
        scale={1.15}
        rotationY={1.7}
        seed={17}
      />

      {/* Dense Instanced Rainforest, Wildflowers, Birds, Butterflies & Extra Wildlife */}
      <ForestCanopyInstanced count={84} />
      <TropicalPlant count={160} />
      <JungleBush count={120} />
      <JungleRock count={52} />
      <FlyingBird count={12} />
      <AmbientParticles count={180} butterflyCount={16} />
      <AmbientWildlife />

      {/* All 13 Interactive Amazon Animals & Plants (GLB + fallback) */}
      {AMAZON_SPECIES.map((species) => (
        <InteractiveSpeciesNode
          key={species.id}
          species={species}
          isSelected={selectedSpecies?.slug === species.slug}
          isDiscovered={discoveredSlugs.includes(species.slug)}
          inVR={inVR}
          onSelect={onSelectSpecies}
        />
      ))}

      {/* Diegetic 3D info slate when inside WebXR VR mode */}
      {inVR && (
        <VRInScenePanel
          species={selectedSpecies}
          onPlayAudio={(sp) =>
            audioService.playNarration(sp.slug, sp.narrationText, sp.audioUrl)
          }
          onClose={onClearSelection}
        />
      )}
    </>
  );
}

export function AmazonWorld({ initialFocusSlug }: { initialFocusSlug?: string | null }) {
  const xrStore = useMemo(() => createXRStore({ emulate: false }), []);
  const { isVRSupported } = useWebXRSupport();
  const moveRef = useKeyboardControls();
  const lookDeltaRef = useRef({ yaw: 0, pitch: 0 });
  const { progress, recordDiscovery } = useExplorerProgress();

  const initialFocused = useMemo(
    () => (initialFocusSlug ? getSpeciesBySlug(initialFocusSlug) ?? null : null),
    [initialFocusSlug]
  );

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesRecord | null>(
    () => initialFocused
  );
  const [teleportTarget, setTeleportTarget] = useState<SpeciesRecord | null>(
    () => initialFocused
  );
  const [resetSignal, setResetSignal] = useState(0);
  const [inVR, setInVR] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === "undefined") return false;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    return hasTouch && window.innerWidth < 1024;
  });

  // Cleanup audio when leaving /explore
  useEffect(() => {
    return () => {
      audioService.stopAll();
    };
  }, []);

  // Record discovery if navigated via ?focus=<slug>
  useEffect(() => {
    if (!initialFocusSlug) return;
    const found = getSpeciesBySlug(initialFocusSlug);
    if (!found) return;
    const timer = window.setTimeout(() => {
      void recordDiscovery(found.slug);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialFocusSlug, recordDiscovery]);

  const handleSelectSpecies = async (species: SpeciesRecord) => {
    audioService.stopNarration();
    setSelectedSpecies(species);
    const isNew = await recordDiscovery(species.slug);
    if (isNew) {
      audioService.playSfx("discover");
    }
  };

  const handleJumpToSpecies = async (species: SpeciesRecord) => {
    audioService.stopNarration();
    setSelectedSpecies(species);
    setTeleportTarget({ ...species });
    const isNew = await recordDiscovery(species.slug);
    if (isNew) {
      audioService.playSfx("discover");
    }
  };

  const handleCloseInfo = () => {
    audioService.stopNarration();
    setSelectedSpecies(null);
  };

  const handleResetPosition = () => {
    audioService.stopNarration();
    setSelectedSpecies(null);
    setTeleportTarget(null);
    setResetSignal((n) => n + 1);
  };

  const handleEnterVR = async () => {
    if (!isVRSupported) return;
    try {
      await xrStore.enterVR();
    } catch {
      // Ignore if session request denied by user/browser
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-emerald-950 select-none">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.04,
        }}
        camera={{
          position: [
            DEFAULT_SPAWN.x,
            getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z) + 1.68,
            DEFAULT_SPAWN.z,
          ],
          fov: 56,
          near: 0.15,
          far: 180,
        }}
      >
        <XR store={xrStore}>
          <AmazonSceneContent
            selectedSpecies={selectedSpecies}
            teleportTarget={teleportTarget}
            discoveredSlugs={progress.discoveredSlugs}
            moveRef={moveRef}
            lookDeltaRef={lookDeltaRef}
            resetSignal={resetSignal}
            onSelectSpecies={handleSelectSpecies}
            onClearSelection={handleCloseInfo}
            onVRStateChange={setInVR}
          />
        </XR>
      </Canvas>

      {!inVR && (
        <>
          <ExplorerHUD
            selectedSpecies={selectedSpecies}
            discoveredSlugs={progress.discoveredSlugs}
            isRegistered={progress.isRegistered}
            isVRSupported={isVRSupported}
            showTouchControls={showTouchControls}
            onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
            onEnterVR={handleEnterVR}
            onResetPosition={handleResetPosition}
            onCloseInfo={handleCloseInfo}
            onJumpToSpecies={handleJumpToSpecies}
          />

          {showTouchControls && (
            <MobileJoystickHUD moveRef={moveRef} lookDeltaRef={lookDeltaRef} />
          )}
        </>
      )}
    </div>
  );
}
