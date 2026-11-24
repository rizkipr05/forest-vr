"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  HelpCircle,
  Home,
  Menu,
  Search,
  Trees,
  Trophy,
  UserCircle2,
  Volume2,
  VolumeX,
  Wind,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/use-audio";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import { audioService } from "@/services/audio-service";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Home, authRequired: false },
  { href: "/explore", label: "Jelajahi 3D", icon: Compass, authRequired: false },
  { href: "/encyclopedia", label: "Ensiklopedia", icon: BookOpen, authRequired: false },
  { href: "/quiz", label: "Kuis Seru", icon: HelpCircle, authRequired: true },
  { href: "/progress", label: "Progres", icon: Trophy, authRequired: true },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpenForPath, setMobileOpenForPath] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { muted, ambientPlaying, toggleMute, toggleAmbient } = useAudio();
  const { progress } = useExplorerProgress();
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.authRequired || progress.isRegistered
  );
  const mobileOpen = mobileOpenForPath === pathname;

  useEffect(() => {
    audioService.stopNarration();
  }, [pathname]);

  if (pathname?.startsWith("/explore")) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    router.push(q ? `/encyclopedia?q=${encodeURIComponent(q)}` : "/encyclopedia");
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-clip border-b border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8 lg:py-4.5">
        <div className="flex shrink-0 items-center gap-4 xl:gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 rounded-xl pr-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Trees className="h-6 w-6" />
            </span>
            <div className="leading-tight whitespace-nowrap">
              <span className="block font-display text-lg font-bold tracking-tight text-slate-900">
                AMAZON <span className="text-emerald-600">EDU</span>
              </span>
              <span className="hidden text-[11px] font-semibold tracking-wider text-emerald-700/80 uppercase sm:block">
                Rainforest 3D
              </span>
            </div>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex xl:gap-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 font-display text-sm font-semibold transition-all xl:px-4 xl:text-[15px]",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.href === "/progress" && (
                    <span className="ml-0.5 rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                      {progress.discoveredSlugs.length}/13
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Flexible wide search bar that scales with monitor width without overflowing */}
        <form onSubmit={handleSearch} className="relative hidden flex-1 md:block md:max-w-[220px] lg:max-w-[260px] xl:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari satwa atau tumbuhan..."
            aria-label="Cari satwa atau tumbuhan Amazon"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/85 pr-4 pl-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={toggleAmbient}
            aria-label={ambientPlaying ? "Matikan suasana hutan" : "Putar suasana hutan"}
            title={ambientPlaying ? "Suasana hutan aktif" : "Putar suara hutan Amazon"}
            className={cn(
              "hidden h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition sm:inline-flex cursor-pointer",
              ambientPlaying
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Wind className="h-4 w-4 shrink-0" />
            <span className="hidden 2xl:inline">Suara Hutan</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Nyalakan suara" : "Bisukan suara"}
            title={muted ? "Nyalakan suara" : "Bisukan suara"}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition cursor-pointer",
              muted
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>

          <Link
            href="/explore"
            className="hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-emerald-600 px-5 font-display text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex"
          >
            <Compass className="h-4 w-4 shrink-0" />
            Jelajah 3D
          </Link>

          {progress.isRegistered ? (
            <Link
              href="/progress"
              title={`Dashboard Profil ${progress.explorerName}`}
              className="hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50/80 px-4 font-display text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 sm:inline-flex"
            >
              <UserCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="max-w-[130px] truncate">{progress.explorerName}</span>
            </Link>
          ) : (
            <Link
              href="/account"
              className="hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4.5 font-display text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:inline-flex"
            >
              <UserCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Masuk</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() =>
              setMobileOpenForPath((prev) => (prev === pathname ? null : pathname))
            }
            aria-label="Buka menu navigasi"
            aria-expanded={mobileOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-3 lg:hidden">
          <form onSubmit={handleSearch} className="relative mb-3 md:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari satwa atau tumbuhan..."
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pr-4 pl-9 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </form>
          <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 font-display text-sm font-semibold transition",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.href === "/progress" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                      {progress.discoveredSlugs.length}/13
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href={progress.isRegistered ? "/progress" : "/account"}
              className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-4 py-3 font-display text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <span className="flex items-center gap-3">
                <UserCircle2 className="h-4 w-4" />
                {progress.isRegistered ? `Profil: ${progress.explorerName}` : "Masuk / Buat Akun"}
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
