import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import { isRegisteredExplorer } from "@/lib/prisma";
import { ProgressClient } from "@/components/progress/ProgressClient";

async function ProgressLoader() {
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  if (isNew || !(await isRegisteredExplorer(explorerTag))) {
    redirect("/account?next=/progress");
  }

  return <ProgressClient />;
}

export default function ProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-16 text-center font-display text-xl text-emerald-800">
          Membuka Paspor &amp; Dashboard Penjelajah...
        </div>
      }
    >
      <ProgressLoader />
    </Suspense>
  );
}
