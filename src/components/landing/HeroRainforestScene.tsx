"use client";

import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { RainforestSkyDome, RainforestSunbeams } from "@/components/3d/environment/RainforestSkyDome";
import { ForestGround } from "@/components/3d/environment/ForestGround";
import { RiverEnvironment } from "@/components/3d/environment/RiverEnvironment";
import { ForestCanopyInstanced, ProceduralTree } from "@/components/3d/environment/ProceduralTree";
import { TropicalPlant } from "@/components/3d/environment/TropicalPlant";
import { JungleBush } from "@/components/3d/environment/JungleBush";
import { JungleRock } from "@/components/3d/environment/JungleRock";
import { FlyingBird } from "@/components/3d/environment/FlyingBird";
import { AmbientParticles } from "@/components/3d/environment/AmbientParticles";
import { AmbientWildlife } from "@/components/3d/environment/AmbientWildlife";
import { ensureGLTFDecoders } from "@/lib/gltf-loader";
import { getRiverCenterX, getTerrainHeight } from "@/lib/procedural-noise";
import type { HeroViewpoint } from "./HeroCanvasWrapper";

function prepareClonedGlb(scene: THREE.Group) {
  const clone = scene.clone(true);
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
  return clone;
}

function DioramaHighlightModels() {
  ensureGLTFDecoders();
  const macaw = useGLTF("/models/macaw.glb", false, true);
  const jaguar = useGLTF("/models/jaguar.glb", false, true);
  const lily = useGLTF("/models/water-lily.glb", false, true);
  const toucan = useGLTF("/models/toucan.glb", false, true);

  const macawObj = React.useMemo(() => prepareClonedGlb(macaw.scene), [macaw.scene]);
  const jaguarObj = React.useMemo(() => prepareClonedGlb(jaguar.scene), [jaguar.scene]);
  const lilyObj = React.useMemo(() => prepareClonedGlb(lily.scene), [lily.scene]);
  const toucanObj = React.useMemo(() => prepareClonedGlb(toucan.scene), [toucan.scene]);
  const lilyGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Animate Macaw wings & head
    const mHead = macawObj.getObjectByName("Head");
    const mWingL = macawObj.getObjectByName("WingL");
    const mWingR = macawObj.getObjectByName("WingR");
    const mFlap = Math.max(0, Math.sin(t * 4.5)) * 0.32;
    if (mWingL) mWingL.rotation.z = -0.18 + mFlap;
    if (mWingR) mWingR.rotation.z = 0.18 - mFlap;
    if (mHead) mHead.rotation.y = Math.sin(t * 1.5) * 0.34;

    // Animate Jaguar breathing, looking around & tail swish
    const jHead = jaguarObj.getObjectByName("Head");
    const jTail = jaguarObj.getObjectByName("Tail");
    if (jHead) jHead.rotation.y = Math.sin(t * 1.1) * 0.25;
    if (jTail) jTail.rotation.y = Math.sin(t * 2.4) * 0.3;

    // Animate Toucan looking around & fluttering
    const tHead = toucanObj.getObjectByName("Head");
    const tWingL = toucanObj.getObjectByName("WingL");
    const tWingR = toucanObj.getObjectByName("WingR");
    const tFlap = Math.max(0, Math.sin(t * 3.8 + 1.2)) * 0.28;
    if (tWingL) tWingL.rotation.z = -0.18 + tFlap;
    if (tWingR) tWingR.rotation.z = 0.18 - tFlap;
    if (tHead) tHead.rotation.y = Math.sin(t * 1.3 + 0.8) * 0.32;

    if (lilyGroupRef.current) {
      lilyGroupRef.current.position.y = 0.04 + Math.sin(t * 1.7) * 0.035;
      lilyGroupRef.current.rotation.z = Math.sin(t * 1.1) * 0.03;
    }
  });

  return (
    <group>
      {/* Perched Scarlet Macaw clearly framed on foreground riverside stump */}
      <group position={[-4.8, getTerrainHeight(-4.8, 3.8) + 1.15, 3.8]} rotation={[0, 0.72, 0]} scale={1.18}>
        <mesh position={[0, -0.58, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.28, 1.2, 8]} />
          <meshStandardMaterial color="#6b4423" roughness={0.92} />
        </mesh>
        <primitive object={macawObj} />
      </group>

      {/* Jaguar basking along the sunny West bank beside the bridge */}
      <group position={[-4.6, getTerrainHeight(-4.6, 1.4), 1.4]} rotation={[0, 0.95, 0]} scale={1.08}>
        <primitive object={jaguarObj} />
      </group>

      {/* Toucan near right bank */}
      <group position={[10.2, getTerrainHeight(10.2, 1.8) + 1.1, 1.8]} rotation={[0, -1.1, 0]} scale={1.18}>
        <mesh position={[0, -0.55, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.26, 1.15, 8]} />
          <meshStandardMaterial color="#6b4423" roughness={0.92} />
        </mesh>
        <primitive object={toucanObj} />
      </group>

      {/* Floating Amazon Water Lily */}
      <group ref={lilyGroupRef} position={[getRiverCenterX(-2.2) + 0.4, 0.04, -2.2]} scale={1.3}>
        <primitive object={lilyObj} />
      </group>
    </group>
  );
}

const HERO_CAM_TARGET = new THREE.Vector3();
const HERO_LOOK_TARGET = new THREE.Vector3();
const HERO_CURRENT_LOOK = new THREE.Vector3(-0.8, 1.35, 0.2);

const VIEWPOINT_COORDS: Record<
  HeroViewpoint,
  { pos: [number, number, number]; look: [number, number, number] }
> = {
  overview: { pos: [-9.8, 3.4, 9.8], look: [-1.1, 1.25, 0.9] },
  animals: { pos: [-8.2, 2.25, 5.8], look: [-4.6, 0.95, 2.3] },
  river: { pos: [2.2, 2.75, 7.2], look: [-0.4, 0.45, -1.6] },
  canopy: { pos: [-8.6, 5.8, 11.4], look: [0.4, 5.1, -3.2] },
};

function GentleHeroCamera({ viewpoint }: { viewpoint: HeroViewpoint }) {
  const angleRef = useRef(0);
  useFrame(({ camera, pointer }, delta) => {
    angleRef.current += delta * 0.16;
    const preset = VIEWPOINT_COORDS[viewpoint];
    HERO_CAM_TARGET.set(
      preset.pos[0] + Math.sin(angleRef.current) * 0.9 + pointer.x * 0.85,
      preset.pos[1] + pointer.y * 0.35,
      preset.pos[2] + Math.cos(angleRef.current * 0.7) * 0.75
    );
    HERO_LOOK_TARGET.set(preset.look[0], preset.look[1], preset.look[2]);
    camera.position.lerp(HERO_CAM_TARGET, 0.055);
    HERO_CURRENT_LOOK.lerp(HERO_LOOK_TARGET, 0.06);
    camera.lookAt(HERO_CURRENT_LOOK);
  });
  return null;
}

export function HeroRainforestScene({
  viewpoint = "overview",
}: {
  viewpoint?: HeroViewpoint;
}) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.25]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.14,
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
      camera={{ position: [-9.8, 3.4, 9.8], fov: 46, near: 0.2, far: 160 }}
    >
      <color attach="background" args={["#dff5ea"]} />
      <fogExp2 attach="fog" args={["#d6f0e4", 0.01]} />
      <RainforestSkyDome radius={125} />
      <RainforestSunbeams />

      <hemisphereLight args={["#f0f9ff", "#1f5132", 1.28]} />
      <directionalLight
        position={[24, 34, 18]}
        intensity={2.35}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={5}
        shadow-camera-far={95}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-18, 12, -16]} intensity={0.85} color="#86efac" />

      <GentleHeroCamera viewpoint={viewpoint} />

      <ForestGround grassCount={680} showBridge />
      <RiverEnvironment />
      <ProceduralTree position={[-13.5, getTerrainHeight(-13.5, -5.5), -5.5]} scale={1.18} seed={2} />
      <ProceduralTree position={[-4.5, getTerrainHeight(-4.5, -9.8), -9.8]} scale={1.1} rotationY={0.7} seed={4} />
      <ProceduralTree position={[12.5, getTerrainHeight(12.5, -6.2), -6.2]} scale={1.25} rotationY={1.4} seed={5} />
      <ProceduralTree position={[-15.5, getTerrainHeight(-15.5, 11.5), 11.5]} scale={1.05} rotationY={2.5} seed={9} />
      <ProceduralTree position={[15.5, getTerrainHeight(15.5, 9.0), 9.0]} scale={1.18} rotationY={0.8} seed={12} />

      <ForestCanopyInstanced count={38} />
      <TropicalPlant count={105} />
      <JungleBush count={65} />
      <JungleRock count={32} />
      <FlyingBird count={9} />
      <AmbientParticles count={90} butterflyCount={10} />
      <AmbientWildlife compact />

      <Suspense fallback={null}>
        <DioramaHighlightModels />
      </Suspense>
    </Canvas>
  );
}
