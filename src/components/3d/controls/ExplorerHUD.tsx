"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Compass,
  Gamepad2,
  Glasses,
  HelpCircle,
  MapPin,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trees,
  Volume2,
  VolumeX,
  Wind,
  X,
} from "lucide-react";
import { AMAZON_SPECIES } from "@/data/species";
import type { SpeciesRecord } from "@/types/amazon";
import { useAudio } from "@/hooks/use-audio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";

export function ExplorerHUD({
  selectedSpecies,
  discoveredSlugs,
  isRegistered = false,
  isVRSupported,
  showTouchControls,
  onToggleTouchControls,
  onEnterVR,
  onResetPosition,
  onCloseInfo,
  onJumpToSpecies,
}: {
  selectedSpecies: SpeciesRecord | null;
  discoveredSlugs: string[];
  isRegistered?: boolean;
  isVRSupported: boolean;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onEnterVR: () => void;
  onResetPosition: () => void;
  onCloseInfo: () => void;
  onJumpToSpecies: (species: SpeciesRecord) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [controlsHintOpen, setControlsHintOpen] = useState(true);

  const audio = useAudio();

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial
    }
  };

  const isNarratingThis =
    selectedSpecies &&
    audio.activeNarrationSlug === selectedSpecies.slug &&
    (audio.narrationPlaying || audio.narrationPaused);

  return (
    <>
      {/* ================= CLEAN FROSTED-WHITE TOP HUD BAR ================= */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-2.5 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 font-display text-xs font-bold text-slate-800 shadow-md transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          <Link
            href="/encyclopedia"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 font-display text-xs font-semibold text-slate-700 shadow-md transition hover:bg-white"
          >
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span className="hidden md:inline">Ensiklopedia</span>
          </Link>

          {isRegistered && (
            <>
              <Link
                href="/quiz"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 font-display text-xs font-semibold text-slate-700 shadow-md transition hover:bg-white"
              >
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <span className="hidden md:inline">Kuis</span>
              </Link>

              <Link
                href="/progress"
                className="flex h-10 items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 text-slate-900 shadow-md transition hover:bg-white"
              >
                <Compass className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-display text-[11px] font-bold leading-none text-slate-800">
                    {discoveredSlugs.length} / {AMAZON_SPECIES.length} Ditemukan
                  </p>
                  <div className="mt-1 w-20">
                    <ProgressBar
                      value={discoveredSlugs.length}
                      max={AMAZON_SPECIES.length}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="pointer-events-auto relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetPosition}
            title="Reset posisi ke titik awal"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 font-display text-xs font-semibold text-slate-800 shadow-md transition hover:bg-white cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Reset Posisi</span>
          </button>

          <button
            type="button"
            onClick={onToggleTouchControls}
            title="Tampilkan / sembunyikan joystick virtual"
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3 font-display text-xs font-semibold shadow-md transition cursor-pointer ${
              showTouchControls
                ? "border-amber-400 bg-[#facc15] text-slate-900"
                : "border-slate-200/90 bg-white/95 text-slate-800 hover:bg-white"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden lg:inline">Joystick</span>
          </button>

          <button
            type="button"
            onClick={audio.toggleAmbient}
            title={audio.ambientPlaying ? "Matikan suasana hutan" : "Putar suara hutan"}
            className={`hidden h-10 items-center gap-1.5 rounded-full border px-3 font-display text-xs font-semibold shadow-md transition sm:inline-flex cursor-pointer ${
              audio.ambientPlaying
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200/90 bg-white/95 text-slate-800 hover:bg-white"
            }`}
          >
            <Wind className="h-4 w-4" />
            <span className="hidden xl:inline">Suara Hutan</span>
          </button>

          <button
            type="button"
            onClick={() => setAudioMenuOpen((prev) => !prev)}
            aria-label="Pengaturan audio"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 font-display text-xs font-semibold text-slate-800 shadow-md transition hover:bg-white cursor-pointer"
          >
            {audio.muted ? (
              <VolumeX className="h-4 w-4 text-rose-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Audio</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Keluar fullscreen" : "Masuk fullscreen"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-md transition hover:bg-white cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {isVRSupported && (
            <button
              type="button"
              onClick={onEnterVR}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#facc15] px-4 font-display text-xs font-bold text-slate-900 shadow-md transition hover:bg-[#eab308] cursor-pointer"
            >
              <Glasses className="h-4 w-4" />
              Enter VR
            </button>
          )}

          {audioMenuOpen && (
            <div className="absolute top-12 right-0 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">
                  Pengaturan Suara Hutan
                </h3>
                <button
                  type="button"
                  onClick={() => setAudioMenuOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                <button
                  type="button"
                  onClick={audio.toggleAmbient}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    audio.ambientPlaying
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Trees className="h-4 w-4 text-emerald-600" />
                    Suara Lingkungan Hutan
                  </span>
                  <span>{audio.ambientPlaying ? "Aktif" : "Mati"}</span>
                </button>

                <button
                  type="button"
                  onClick={audio.toggleMute}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    audio.muted
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <span>Status Suara Global</span>
                  <span>{audio.muted ? "Dibisukan" : "Aktif"}</span>
                </button>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Volume Utama</span>
                    <span>{Math.round(audio.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(audio.volume * 100)}
                    onChange={(e) => audio.setVolume(Number(e.target.value) / 100)}
                    className="mt-1.5 w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTROLS HELPER BANNER ================= */}
      {controlsHintOpen && !selectedSpecies && (
        <div className="pointer-events-auto fixed top-18 left-4 z-20 hidden max-w-xs rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 text-xs text-slate-700 shadow-lg md:block">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display font-bold text-emerald-700">
                Panduan Eksplorasi:
              </p>
              <p className="mt-0.5 leading-relaxed">
                <strong>W A S D</strong> / <strong>Panah</strong> untuk berjalan,{" "}
                <strong>Seret Mouse</strong> untuk melihat sekeliling, dan{" "}
                <strong>Klik Hewan/Tumbuhan</strong> untuk belajar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setControlsHintOpen(false)}
              className="rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              aria-label="Tutup panduan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BOTTOM QUICK SPECIES STRIP ================= */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-xl">
          {AMAZON_SPECIES.map((sp) => {
            const found = discoveredSlugs.includes(sp.slug);
            const active = selectedSpecies?.slug === sp.slug;
            return (
              <button
                key={sp.slug}
                type="button"
                data-testid={`radar-btn-${sp.slug}`}
                onClick={() => onJumpToSpecies(sp)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold transition cursor-pointer ${
                  active
                    ? "bg-[#facc15] text-slate-900 shadow-xs"
                    : found
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {found && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                <span>{sp.name.split(" (")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= CLEAN WHITE INFO DOSSIER PANEL ================= */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.aside
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 36 }}
            transition={{ duration: 0.22 }}
            aria-label={`Informasi ${selectedSpecies.name}`}
            className="pointer-events-auto fixed top-16 right-3 bottom-16 z-30 flex w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-4"
          >
            <div className="relative h-44 w-full shrink-0 bg-slate-100">
              <Image
                src={selectedSpecies.imageUrl}
                alt={selectedSpecies.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
              <button
                type="button"
                onClick={onCloseInfo}
                aria-label="Tutup panel informasi"
                className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <Badge category={selectedSpecies.category} className="mb-1.5">
                  {selectedSpecies.category}
                </Badge>
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {selectedSpecies.name}
                </h2>
                <p className="font-editorial text-xs italic text-emerald-200">
                  {selectedSpecies.scientificName}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-slate-800">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-800 uppercase">
                    Narasi Suara Indonesia
                  </span>
                  <button
                    type="button"
                    onClick={() => audio.playSpeciesCall(selectedSpecies.audioUrl)}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-800 shadow-xs hover:bg-amber-50 cursor-pointer"
                  >
                    Suara Alam
                  </button>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  {audio.narrationPlaying && isNarratingThis ? (
                    <Button
                      variant="sun"
                      size="sm"
                      onClick={audio.pauseNarration}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4" />
                      Jeda Narasi
                    </Button>
                  ) : (
                    <Button
                      variant="jungle"
                      size="sm"
                      onClick={() =>
                        audio.playNarration(
                          selectedSpecies.slug,
                          selectedSpecies.narrationText,
                          selectedSpecies.audioUrl
                        )
                      }
                      className="flex-1"
                    >
                      <Play className="h-4 w-4" />
                      {audio.narrationPaused && isNarratingThis
                        ? "Lanjutkan Narasi"
                        : "Dengarkan Narasi"}
                    </Button>
                  )}

                  {isNarratingThis && (
                    <Button
                      variant="cream"
                      size="sm"
                      onClick={audio.stopNarration}
                      aria-label="Hentikan narasi"
                    >
                      <Square className="h-4 w-4 text-rose-600" />
                    </Button>
                  )}
                </div>

                {isNarratingThis && (
                  <div className="mt-2.5">
                    <ProgressBar
                      value={audio.narrationProgress * 100}
                      max={100}
                      className="h-2"
                    />
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                {selectedSpecies.description}
              </p>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase">
                  <MapPin className="h-3.5 w-3.5" /> Habitat &amp; Zona
                </p>
                <p className="mt-1 text-sm text-slate-700">{selectedSpecies.habitat}</p>
                <p className="mt-1.5 text-xs font-bold text-sky-700">
                  Peran Ekosistem: {selectedSpecies.dietOrRole}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Fakta Menarik
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {selectedSpecies.funFacts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 bg-slate-50/70 p-3.5">
              <Link href={`/encyclopedia/${selectedSpecies.slug}`} className="flex-1">
                <Button variant="cream" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4" />
                  Detail 3D
                </Button>
              </Link>
              <Button variant="jungle" size="sm" onClick={onCloseInfo} className="flex-1">
                Lanjut Jelajah
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
