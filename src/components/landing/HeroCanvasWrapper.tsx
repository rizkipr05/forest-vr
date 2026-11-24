"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Trees } from "lucide-react";

export type HeroViewpoint = "overview" | "animals" | "river" | "canopy";

const HeroRainforestScene = dynamic(
  () =>
    import("./HeroRainforestScene").then((mod) => ({
      default: mod.HeroRainforestScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-950 text-emerald-50">
        <Trees className="h-12 w-12 animate-bounce text-lime-300" />
        <p className="mt-3 font-display text-lg font-semibold">
          Menumbuhkan Hutan Amazon 3D...
        </p>
      </div>
    ),
  }
);

export function HeroCanvasWrapper({
  viewpoint = "overview",
}: {
  viewpoint?: HeroViewpoint;
}) {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl sm:h-[480px] lg:h-[520px]">
      <HeroRainforestScene viewpoint={viewpoint} />
    </div>
  );
}
