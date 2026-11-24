"use client";

import { useEffect, useRef } from "react";

export interface ExplorerMoveState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  joystickX: number;
  joystickY: number;
}

export function useKeyboardControls() {
  const moveRef = useRef<ExplorerMoveState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    joystickX: 0,
    joystickY: 0,
  });

  useEffect(() => {
    const setKey = (code: string, pressed: boolean) => {
      const m = moveRef.current;
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          m.forward = pressed;
          break;
        case "KeyS":
        case "ArrowDown":
          m.backward = pressed;
          break;
        case "KeyA":
        case "ArrowLeft":
          m.left = pressed;
          break;
        case "KeyD":
        case "ArrowRight":
          m.right = pressed;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          m.sprint = pressed;
          break;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      setKey(e.code, true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      setKey(e.code, false);
    };

    const onBlur = () => {
      const m = moveRef.current;
      m.forward = false;
      m.backward = false;
      m.left = false;
      m.right = false;
      m.sprint = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return moveRef;
}
