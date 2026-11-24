"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Compass } from "lucide-react";

const AmazonWorld = dynamic(
  () => import("./AmazonWorld").then((mod) => ({ default: mod.AmazonWorld })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 ring-4 ring-emerald-400/40">
          <Compass className="h-10 w-10 animate-spin text-amber-300" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">
          Menyiapkan Dunia Hutan Amazon 3D...
        </h1>
        <p className="mt-2 text-sm text-emerald-200">
          Memuat pepohonan tropis, aliran sungai, dan 13 satwa interaktif
        </p>
      </div>
    ),
  }
);

export function ExploreCanvasWrapper({
  initialFocusSlug,
}: {
  initialFocusSlug?: string | null;
}) {
  return <AmazonWorld initialFocusSlug={initialFocusSlug} />;
}
