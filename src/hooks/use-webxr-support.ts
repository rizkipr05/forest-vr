"use client";

import { useEffect, useState } from "react";

export function useWebXRSupport() {
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    async function detect() {
      if (typeof navigator === "undefined" || !("xr" in navigator) || !navigator.xr) {
        if (active) {
          setIsVRSupported(false);
          setChecked(true);
        }
        return;
      }
      try {
        const supported = await navigator.xr.isSessionSupported("immersive-vr");
        if (active) {
          setIsVRSupported(Boolean(supported));
          setChecked(true);
        }
      } catch {
        if (active) {
          setIsVRSupported(false);
          setChecked(true);
        }
      }
    }
    detect();
    return () => {
      active = false;
    };
  }, []);

  return { isVRSupported, checked };
}
