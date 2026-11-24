"use client";

import React from "react";
import type { SpeciesRecord } from "@/types/amazon";

/**
 * Fallback 3D representation rendered if an external/local GLB model fails to load.
 */
export function ProceduralSpeciesFallback({ species }: { species: SpeciesRecord }) {
  const isPlant = species.kind === "plant";
  return (
    <group>
      {isPlant ? (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.8, 10]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <dodecahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial color={species.accentColor} roughness={0.65} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.45, 0]} scale={[0.85, 0.72, 1.25]} castShadow>
            <sphereGeometry args={[0.42, 16, 12]} />
            <meshStandardMaterial color={species.accentColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.72, 0.46]} castShadow>
            <sphereGeometry args={[0.24, 14, 10]} />
            <meshStandardMaterial color={species.accentColor} roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
