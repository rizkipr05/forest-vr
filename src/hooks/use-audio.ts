"use client";

import { useEffect, useState } from "react";
import { audioService, type AudioState } from "@/services/audio-service";

export function useAudio() {
  const [state, setState] = useState<AudioState>(() => audioService.getState());

  useEffect(() => {
    return audioService.subscribe(setState);
  }, []);

  return {
    ...state,
    setVolume: (v: number) => audioService.setVolume(v),
    toggleMute: () => audioService.toggleMute(),
    startAmbient: () => audioService.startAmbient(),
    stopAmbient: () => audioService.stopAmbient(),
    toggleAmbient: () => audioService.toggleAmbient(),
    playSfx: (type: "discover" | "correct" | "wrong" | "badge") =>
      audioService.playSfx(type),
    playSpeciesCall: (url: string) => audioService.playSpeciesCall(url),
    playNarration: (slug: string, text: string, callUrl?: string) =>
      audioService.playNarration(slug, text, callUrl),
    pauseNarration: () => audioService.pauseNarration(),
    resumeNarration: () => audioService.resumeNarration(),
    stopNarration: () => audioService.stopNarration(),
    stopAll: () => audioService.stopAll(),
  };
}
