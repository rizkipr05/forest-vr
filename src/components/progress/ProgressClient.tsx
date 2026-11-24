"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Compass,
  Database,
  Edit3,
  HelpCircle,
  Lock,
  LogOut,
  Trophy,
  UserCircle2,
  UserPlus,
} from "lucide-react";
import { AMAZON_SPECIES } from "@/data/species";
import { AMAZON_ACHIEVEMENTS } from "@/data/quizzes";
import { formatPercent } from "@/lib/utils";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import type { ExplorerProgressSnapshot } from "@/types/amazon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

const BADGE_IMAGE_MAP: Record<string, string> = {
  FIRST_DISCOVERY: "/images/badges/first-discovery.svg",
  RAINFOREST_SCOUT: "/images/badges/rainforest-scout.svg",
  AMAZON_GUARDIAN: "/images/badges/amazon-guardian.svg",
  QUIZ_CHALLENGER: "/images/badges/quiz-challenger.svg",
  AMAZON_SCHOLAR: "/images/badges/amazon-scholar.svg",
};

function getExplorerRank(discoveredCount: number, bestQuizScore: number): string {
  if (discoveredCount >= 13 && bestQuizScore >= 80) return "Penjaga Amazon Sejati";
  if (discoveredCount >= 5 || bestQuizScore >= 70) return "Pemandu Rimba";
  return "Penjelajah Muda";
}

export function ProgressClient() {
  const router = useRouter();
  const { progress, loaded, applyAuthProfile, logoutAccount } = useExplorerProgress();

  useEffect(() => {
    if (loaded && !progress.isRegistered) {
      router.replace("/account?next=/progress");
    }
  }, [loaded, progress.isRegistered, router]);
  const discoveredCount = progress.discoveredSlugs.length;
  const totalCount = AMAZON_SPECIES.length;
  const unlockedCount = progress.unlockedAchievementCodes.length;
  const bestQuizScore =
    progress.bestQuizScore ??
    progress.quizAttempts.reduce((m, a) => Math.max(m, Math.round(a.percentage)), 0);
  const rankTitle = getExplorerRank(discoveredCount, bestQuizScore);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(progress.explorerName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const openEditor = () => {
    setEditName(progress.explorerName);
    setProfileError(null);
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: editName }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        profile?: ExplorerProgressSnapshot;
      };
      if (!res.ok || !data.ok || !data.profile) {
        setProfileError(data.error ?? "Gagal memperbarui profil.");
        return;
      }
      applyAuthProfile(data.profile);
      setEditingProfile(false);
    } catch {
      setProfileError("Tidak dapat terhubung ke server.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-full bg-soft-tint pb-16">
      {/* Explorer Profile & Passport Dashboard Header */}
      <section className="border-b border-slate-200/80 bg-clean-grid py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Top Explorer Profile Card */}
          <Card className="mb-6 border-emerald-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <Award className="h-3 w-3" />
                      {rankTitle}
                    </span>
                    {progress.isRegistered && progress.username ? (
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        @{progress.username}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        Mode Tamu
                      </span>
                    )}
                  </div>
                  <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {progress.explorerName}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Catatan Petualangan &amp; Dashboard Pencapaian Hutan Amazon
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {progress.isRegistered ? (
                  <>
                    <Button variant="cream" size="sm" onClick={openEditor}>
                      <Edit3 className="h-3.5 w-3.5" />
                      Ubah Profil
                    </Button>
                    <Button
                      variant="cream"
                      size="sm"
                      onClick={async () => {
                        await logoutAccount();
                        window.location.assign("/account?next=/progress");
                      }}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar
                    </Button>
                  </>
                ) : (
                  <Link href="/account">
                    <Button variant="jungle" size="sm">
                      <UserPlus className="h-4 w-4" />
                      Buat Akun / Masuk
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {editingProfile && (
              <form
                onSubmit={handleSaveProfile}
                className="mt-5 border-t border-slate-100 pt-5"
              >
                <div className="grid gap-4 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-9">
                    <label
                      htmlFor="edit-display-name"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Nama Panggilan
                    </label>
                    <input
                      id="edit-display-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 md:col-span-3 md:justify-end">
                    <Button
                      type="button"
                      variant="cream"
                      size="sm"
                      onClick={() => setEditingProfile(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="jungle"
                      size="sm"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "..." : "Simpan"}
                    </Button>
                  </div>
                </div>
                {profileError && (
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    {profileError}
                  </p>
                )}
              </form>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <p className="font-display text-2xl font-bold text-emerald-600">
                {discoveredCount}/{totalCount}
              </p>
              <p className="text-[11px] font-bold text-slate-500">Spesies</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <p className="font-display text-2xl font-bold text-amber-600">
                {unlockedCount}/{AMAZON_ACHIEVEMENTS.length}
              </p>
              <p className="text-[11px] font-bold text-slate-500">Lencana</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <p className="font-display text-2xl font-bold text-sky-600">
                {progress.quizAttempts.length}
              </p>
              <p className="text-[11px] font-bold text-slate-500">Kuis Selesai</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <p className="font-display text-2xl font-bold text-violet-600">
                {formatPercent(bestQuizScore)}
              </p>
              <p className="text-[11px] font-bold text-slate-500">Nilai Terbaik</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Progres Penjelajahan Ekosistem</span>
              <span className="text-emerald-700">
                {formatPercent((discoveredCount / totalCount) * 100)}
              </span>
            </div>
            <ProgressBar value={discoveredCount} max={totalCount} className="h-3" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Lencana Pencapaian
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-emerald-700">
              <Database className="h-3.5 w-3.5" />
              {progress.storageSource === "database"
                ? "Tersinkron ke Cloud"
                : "Tersimpan di Perangkat"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AMAZON_ACHIEVEMENTS.map((ach) => {
              const unlocked = progress.unlockedAchievementCodes.includes(ach.code);
              return (
                <Card
                  key={ach.code}
                  className={`flex items-start gap-4 p-5 transition ${
                    unlocked
                      ? "border-amber-200 bg-amber-50/25"
                      : "bg-white/80 opacity-80"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0">
                    {unlocked ? (
                      <Image
                        src={BADGE_IMAGE_MAP[ach.code] || "/images/badges/first-discovery.svg"}
                        alt={ach.title}
                        width={56}
                        height={56}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {ach.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {ach.description}
                    </p>
                    <p className="mt-2 font-mono text-[11px] font-bold uppercase">
                      {unlocked ? (
                        <span className="text-emerald-600">✓ Berhasil Diraih</span>
                      ) : (
                        <span className="text-slate-400">Belum Terbuka</span>
                      )}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Daftar Spesies Hutan Amazon (13 Item)
            </h2>
            <Link href="/explore">
              <Button variant="sun" size="sm">
                <Compass className="h-4 w-4" />
                Cari di Hutan 3D
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AMAZON_SPECIES.map((sp) => {
              const found = progress.discoveredSlugs.includes(sp.slug);
              return (
                <Card
                  key={sp.id}
                  className={`flex items-center gap-3 p-3.5 ${
                    found ? "border-emerald-200 bg-white" : "bg-white/70"
                  }`}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={sp.imageUrl}
                      alt={sp.name}
                      fill
                      className={`object-cover ${found ? "" : "grayscale opacity-60"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge category={sp.category} className="px-2 py-0.5 text-[10px]">
                      {sp.category}
                    </Badge>
                    <p className="mt-1 truncate font-display text-sm font-bold text-slate-900">
                      {sp.name}
                    </p>
                    <div className="mt-1">
                      {found ? (
                        <Link
                          href={`/encyclopedia/${sp.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ditemukan
                        </Link>
                      ) : (
                        <Link
                          href={`/explore?focus=${sp.slug}`}
                          className="text-xs font-bold text-amber-600 hover:underline"
                        >
                          Temukan di 3D →
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Riwayat Kuis Penjelajah
            </h2>
            <Link href="/quiz">
              <Button variant="jungle" size="sm">
                <HelpCircle className="h-4 w-4" />
                Mainkan Kuis Lagi
              </Button>
            </Link>
          </div>

          {progress.quizAttempts.length === 0 ? (
            <Card className="mt-4 p-8 text-center">
              <HelpCircle className="mx-auto h-9 w-9 text-amber-500" />
              <p className="mt-2 font-display text-lg font-bold text-slate-900">
                Belum ada percobaan kuis
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Yuk coba jawab 10 pertanyaan seru untuk mendapatkan lencana
                Cendekiawan Muda Amazon!
              </p>
            </Card>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {progress.quizAttempts.map((attempt) => (
                <Card key={attempt.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-bold text-slate-900">
                      {attempt.quizTitle}
                    </p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-display text-sm font-bold text-emerald-700">
                      {formatPercent(attempt.percentage)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Skor: {attempt.score} / {attempt.totalQuestions} benar
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    {new Date(attempt.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
