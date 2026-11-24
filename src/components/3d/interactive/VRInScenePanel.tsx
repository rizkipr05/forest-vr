"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SpeciesRecord } from "@/types/amazon";

/**
 * Spatial 3D floating educational info card rendered inside immersive WebXR VR sessions
 * using an offline CanvasTexture (zero external font dependencies).
 */
export function VRInScenePanel({
  species,
  onPlayAudio,
  onClose,
}: {
  species: SpeciesRecord | null;
  onPlayAudio: (species: SpeciesRecord) => void;
  onClose: () => void;
}) {
  const texture = useMemo(() => {
    if (!species || typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 560;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Rounded background card
    ctx.fillStyle = "#064e3b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // Header bar
    ctx.fillStyle = "#047857";
    ctx.fillRect(24, 24, canvas.width - 48, 108);

    ctx.fillStyle = "#fde047";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(species.name, 48, 84);

    ctx.fillStyle = "#d1fae5";
    ctx.font = "italic 24px sans-serif";
    ctx.fillText(`${species.scientificName} • ${species.category}`, 48, 118);

    // Description wrapped
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px sans-serif";
    const words = species.description.split(" ");
    let line = "";
    let y = 186;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 860) {
        ctx.fillText(line, 48, y);
        line = w;
        y += 38;
        if (y > 370) break;
      } else {
        line = test;
      }
    }
    if (line && y <= 370) ctx.fillText(line, 48, y);

    // Habitat & fun fact footer
    ctx.fillStyle = "#a7f3d0";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`Habitat: ${species.habitat.slice(0, 68)}`, 48, 425);

    ctx.fillStyle = "#fef08a";
    ctx.font = "23px sans-serif";
    ctx.fillText(`Fakta Unik: ${species.funFacts[0]?.slice(0, 68) || ""}`, 48, 468);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [species]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!species || !texture) return null;

  const panelY = species.position.y + (species.slug === "kapok-tree" ? 3.5 : 2.1);

  return (
    <group position={[species.position.x, panelY, species.position.z]}>
      <mesh position={[0, 0.35, 0]}>
        <planeGeometry args={[2.9, 1.7]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>

      {/* VR Trigger Button: Dengarkan Narasi */}
      <mesh
        position={[-0.72, -0.72, 0.04]}
        onClick={(e) => {
          e.stopPropagation();
          onPlayAudio(species);
        }}
      >
        <boxGeometry args={[1.15, 0.34, 0.06]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* VR Trigger Button: Tutup */}
      <mesh
        position={[0.72, -0.72, 0.04]}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <boxGeometry args={[1.05, 0.34, 0.06]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}
