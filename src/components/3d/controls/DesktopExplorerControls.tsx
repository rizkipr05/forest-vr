"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { ExplorerMoveState } from "@/hooks/use-keyboard-controls";
import { getWalkableHeight, isWalkablePosition } from "@/lib/procedural-noise";
import type { SpeciesRecord } from "@/types/amazon";

export const DEFAULT_SPAWN = {
  x: -14,
  z: 8,
  yaw: -0.95, // facing Northeast toward the river bridge & Amazon wildlife
  pitch: -0.05,
};

export function DesktopExplorerControls({
  moveRef,
  lookDeltaRef,
  focusedSpecies,
  teleportTarget,
  resetSignal,
  inVR,
}: {
  moveRef: React.MutableRefObject<ExplorerMoveState>;
  lookDeltaRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  focusedSpecies: SpeciesRecord | null;
  teleportTarget: SpeciesRecord | null;
  resetSignal: number;
  inVR: boolean;
}) {
  const { gl } = useThree();
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const posRef = useRef(
    new THREE.Vector3(
      DEFAULT_SPAWN.x,
      getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z) + 1.68,
      DEFAULT_SPAWN.z
    )
  );
  const yawRef = useRef(DEFAULT_SPAWN.yaw);
  const pitchRef = useRef(DEFAULT_SPAWN.pitch);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const focusAnimatingRef = useRef(false);
  const focusCamGoalRef = useRef(new THREE.Vector3());
  const focusLookGoalRef = useRef(new THREE.Vector3());

  // Initialize camera spawn
  useEffect(() => {
    const startY = getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z) + 1.68;
    posRef.current.set(DEFAULT_SPAWN.x, startY, DEFAULT_SPAWN.z);
    yawRef.current = DEFAULT_SPAWN.yaw;
    pitchRef.current = DEFAULT_SPAWN.pitch;
  }, []);

  // Reset position button handler
  useEffect(() => {
    if (resetSignal === 0) return;
    const startY = getWalkableHeight(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z) + 1.68;
    posRef.current.set(DEFAULT_SPAWN.x, startY, DEFAULT_SPAWN.z);
    yawRef.current = DEFAULT_SPAWN.yaw;
    pitchRef.current = DEFAULT_SPAWN.pitch;
    focusAnimatingRef.current = false;
  }, [resetSignal]);

  // Smoothly focus camera when user selects a species
  useEffect(() => {
    if (!focusedSpecies) {
      focusAnimatingRef.current = false;
      return;
    }

    const sp = focusedSpecies;
    const spCenter = new THREE.Vector3(
      sp.position.x,
      sp.position.y + (sp.slug === "kapok-tree" ? 2.6 : 0.75),
      sp.position.z
    );
    const dist = sp.slug === "kapok-tree" ? 9.5 : 4.2;

    // Approach from current explorer direction if walking, or front-angle if teleporting
    const dir = new THREE.Vector3(
      posRef.current.x - spCenter.x,
      0,
      posRef.current.z - spCenter.z
    );
    if (dir.lengthSq() < 0.01) {
      dir.set(Math.sin(sp.rotationY), 0, Math.cos(sp.rotationY));
    } else {
      dir.normalize();
    }

    let goalX = spCenter.x + dir.x * dist;
    let goalZ = spCenter.z + dir.z * dist;

    // If desired viewing position falls in deep water, pick the nearest bank side
    if (!isWalkablePosition(goalX, goalZ)) {
      goalX = spCenter.x - dir.x * dist;
      goalZ = spCenter.z - dir.z * dist;
      if (!isWalkablePosition(goalX, goalZ)) {
        goalX = sp.kind === "plant" && sp.slug === "amazon-water-lily" ? -6.5 : posRef.current.x;
        goalZ = sp.kind === "plant" && sp.slug === "amazon-water-lily" ? -10 : posRef.current.z;
      }
    }

    const goalY = getWalkableHeight(goalX, goalZ) + 1.72;
    focusCamGoalRef.current.set(goalX, goalY, goalZ);
    focusLookGoalRef.current.copy(spCenter);
    focusAnimatingRef.current = true;
  }, [focusedSpecies]);

  // Direct jump from quick species selector or ?focus=slug deep-link
  useEffect(() => {
    if (!teleportTarget) return;
    const sp = teleportTarget;
    const viewDist = sp.slug === "kapok-tree" ? 9.5 : 4.4;
    const candidates: [number, number][] = [
      [sp.position.x + Math.sin(sp.rotationY) * viewDist, sp.position.z + Math.cos(sp.rotationY) * viewDist],
      [sp.position.x - viewDist, sp.position.z + 2],
      [sp.position.x + viewDist, sp.position.z + 2],
      [-7.2, sp.position.z],
    ];

    let chosenX = posRef.current.x;
    let chosenZ = posRef.current.z;
    for (const [cx, cz] of candidates) {
      if (isWalkablePosition(cx, cz)) {
        chosenX = cx;
        chosenZ = cz;
        break;
      }
    }

    const chosenY = getWalkableHeight(chosenX, chosenZ) + 1.72;
    posRef.current.set(chosenX, chosenY, chosenZ);

    const lookTarget = new THREE.Vector3(
      sp.position.x,
      sp.position.y + (sp.slug === "kapok-tree" ? 2.5 : 0.75),
      sp.position.z
    );
    const dx = lookTarget.x - chosenX;
    const dy = lookTarget.y - chosenY;
    const dz = lookTarget.z - chosenZ;
    yawRef.current = Math.atan2(-dx, -dz);
    pitchRef.current = Math.max(
      -0.65,
      Math.min(0.65, Math.atan2(dy, Math.hypot(dx, dz)))
    );
    focusCamGoalRef.current.set(chosenX, chosenY, chosenZ);
    focusLookGoalRef.current.copy(lookTarget);
    focusAnimatingRef.current = true;
  }, [teleportTarget]);

  // Drag-look mouse & touch canvas listeners
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      draggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        focusAnimatingRef.current = false;
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      yawRef.current -= dx * 0.0042;
      pitchRef.current = Math.max(-0.85, Math.min(0.75, pitchRef.current - dy * 0.0036));
    };

    const onPointerUp = () => {
      draggingRef.current = false;
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gl.domElement]);

  useFrame((state, delta) => {
    if (inVR) return; // Hand camera control cleanly over to WebXR headset pose

    const dt = Math.min(delta, 0.05);
    const move = moveRef.current;

    // Apply mobile look delta if active
    if (lookDeltaRef.current.yaw !== 0 || lookDeltaRef.current.pitch !== 0) {
      yawRef.current += lookDeltaRef.current.yaw;
      pitchRef.current = Math.max(
        -0.85,
        Math.min(0.75, pitchRef.current + lookDeltaRef.current.pitch)
      );
      lookDeltaRef.current.yaw = 0;
      lookDeltaRef.current.pitch = 0;
      focusAnimatingRef.current = false;
    }

    const forwardAxis =
      (move.forward ? 1 : 0) - (move.backward ? 1 : 0) - move.joystickY;
    const strafeAxis =
      (move.right ? 1 : 0) - (move.left ? 1 : 0) + move.joystickX;

    const isMoving = Math.abs(forwardAxis) > 0.05 || Math.abs(strafeAxis) > 0.05;
    if (isMoving) {
      focusAnimatingRef.current = false;
      const speed = (move.sprint ? 8.5 : 5.2) * dt;
      const sinY = Math.sin(yawRef.current);
      const cosY = Math.cos(yawRef.current);

      // Forward direction in Three.js camera convention (-Z when yaw=0)
      const moveX = (-sinY * forwardAxis + cosY * strafeAxis) * speed;
      const moveZ = (-cosY * forwardAxis - sinY * strafeAxis) * speed;

      const bound = 42;
      const nextX = Math.max(-bound, Math.min(bound, posRef.current.x + moveX));
      const nextZ = Math.max(-bound, Math.min(bound, posRef.current.z + moveZ));

      if (isWalkablePosition(nextX, posRef.current.z)) {
        posRef.current.x = nextX;
      }
      if (isWalkablePosition(posRef.current.x, nextZ)) {
        posRef.current.z = nextZ;
      }
      const targetY = getWalkableHeight(posRef.current.x, posRef.current.z) + 1.68;
      posRef.current.y = THREE.MathUtils.lerp(posRef.current.y, targetY, 0.22);
    } else if (focusAnimatingRef.current) {
      posRef.current.lerp(focusCamGoalRef.current, 0.08);
      const dx = focusLookGoalRef.current.x - posRef.current.x;
      const dy = focusLookGoalRef.current.y - posRef.current.y;
      const dz = focusLookGoalRef.current.z - posRef.current.z;
      const targetYaw = Math.atan2(-dx, -dz);
      const targetPitch = Math.max(
        -0.75,
        Math.min(0.65, Math.atan2(dy, Math.hypot(dx, dz)))
      );

      // Shortest-angle yaw interpolation
      let yawDiff = targetYaw - yawRef.current;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      yawRef.current += yawDiff * 0.1;
      pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, targetPitch, 0.1);

      if (posRef.current.distanceTo(focusCamGoalRef.current) < 0.08 && Math.abs(yawDiff) < 0.02) {
        focusAnimatingRef.current = false;
      }
    }

    const cam = state.camera;
    cam.position.copy(posRef.current);
    eulerRef.current.set(pitchRef.current, yawRef.current, 0, "YXZ");
    cam.quaternion.setFromEuler(eulerRef.current);
  });

  return null;
}
