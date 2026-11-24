"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Glasses,
  Trophy,
} from "lucide-react";
import { HeroCanvasWrapper, type HeroViewpoint } from "./HeroCanvasWrapper";
import { AnimalShowcaseCard } from "@/components/animals/AnimalShowcaseCard";
import { PlantShowcaseCard } from "@/components/plants/PlantShowcaseCard";
import { RainforestStrataExplorer } from "@/components/plants/RainforestStrataExplorer";
import { Button } from "@/components/ui/button";
import { AMAZON_SPECIES, getAnimals, getPlants } from "@/data/species";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";

const CAMERA_PRESETS: { id: HeroViewpoint; label: string }[] = [
  { id: "overview", label: "Panorama Sungai" },
  { id: "animals", label: "Jaguar & Makaw" },
  { id: "river", label: "Teratai & Jembatan" },
  { id: "canopy", label: "Puncak Kanopi" },
];

const EXPEDITION_STEPS = [
  {
    num: "01",
    title: "Masuk ke Hutan Amazon 3D",
    desc: "Jalan bebas menyusuri tepi sungai dan jembatan kayu memakai keyboard WASD, joystick sentuh, atau kacamata WebXR VR.",
    href: "/explore",
    cta: "Buka Dunia 3D",
  },
  {
    num: "02",
    title: "Pilih & Putar Spesimen",
    desc: "Klik hewan atau tumbuhan di habitat aslinya untuk memfokuskan kamera dan mengamati model 3D dari segala arah.",
    href: "/encyclopedia",
    cta: "Buka Ensiklopedia",
  },
  {
    num: "03",
    title: "Dengar Suara & Narasi Indonesia",
    desc: "Putar suara panggilan satwa sekaligus penjelasan audio berbahasa Indonesia yang jelas dan menyenangkan untuk anak.",
    href: "/encyclopedia/jaguar",
    cta: "Dengar Contoh",
  },
  {
    num: "04",
    title: "Tuntaskan Kuis Penjelajah",
    desc: "Jawab 10 pertanyaan tebak gambar serta fakta unik Amazon dan kumpulkan seluruh 5 lencana Penjaga Hutan.",
    href: "/quiz",
    cta: "Mulai Kuis Seru",
  },
];

export function LandingPageClient() {
  const [viewpoint, setViewpoint] = useState<HeroViewpoint>("overview");
  const animals = getAnimals();
  const plants = getPlants();
  const { progress } = useExplorerProgress();

  return (
    <div className="relative overflow-hidden bg-white">
      {/* ==================== CLEAN BRIGHT EDITORIAL HERO + INTERACTIVE 3D STAGE ==================== */}
      <section className="relative overflow-hidden bg-[#eef7f1] pt-10 pb-14 sm:pt-14 lg:pb-20">
        {/* Moving Panoramic Amazon Rainforest Background (Hero section only) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-ken-burns relative h-full w-full">
            <Image
              src="/images/hero-amazon-bg.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-55"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-emerald-50/45 to-white" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-white/65" />

          {/* Subtle floating morning sunlight motes */}
          <span
            className="animate-drift-mote absolute top-[18%] left-[16%] h-2.5 w-2.5 rounded-full bg-amber-300/80 blur-[1px]"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="animate-drift-mote absolute top-[28%] left-[78%] h-3 w-3 rounded-full bg-emerald-300/75 blur-[1px]"
            style={{ animationDelay: "2.2s" }}
          />
          <span
            className="animate-drift-mote absolute top-[14%] left-[52%] h-2 w-2 rounded-full bg-yellow-200/85 blur-[1px]"
            style={{ animationDelay: "4.5s" }}
          />
          <span
            className="animate-drift-mote absolute top-[34%] left-[26%] h-2 w-2 rounded-full bg-amber-200/80 blur-[1px]"
            style={{ animationDelay: "6.1s" }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12">
          {/* Playful Flanking Wildlife Medallions (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-4 left-12 hidden xl:block animate-float-gentle"
          >
            <div className="relative h-24 w-24 -rotate-6 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-emerald-950/10">
              <Image
                src="/images/animals/poison-dart-frog.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-6 right-12 hidden xl:block animate-float-gentle"
          >
            <div className="relative h-24 w-24 rotate-6 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-emerald-950/10">
              <Image
                src="/images/animals/macaw.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl leading-[1.12] font-bold tracking-tight text-[#11261c] sm:text-5xl lg:text-[3.5rem]">
              Jelajahi Keajaiban{" "}
              <span className="text-emerald-600">Hutan Amazon!</span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Belajar mengenal {AMAZON_SPECIES.length} satwa dan tumbuhan
              endemik Amazon dalam lingkungan 3D interaktif, narasi suara
              Indonesia, kuis edukatif, serta dukungan Virtual Reality.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/explore"
                className="inline-flex h-13 items-center gap-2.5 rounded-full border-b-4 border-[#ca8a04] bg-[#facc15] px-8 font-display text-base font-bold text-slate-900 shadow-md transition hover:bg-[#fde047] active:translate-y-0.5 active:border-b-0"
              >
                <Compass className="h-5 w-5" />
                Mulai Petualangan
              </Link>

              <a href="#keanekaragaman-hayati">
                <Button variant="cream" size="xl" className="h-13 px-6">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Pelajari Tentang Amazon
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Clean Full-Width Sunlit 3D Stage (Zero fake browser dots) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mx-auto mt-10 max-w-6xl"
          >
            <div className="relative overflow-hidden rounded-3xl border border-emerald-950/10 bg-[#d8efe4] shadow-2xl shadow-emerald-950/12">
              <HeroCanvasWrapper viewpoint={viewpoint} />

              {/* Bottom Floating Interactive Camera Bar inside 3D World */}
              <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-white/94 px-3.5 py-2.5 shadow-lg sm:right-5 sm:bottom-5 sm:left-5">
                <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 hidden text-xs font-bold text-slate-500 md:inline">
                    Sudut Kamera:
                  </span>
                  {CAMERA_PRESETS.map((preset) => {
                    const active = viewpoint === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setViewpoint(preset.id)}
                        className={`rounded-full px-3 py-1.5 font-display text-xs font-semibold transition cursor-pointer ${
                          active
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <Link
                  href="/explore"
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 font-display text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  <Glasses className="h-3.5 w-3.5 text-[#facc15]" />
                  Masuk Dunia 3D &amp; VR
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== CLEAN BORDERLESS WILDLIFE GALLERY ==================== */}
      <section className="border-t border-slate-100 bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Kenali Penghuni Unik Hutan Amazon
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Dengarkan panggilan alami setiap satwa atau buka profil 3D untuk
                memutar bentuk aslinya secara interaktif.
              </p>
            </div>
            <Link
              href="/encyclopedia"
              className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              Lihat Semua {AMAZON_SPECIES.length} Spesies di Ensiklopedia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {animals.map((animal) => (
              <AnimalShowcaseCard
                key={animal.id}
                animal={animal}
                discovered={progress.discoveredSlugs.includes(animal.slug)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LIGHT INTERACTIVE BIODIVERSITY STRATA ==================== */}
      <section
        id="keanekaragaman-hayati"
        className="border-t border-slate-100 bg-[#f6faf7] py-16 lg:py-20"
      >
        <div className="mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-emerald-950/10 pb-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Empat Lapisan Kehidupan di Paru-Paru Dunia
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-600">
                Dari aliran sungai yang teduh hingga puncak pohon kapuk setinggi
                65 meter, setiap tingkat ketinggian memiliki iklim mikro dan
                penghuni yang berbeda.
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              Eksplorasi Langsung di Dunia 3D
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <RainforestStrataExplorer />
        </div>
      </section>

      {/* ==================== BALANCED BENTO FLORA COLLECTION (ZERO ORPHAN GAP) ==================== */}
      <section className="border-t border-slate-100 bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/10 pb-6 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tumbuhan Raksasa &amp; Eksotis Amazon
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Pohon penopang oksigen dunia, teratai raksasa pengapung sungai,
                hingga kantung air alami di atas dahan.
              </p>
            </div>
            <Link
              href="/encyclopedia?category=Tumbuhan"
              className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              Jelajahi Flora di Ensiklopedia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
            {plants.map((plant, idx) => (
              <div
                key={plant.id}
                className={
                  idx === 0
                    ? "md:col-span-2 lg:col-span-2 lg:row-span-2"
                    : "lg:col-span-2"
                }
              >
                <PlantShowcaseCard
                  plant={plant}
                  featured={idx === 0}
                  discovered={progress.discoveredSlugs.includes(plant.slug)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== MINIMALIST EDITORIAL PLAYBOOK SPLIT ==================== */}
      <section
        id="cara-belajar"
        className="border-t border-slate-100 bg-[#fbfdfb] py-16 lg:py-24"
      >
        <div className="mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Cara Bermain dan Belajar
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
                Setiap langkah dirancang sederhana agar anak dapat langsung
                berpetualang di hutan 3D, mendengar narasi, lalu menguji
                pengetahuannya.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/quiz"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-b-4 border-[#ca8a04] bg-[#facc15] px-6 font-display text-sm font-bold text-slate-900 shadow-sm transition hover:bg-[#fde047] active:translate-y-0.5 active:border-b-0"
                >
                  Mulai Kuis Interaktif
                </Link>
                <Link href="/progress">
                  <Button variant="cream" size="lg" className="h-12">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                    Paspor Progres ({progress.discoveredSlugs.length}/13)
                  </Button>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-200 border-t border-b border-slate-200 lg:col-span-7">
              {EXPEDITION_STEPS.map((item) => (
                <Link
                  key={item.num}
                  href={item.href}
                  className="group flex flex-col gap-3 py-5 transition sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="flex items-baseline gap-5">
                    <span className="font-editorial text-2xl font-bold italic text-emerald-600">
                      {item.num}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-display text-xs font-bold text-emerald-700">
                    {item.cta}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
