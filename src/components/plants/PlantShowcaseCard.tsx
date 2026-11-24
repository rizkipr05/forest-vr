"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2, Compass, Volume2 } from "lucide-react";
import type { SpeciesRecord } from "@/types/amazon";
import { useAudio } from "@/hooks/use-audio";
import { Badge } from "@/components/ui/badge";

export function PlantShowcaseCard({
  plant,
  discovered = false,
  featured = false,
}: {
  plant: SpeciesRecord;
  index?: number;
  discovered?: boolean;
  featured?: boolean;
}) {
  const audio = useAudio();

  return (
    <article
      className={`group flex h-full flex-col ${
        featured ? "lg:col-span-2 lg:row-span-2" : ""
      }`}
    >
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-emerald-950/10 ${
          featured ? "flex-1 min-h-[260px]" : "aspect-[16/10]"
        }`}
      >
        <Link href={`/encyclopedia/${plant.slug}`} className="block h-full w-full">
          <Image
            src={plant.imageUrl}
            alt={plant.name}
            fill
            loading="eager"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge category={plant.category}>{plant.category}</Badge>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              audio.playSpeciesCall(plant.audioUrl);
            }}
            title={`Dengarkan suara alam ${plant.name}`}
            aria-label={`Dengarkan suara alam ${plant.name}`}
            className="pointer-events-auto inline-flex h-8 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-bold text-emerald-700 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Suara</span>
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
          <div className="min-w-0">
            <p className="font-editorial truncate text-xs italic text-lime-200">
              {plant.scientificName}
            </p>
            <h3
              className={`truncate font-display font-bold tracking-tight ${
                featured ? "text-xl sm:text-2xl" : "text-lg"
              }`}
            >
              {plant.name}
            </h3>
          </div>
          {discovered && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              <CheckCircle2 className="h-3 w-3" /> Terdata
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col pt-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          {plant.shortDescription}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <Link
            href={`/encyclopedia/${plant.slug}`}
            className="inline-flex items-center gap-1 font-display text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            <span>Pelajari &amp; Putar 3D</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            href={`/explore?focus=${plant.slug}`}
            title={`Lihat ${plant.name} di Hutan 3D`}
            aria-label={`Lihat ${plant.name} di Hutan 3D`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
          >
            <Compass className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
