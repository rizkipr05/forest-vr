"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Compass, Droplets, Sun, Volume2 } from "lucide-react";
import { getSpeciesBySlug } from "@/data/species";
import { useAudio } from "@/hooks/use-audio";

interface StratumItem {
  id: string;
  code: string;
  name: string;
  altitude: string;
  rulerTop: string;
  sunPct: number;
  sunlight: string;
  humidity: string;
  heroImage: string;
  summary: string;
  speciesSlugs: string[];
  bandGradient: string;
  activeRing: string;
  badgeStyle: string;
}

const STRATA: StratumItem[] = [
  {
    id: "emergent",
    code: "LAPISAN 04",
    name: "Lapisan Emergen (Puncak Pohon)",
    altitude: "45 – 65 Meter",
    rulerTop: "65m",
    sunPct: 100,
    sunlight: "100% Sinar Matahari Penuh",
    humidity: "Angin Hangat & Terbuka",
    heroImage: "/images/plants/kapok-tree.jpg",
    summary:
      "Menara tertinggi Hutan Amazon! Pohon raksasa seperti Kapok Tree menjulang menembus awan hingga 65 meter, menjadi tempat bertengger burung Makaw Merah yang terbang melintasi langit.",
    speciesSlugs: ["kapok-tree", "macaw"],
    bandGradient: "from-sky-50 via-amber-50/70 to-emerald-50/50",
    activeRing: "border-amber-400 ring-2 ring-amber-400/25",
    badgeStyle: "bg-amber-100 text-amber-900",
  },
  {
    id: "canopy",
    code: "LAPISAN 03",
    name: "Lapisan Kanopi (Atap Hutan)",
    altitude: "20 – 45 Meter",
    rulerTop: "45m",
    sunPct: 80,
    sunlight: "80% Cahaya Tersaring",
    humidity: "Lembap & Kaya Buah Tropis",
    heroImage: "/images/animals/toucan.jpg",
    summary:
      "Atap hijau raksasa yang saling bertautan rapat seperti payung raksasa. Lebih dari separuh satwa Amazon hidup di sini karena berlimpahnya buah-buahan untuk Burung Tukan dan Kukang (Sloth).",
    speciesSlugs: ["toucan", "sloth"],
    bandGradient: "from-emerald-50/90 via-green-50/70 to-teal-50/50",
    activeRing: "border-emerald-500 ring-2 ring-emerald-500/25",
    badgeStyle: "bg-emerald-100 text-emerald-900",
  },
  {
    id: "understory",
    code: "LAPISAN 02",
    name: "Lapisan Bawah (Understory)",
    altitude: "5 – 20 Meter",
    rulerTop: "20m",
    sunPct: 18,
    sunlight: "15% Cahaya Teduh",
    humidity: "Udara Lembap (~85%)",
    heroImage: "/images/plants/bromeliad.jpg",
    summary:
      "Lorong hutan yang teduh dengan tanaman berdaun lebar penangkap cahaya. Bunga Helikonia, mangkuk air hujan Bromelia, dan Pakis Raksasa tumbuh subur melindungi satwa kecil.",
    speciesSlugs: ["bromeliad", "heliconia", "giant-fern"],
    bandGradient: "from-teal-50/90 via-emerald-50/60 to-cyan-50/40",
    activeRing: "border-teal-500 ring-2 ring-teal-500/25",
    badgeStyle: "bg-teal-100 text-teal-900",
  },
  {
    id: "floor-river",
    code: "LAPISAN 01",
    name: "Lantai Hutan & Aliran Sungai",
    altitude: "0 – 5 Meter",
    rulerTop: "5m",
    sunPct: 8,
    sunlight: "2 – 10% Cahaya Redup",
    humidity: "Basah & Kaya Nutrisi",
    heroImage: "/images/plants/amazon-water-lily.jpg",
    summary:
      "Jantung ekosistem sungai dan tanah berlumut! Jaguar dan Tapir menjelajahi tepian hutan, Katak Panah bersembunyi di bebatuan lembap, sementara Kapibara, Anakonda, dan Teratai Raksasa menghuni sungai.",
    speciesSlugs: [
      "jaguar",
      "capybara",
      "anaconda",
      "poison-dart-frog",
      "tapir",
      "amazon-water-lily",
    ],
    bandGradient: "from-sky-50/90 via-cyan-50/70 to-emerald-50/50",
    activeRing: "border-sky-500 ring-2 ring-sky-500/25",
    badgeStyle: "bg-sky-100 text-sky-900",
  },
];

export function RainforestStrataExplorer() {
  const [selectedId, setSelectedId] = useState<string>("canopy");
  const audio = useAudio();
  const active = STRATA.find((s) => s.id === selectedId) ?? STRATA[1];
  const activeSpecies = active.speciesSlugs
    .map((slug) => getSpeciesBySlug(slug))
    .filter((s) => Boolean(s));

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
      {/* Left: Interactive Visual Forest Cross-Section Diagram */}
      <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 lg:col-span-5">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <p className="font-display text-sm font-bold text-slate-900">
              Penampang Vertikal Hutan
            </p>
            <p className="text-xs text-slate-500">
              Klik lapisan ketinggian untuk melihat habitatnya
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-700">
            0 – 65 m
          </span>
        </div>

        <div className="relative flex flex-1 flex-col justify-between gap-2.5">
          {STRATA.map((item) => {
            const isSelected = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border bg-gradient-to-r p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${item.bandGradient} ${item.activeRing} shadow-sm`
                    : "border-slate-200/75 from-slate-50/70 to-white hover:border-emerald-300 hover:from-emerald-50/40 hover:to-white"
                }`}
              >
                {/* Left Altitude Scale Column */}
                <div className="flex w-12 shrink-0 flex-col items-center justify-center border-r border-slate-200/80 pr-3">
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {item.rulerTop}
                  </span>
                  <span className="mt-1 h-5 w-0.5 rounded-full bg-emerald-300/70" />
                </div>

                {/* Layer Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {item.code}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isSelected
                          ? item.badgeStyle
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.speciesSlugs.length} Spesies
                    </span>
                  </div>

                  <p className="mt-0.5 truncate font-display text-base font-bold text-slate-900">
                    {item.name}
                  </p>

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>{item.altitude}</span>
                    <span className="inline-flex items-center gap-1">
                      <Sun className="h-3 w-3 text-amber-500" />
                      {item.sunPct}% cahaya
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Photographic Habitat Banner & Interactive Resident Cards */}
      <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs lg:col-span-7">
        {/* Top Panoramic Habitat Photo Header */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-100 sm:h-60">
          <Image
            src={active.heroImage}
            alt={active.name}
            fill
            loading="eager"
            className="object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-white/95 px-3.5 py-1 font-display text-xs font-bold text-slate-900 shadow-sm">
              Ketinggian {active.altitude}
            </span>

            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-3 py-1 text-amber-200 backdrop-blur-xs">
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                {active.sunlight}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-3 py-1 text-sky-200 backdrop-blur-xs">
                <Droplets className="h-3.5 w-3.5 text-sky-400" />
                {active.humidity}
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              {active.code}
            </p>
            <h3 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">
              {active.name}
            </h3>
          </div>
        </div>

        {/* Editorial Description & Resident Species */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
          <div>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {active.summary}
            </p>

            <div className="mt-6">
              <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Penghuni Ekosistem di Lapisan Ini ({activeSpecies.length})
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {activeSpecies.map((sp) =>
                  sp ? (
                    <div
                      key={sp.slug}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2.5 transition hover:border-emerald-300 hover:bg-white hover:shadow-xs"
                    >
                      <Link
                        href={`/encyclopedia/${sp.slug}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <div className="relative h-13 w-15 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                          <Image
                            src={sp.imageUrl}
                            alt={sp.name}
                            fill
                            loading="eager"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                            {sp.name}
                          </p>
                          <p className="font-editorial truncate text-[11px] italic text-slate-500">
                            {sp.scientificName}
                          </p>
                        </div>
                      </Link>

                      <div className="flex shrink-0 items-center gap-1 pr-1">
                        <button
                          type="button"
                          onClick={() => audio.playSpeciesCall(sp.audioUrl)}
                          title={`Putar suara ${sp.name}`}
                          aria-label={`Putar suara ${sp.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 ring-1 ring-slate-200 transition hover:bg-emerald-50 cursor-pointer"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/encyclopedia/${sp.slug}`}
                          title={`Lihat model 3D ${sp.name}`}
                          aria-label={`Lihat model 3D ${sp.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-xs font-medium text-slate-500">
              Amati langsung ketinggian pohon dan sungai di mode eksplorasi 3D.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <Compass className="h-4 w-4" />
              Masuk ke Hutan 3D
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
