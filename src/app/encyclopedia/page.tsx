import React, { Suspense } from "react";
import { listAllSpecies } from "@/services/catalog-service";
import { EncyclopediaClient } from "@/components/encyclopedia/EncyclopediaClient";

async function EncyclopediaLoader() {
  const speciesList = await listAllSpecies();
  return <EncyclopediaClient speciesList={speciesList} />;
}

export default function EncyclopediaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-16 text-center font-display text-xl text-emerald-800">
          Membuka Ensiklopedia Hutan Amazon...
        </div>
      }
    >
      <EncyclopediaLoader />
    </Suspense>
  );
}
