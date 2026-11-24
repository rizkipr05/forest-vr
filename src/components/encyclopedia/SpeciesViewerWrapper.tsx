"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { SpeciesRecord } from "@/types/amazon";

const SpeciesModelViewer = dynamic(
  () =>
    import("@/components/3d/interactive/SpeciesModelViewer").then((mod) => ({
      default: mod.SpeciesModelViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-full items-center justify-center rounded-3xl border-4 border-emerald-200 bg-emerald-50 font-display text-emerald-700 sm:h-[440px]">
        Memuat Model 3D Interaktif...
      </div>
    ),
  }
);

export function SpeciesViewerWrapper({ species }: { species: SpeciesRecord }) {
  return <SpeciesModelViewer species={species} />;
}
