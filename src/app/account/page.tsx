import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Akun Penjelajah | Amazon Rainforest Explorer",
  description:
    "Buat akun atau masuk untuk menyimpan progres eksplorasi 3D, skor kuis, dan lencana pencapaian Hutan Amazon.",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-16 text-center font-display text-lg text-emerald-800">
          Menyiapkan Halaman Akun Penjelajah...
        </div>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
