"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Search, Sparkles } from "lucide-react";
import type { SpeciesCategory, SpeciesRecord } from "@/types/amazon";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import { AnimalShowcaseCard } from "@/components/animals/AnimalShowcaseCard";
import { PlantShowcaseCard } from "@/components/plants/PlantShowcaseCard";
import { Card } from "@/components/ui/card";

const CATEGORIES: ("Semua" | SpeciesCategory)[] = [
  "Semua",
  "Mamalia",
  "Burung",
  "Reptil",
  "Amfibi",
  "Tumbuhan",
];

export function EncyclopediaClient({ speciesList }: { speciesList: SpeciesRecord[] }) {
  const searchParams = useSearchParams();
  const initialCat = searchParams?.get("category") ?? "";
  const urlQuery = searchParams?.get("q") ?? "";

  const validUrlCat: "Semua" | SpeciesCategory = CATEGORIES.includes(
    initialCat as "Semua" | SpeciesCategory
  )
    ? (initialCat as "Semua" | SpeciesCategory)
    : "Semua";

  const [catState, setCatState] = useState<{
    base: string;
    value: "Semua" | SpeciesCategory;
  }>({ base: initialCat, value: validUrlCat });
  const [queryState, setQueryState] = useState<{ base: string; value: string }>({
    base: urlQuery,
    value: urlQuery,
  });

  const activeCategory = catState.base === initialCat ? catState.value : validUrlCat;
  const query = queryState.base === urlQuery ? queryState.value : urlQuery;

  const { progress } = useExplorerProgress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return speciesList.filter((item) => {
      const catMatch = activeCategory === "Semua" || item.category === activeCategory;
      const textMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [speciesList, activeCategory, query]);

  return (
    <div className="min-h-full bg-soft-tint pb-16">
      {/* Clean Airy Light Header */}
      <section className="border-b border-slate-200/80 bg-clean-grid py-10">
        <div className="mx-auto flex w-full max-w-[1640px] flex-col justify-between gap-6 px-5 sm:px-8 lg:px-12 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <BookOpen className="h-3.5 w-3.5" />
              Ensiklopedia Interaktif Amazon
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Ensiklopedia Satwa &amp;{" "}
              <span className="text-emerald-600">Flora Tropis</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Pelajari karakteristik, habitat, peran ekologis, suara panggilan
              alami, serta putar model 3D setiap spesies endemik Hutan Amazon.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                Terdata di Hutan 3D
              </p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {progress.discoveredSlugs.length}{" "}
                <span className="text-sm font-semibold text-emerald-600">
                  / {speciesList.length} Spesies
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1640px] px-5 pt-8 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kategori Ensiklopedia">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCatState({ base: initialCat, value: cat })}
                  className={`rounded-full border px-4 py-2 font-display text-sm font-semibold transition cursor-pointer ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-76">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) =>
                setQueryState({ base: urlQuery, value: e.target.value })
              }
              placeholder="Cari nama atau nama Latin..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pr-4 pl-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="mt-8 p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
              Spesies belum ditemukan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Coba ubah kata kunci pencarian atau pilih kategori &quot;Semua&quot;.
            </p>
          </Card>
        ) : (
          <div
            data-testid="encyclopedia-grid"
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item, idx) =>
              item.kind === "animal" ? (
                <AnimalShowcaseCard
                  key={item.id}
                  animal={item}
                  index={idx}
                  discovered={progress.discoveredSlugs.includes(item.slug)}
                />
              ) : (
                <PlantShowcaseCard
                  key={item.id}
                  plant={item}
                  index={idx}
                  discovered={progress.discoveredSlugs.includes(item.slug)}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
