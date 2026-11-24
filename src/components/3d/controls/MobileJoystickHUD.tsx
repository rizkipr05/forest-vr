"use client";

import React, { useRef, useState } from "react";
import { Eye } from "lucide-react";
import type { ExplorerMoveState } from "@/hooks/use-keyboard-controls";

export function MobileJoystickHUD({
  moveRef,
  lookDeltaRef,
}: {
  moveRef: React.MutableRefObject<ExplorerMoveState>;
  lookDeltaRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
}) {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const lookPointerRef = useRef<{ x: number; y: number } | null>(null);

  const handleStickMove = (clientX: number, clientY: number) => {
    const el = stickBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;
    setKnobOffset({ x: kx, y: ky });

    moveRef.current.joystickX = kx / maxR;
    moveRef.current.joystickY = ky / maxR;
  };

  const resetStick = () => {
    setKnobOffset({ x: 0, y: 0 });
    moveRef.current.joystickX = 0;
    moveRef.current.joystickY = 0;
  };

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-30 flex items-end justify-between sm:bottom-24">
      {/* Left Virtual Movement Joystick */}
      <div
        ref={stickBaseRef}
        aria-label="Joystick virtual berjalan"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleStickMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === "touch") {
            if (knobOffset.x !== 0 || knobOffset.y !== 0 || e.pressure > 0) {
              handleStickMove(e.clientX, e.clientY);
            }
          }
        }}
        onPointerUp={resetStick}
        onPointerCancel={resetStick}
        className="pointer-events-auto relative flex h-28 w-28 touch-none items-center justify-center rounded-full border-2 border-white/70 bg-emerald-950/55 shadow-xl backdrop-blur-md"
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-400/95 text-[10px] font-extrabold text-emerald-950 shadow-lg"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        >
          JALAN
        </div>
      </div>

      {/* Right Touch Look Pad */}
      <div
        aria-label="Kontrol arah pandang sentuh"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          lookPointerRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!lookPointerRef.current) return;
          const dx = e.clientX - lookPointerRef.current.x;
          const dy = e.clientY - lookPointerRef.current.y;
          lookPointerRef.current = { x: e.clientX, y: e.clientY };
          lookDeltaRef.current.yaw -= dx * 0.0055;
          lookDeltaRef.current.pitch -= dy * 0.0045;
        }}
        onPointerUp={() => {
          lookPointerRef.current = null;
        }}
        onPointerCancel={() => {
          lookPointerRef.current = null;
        }}
        className="pointer-events-auto flex h-24 w-24 touch-none flex-col items-center justify-center rounded-full border-2 border-white/70 bg-emerald-950/55 text-white shadow-xl backdrop-blur-md"
      >
        <Eye className="h-5 w-5 text-lime-300" />
        <span className="mt-1 text-[10px] font-bold">LIHAT</span>
      </div>
    </div>
  );
}
