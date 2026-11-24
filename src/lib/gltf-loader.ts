"use client";

import { useGLTF } from "@react-three/drei";

let decodersConfigured = false;

/**
 * Configure local Draco decoder path (offline & sandbox safe) and ensure Meshopt support.
 */
export function ensureGLTFDecoders(): void {
  if (decodersConfigured || typeof window === "undefined") return;
  useGLTF.setDecoderPath("/draco/");
  decodersConfigured = true;
}
