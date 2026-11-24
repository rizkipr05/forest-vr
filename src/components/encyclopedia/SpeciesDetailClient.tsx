"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Box,
  Camera,
  CheckCircle2,
  Compass,
  Leaf,
  MapPin,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import type { SpeciesRecord } from "@/types/amazon";
import { useAudio } from "@/hooks/use-audio";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import { audioService } from "@/services/audio-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { SpeciesViewerWrapper } from "./SpeciesViewerWrapper";

export function SpeciesDetailClient({
  species,
  relatedSpecies,
}: {
  species: SpeciesRecord;
  relatedSpecies: SpeciesRecord[];
}) {
  const [viewMode, setViewMode] = useState<"3d" | "photo">("3d");
  const audio = useAudio();
  const { progress, recordDiscovery } = useExplorerProgress();

  useEffect(() => {
    return () => {
      audioService.stopNarration();
    };
  }, [species.slug]);

  const isNarratingThis =
    audio.activeNarrationSlug === species.slug &&
    (audio.narrationPlaying || audio.narrationPaused);

  const isDiscovered = progress.discoveredSlugs.includes(species.slug);

  return (
    <div className="min-h-full bg-soft-tint pb-16">
      {/* Clean Light Subheader */}
      <section className="border-b border-slate-200/80 bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/encyclopedia"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 font-display text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Ensiklopedia
            </Link>
            <Badge category={species.category}>{species.category}</Badge>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Zona: {species.zone}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDiscovered ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Sudah Ditemukan di 3D
              </span>
            ) : (
              <Button
                variant="cream"
                size="sm"
                onClick={() => recordDiscovery(species.slug)}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Tandai Sudah Dipelajari
              </Button>
            )}
            <Link href={`/explore?focus=${species.slug}`}>
              <Button variant="sun" size="sm">
                <Compass className="h-4 w-4" />
                Temui di Hutan 3D
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 font-display text-xs font-bold transition cursor-pointer ${
                  viewMode === "3d"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Box className="h-4 w-4" />
                Model 3D Interaktif
              </button>
              <button
                type="button"
                onClick={() => setViewMode("photo")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 font-display text-xs font-bold transition cursor-pointer ${
                  viewMode === "photo"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Camera className="h-4 w-4" />
                Foto Habitat Asli
              </button>
            </div>

            {viewMode === "3d" ? (
              <SpeciesViewerWrapper species={species} />
            ) : (
              <div className="relative h-[390px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[450px]">
                <Image
                  src={species.imageUrl}
                  alt={`Foto habitat ${species.name}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow backdrop-blur-md">
                  Referensi Habitat Alami — {species.scientificName}
                </div>
              </div>
            )}

            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Volume2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Audio Narasi Edukasi
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      Bahasa Indonesia &amp; Suara Alam Amazon
                    </p>
                  </div>
                </div>

                <Button
                  variant="cream"
                  size="sm"
                  onClick={() => audio.playSpeciesCall(species.audioUrl)}
                >
                  Putar Suara Alam
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {audio.narrationPlaying && isNarratingThis ? (
                  <Button
                    variant="sun"
                    size="md"
                    onClick={audio.pauseNarration}
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4" />
                    Jeda Narasi
                  </Button>
                ) : (
                  <Button
                    variant="jungle"
                    size="md"
                    onClick={() =>
                      audio.playNarration(
                        species.slug,
                        species.narrationText,
                        species.audioUrl
                      )
                    }
                    className="flex-1"
                  >
                    <Play className="h-4 w-4" />
                    {audio.narrationPaused && isNarratingThis
                      ? "Lanjutkan Narasi"
                      : "Putar Narasi Lengkap"}
                  </Button>
                )}

                {isNarratingThis && (
                  <Button
                    variant="cream"
                    size="md"
                    onClick={audio.stopNarration}
                    aria-label="Hentikan narasi"
                  >
                    <Square className="h-4 w-4 text-rose-600" />
                    Stop
                  </Button>
                )}
              </div>

              {isNarratingThis && (
                <div className="mt-3 space-y-2">
                  <ProgressBar value={audio.narrationProgress * 100} max={100} />
                  <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed font-medium text-slate-700">
                    &ldquo;{species.narrationText}&rdquo;
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-6">
            <Card className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <Image
                    src={species.imageUrl}
                    alt={species.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {species.name}
                  </h1>
                  <p className="font-editorial mt-0.5 text-sm italic text-emerald-700">
                    {species.scientificName} • {species.englishName}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-base leading-relaxed text-slate-600">
                {species.description}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase">
                    <MapPin className="h-3.5 w-3.5" /> Habitat Alami
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {species.habitat}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-lime-700 uppercase">
                    <Leaf className="h-3.5 w-3.5" /> Peran &amp; Makanan
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {species.dietOrRole}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm font-semibold text-sky-900">
                <ShieldAlert className="h-5 w-5 shrink-0 text-sky-600" />
                <span>
                  Status Konservasi: <strong>{species.conservationStatus}</strong>
                </span>
              </div>
            </Card>

            <Card className="border-amber-200/70 bg-amber-50/35 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Tahukah Kamu? (Fakta Menarik)
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {species.funFacts.map((fact, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 text-sm font-medium text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-mono text-xs font-bold text-amber-800">
                      {idx + 1}
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {relatedSpecies.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Spesies Lain di Ekosistem Amazon
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedSpecies.map((rel) => (
                <Link key={rel.id} href={`/encyclopedia/${rel.slug}`}>
                  <Card className="group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={rel.imageUrl}
                        alt={rel.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <Badge category={rel.category} className="px-2 py-0.5 text-[10px]">
                        {rel.category}
                      </Badge>
                      <p className="mt-1 truncate font-display text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                        {rel.name}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
