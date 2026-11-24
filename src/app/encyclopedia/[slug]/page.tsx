import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { AMAZON_SPECIES } from "@/data/species";
import { findSpeciesBySlug, listAllSpecies } from "@/services/catalog-service";
import { SpeciesDetailClient } from "@/components/encyclopedia/SpeciesDetailClient";

export function generateStaticParams() {
  return AMAZON_SPECIES.map((s) => ({ slug: s.slug }));
}

async function SpeciesDetailLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [species, all] = await Promise.all([
    findSpeciesBySlug(slug),
    listAllSpecies(),
  ]);

  if (!species) {
    notFound();
  }

  const related = all.filter((s) => s.slug !== species.slug).slice(0, 4);
  return <SpeciesDetailClient species={species} relatedSpecies={related} />;
}

export default function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-16 text-center font-display text-xl text-emerald-800">
          Memuat Profil Spesies Amazon...
        </div>
      }
    >
      <SpeciesDetailLoader params={params} />
    </Suspense>
  );
}
