import React, { Suspense } from "react";
import { ExploreCanvasWrapper } from "@/components/3d/ExploreCanvasWrapper";

async function ExploreContent({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const params = await searchParams;
  return <ExploreCanvasWrapper initialFocusSlug={params?.focus || null} />;
}

export default function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-emerald-950 font-display text-xl text-emerald-100">
          Memuat Petualangan Amazon 3D...
        </div>
      }
    >
      <ExploreContent searchParams={searchParams} />
    </Suspense>
  );
}
