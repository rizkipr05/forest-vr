import React, { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const outfit = localFont({
  variable: "--font-outfit",
  src: [
    { path: "./fonts/outfit-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/outfit-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/outfit-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const plusJakarta = localFont({
  variable: "--font-jakarta",
  src: [
    { path: "./fonts/plus-jakarta-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const fraunces = localFont({
  variable: "--font-fraunces",
  src: [
    { path: "./fonts/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/fraunces-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/fraunces-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Amazon Rainforest Explorer — Ekspedisi Edukasi 3D & WebXR",
  description:
    "Jelajahi keajaiban ekosistem Hutan Amazon secara interaktif dalam lingkungan 3D dan Virtual Reality, lengkap dengan ensiklopedia satwa dan flora, narasi audio Indonesia, serta kuis penjelajah.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${plusJakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f2ea] text-[#0b2419]">
        <Suspense fallback={<div className="h-20 bg-[#0b2419]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
