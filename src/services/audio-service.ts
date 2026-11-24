"use client";

import { Howl, Howler } from "howler";

export interface AudioState {
  volume: number;
  muted: boolean;
  ambientPlaying: boolean;
  narrationPlaying: boolean;
  narrationPaused: boolean;
  activeNarrationSlug: string | null;
  narrationProgress: number;
}

type Listener = (state: AudioState) => void;

class AmazonAudioService {
  private state: AudioState = {
    volume: 0.7,
    muted: false,
    ambientPlaying: false,
    narrationPlaying: false,
    narrationPaused: false,
    activeNarrationSlug: null,
    narrationProgress: 0,
  };

  private listeners = new Set<Listener>();
  private rainforestHowl: Howl | null = null;
  private riverHowl: Howl | null = null;
  private activeEffectHowl: Howl | null = null;
  private sfxCache = new Map<string, Howl>();
  private progressTimer: number | null = null;
  private activeText = "";
  private activeCallUrl: string | undefined;

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((listener) => listener(snapshot));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    return { ...this.state };
  }

  setVolume(nextVolume: number) {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    this.state.volume = clamped;
    if (typeof window !== "undefined") {
      Howler.volume(this.state.muted ? 0 : clamped);
      if (this.rainforestHowl) this.rainforestHowl.volume(clamped * 0.42);
      if (this.riverHowl) this.riverHowl.volume(clamped * 0.25);
    }
    this.emit();
  }

  toggleMute() {
    this.state.muted = !this.state.muted;
    if (typeof window !== "undefined") {
      Howler.mute(this.state.muted);
      if (this.state.muted && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore speech synthesis cancellation errors
        }
      }
    }
    this.emit();
  }

  startAmbient() {
    if (typeof window === "undefined") return;
    if (this.state.ambientPlaying) return;

    try {
      if (!this.rainforestHowl) {
        this.rainforestHowl = new Howl({
          src: ["/audio/ambient-rainforest.wav"],
          loop: true,
          volume: this.state.volume * 0.42,
        });
      }
      if (!this.riverHowl) {
        this.riverHowl = new Howl({
          src: ["/audio/ambient-river.wav"],
          loop: true,
          volume: this.state.volume * 0.25,
        });
      }
      this.rainforestHowl.play();
      this.riverHowl.play();
      this.state.ambientPlaying = true;
      this.emit();
    } catch {
      // ignore autoplay block until user interacts
    }
  }

  stopAmbient() {
    if (this.rainforestHowl) {
      this.rainforestHowl.stop();
    }
    if (this.riverHowl) {
      this.riverHowl.stop();
    }
    this.state.ambientPlaying = false;
    this.emit();
  }

  toggleAmbient() {
    if (this.state.ambientPlaying) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  playSfx(type: "discover" | "correct" | "wrong" | "badge") {
    if (typeof window === "undefined" || this.state.muted) return;
    const srcMap = {
      discover: "/audio/sfx-discover.wav",
      correct: "/audio/sfx-correct.wav",
      wrong: "/audio/sfx-wrong.wav",
      badge: "/audio/sfx-badge.wav",
    };
    const src = srcMap[type];
    let howl = this.sfxCache.get(src);
    if (!howl) {
      howl = new Howl({ src: [src], volume: this.state.volume * 0.75 });
      this.sfxCache.set(src, howl);
    }
    howl.volume(this.state.volume * 0.75);
    howl.play();
  }

  playSpeciesCall(audioUrl: string) {
    if (typeof window === "undefined" || this.state.muted) return;
    if (this.activeEffectHowl) {
      this.activeEffectHowl.stop();
      this.activeEffectHowl.unload();
      this.activeEffectHowl = null;
    }
    const call = new Howl({
      src: [audioUrl],
      volume: this.state.volume * 0.85,
    });
    this.activeEffectHowl = call;
    call.play();
  }

  private clearProgressTimer() {
    if (this.progressTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Play Indonesian educational narration + optional animal/plant call.
   * Stops any prior narration before starting the new one.
   */
  playNarration(slug: string, narrationText: string, callAudioUrl?: string) {
    if (typeof window === "undefined") return;

    // If paused on the exact same species, resume instead of restarting
    if (
      this.state.activeNarrationSlug === slug &&
      this.state.narrationPaused
    ) {
      this.resumeNarration();
      return;
    }

    this.stopNarration();
    this.activeText = narrationText;
    this.activeCallUrl = callAudioUrl;

    if (callAudioUrl && !this.state.muted) {
      this.playSpeciesCall(callAudioUrl);
    }

    this.state.activeNarrationSlug = slug;
    this.state.narrationPlaying = true;
    this.state.narrationPaused = false;
    this.state.narrationProgress = 0;
    this.emit();

    const estimatedDurationMs = Math.max(4500, narrationText.length * 62);
    const startAt = Date.now();

    let usedSpeech = false;
    if ("speechSynthesis" in window && !this.state.muted) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(narrationText);
        utterance.lang = "id-ID";
        utterance.rate = 0.96;
        utterance.pitch = 1.06;
        utterance.volume = this.state.volume;

        const voices = window.speechSynthesis.getVoices();
        const idVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith("id")) ||
          voices.find((v) => v.lang.toLowerCase().includes("ms")) ||
          null;
        if (idVoice) {
          utterance.voice = idVoice;
        }

        utterance.onend = () => {
          if (this.state.activeNarrationSlug === slug) {
            this.stopNarration();
          }
        };
        utterance.onerror = () => {
          // Keep visual timer running cleanly if OS speech engine lacks voices
        };
        window.speechSynthesis.speak(utterance);
        usedSpeech = voices.length > 0;
      } catch {
        usedSpeech = false;
      }
    }

    // Smooth visual progress tracker (and clean fallback end if SpeechSynthesis has no voices)
    this.clearProgressTimer();
    this.progressTimer = window.setInterval(() => {
      if (this.state.narrationPaused || !this.state.narrationPlaying) return;
      const elapsed = Date.now() - startAt;
      const ratio = Math.min(1, elapsed / estimatedDurationMs);
      this.state.narrationProgress = ratio;
      this.emit();
      if (ratio >= 1 && (!usedSpeech || !window.speechSynthesis?.speaking)) {
        this.stopNarration();
      }
    }, 150);
  }

  pauseNarration() {
    if (typeof window === "undefined" || !this.state.narrationPlaying) return;
    this.state.narrationPlaying = false;
    this.state.narrationPaused = true;
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }
    if (this.activeEffectHowl && this.activeEffectHowl.playing()) {
      this.activeEffectHowl.pause();
    }
    this.emit();
  }

  resumeNarration() {
    if (typeof window === "undefined" || !this.state.narrationPaused) return;
    this.state.narrationPlaying = true;
    this.state.narrationPaused = false;
    if ("speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking && this.activeText) {
          this.playNarration(
            this.state.activeNarrationSlug || "item",
            this.activeText,
            this.activeCallUrl
          );
          return;
        }
      } catch {
        // ignore
      }
    }
    this.emit();
  }

  stopNarration() {
    this.clearProgressTimer();
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    }
    if (this.activeEffectHowl) {
      this.activeEffectHowl.stop();
      this.activeEffectHowl = null;
    }
    this.state.narrationPlaying = false;
    this.state.narrationPaused = false;
    this.state.activeNarrationSlug = null;
    this.state.narrationProgress = 0;
    this.emit();
  }

  stopAll() {
    this.stopNarration();
    this.stopAmbient();
  }
}

export const audioService = new AmazonAudioService();
