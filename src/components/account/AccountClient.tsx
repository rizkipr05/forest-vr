"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Trees } from "lucide-react";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import type { ExplorerProgressSnapshot } from "@/types/amazon";
import { Button } from "@/components/ui/button";

const ALLOWED_NEXT_PATHS = new Set(["/quiz", "/progress", "/explore", "/encyclopedia"]);

export function AccountClient() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const nextPath = ALLOWED_NEXT_PATHS.has(rawNext) ? rawNext : "/progress";
  const { progress, applyAuthProfile } = useExplorerProgress();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? { username, displayName, password }
          : { username, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        profile?: ExplorerProgressSnapshot;
      };

      if (!res.ok || !data.ok || !data.profile) {
        setErrorMsg(data.error ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }

      applyAuthProfile(data.profile);
      window.location.assign(nextPath);
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-50/80 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Clean Standard Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Trees className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
            {mode === "login" ? "Masuk ke Akun" : "Buat Akun Baru"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Masuk untuk membuka Kuis dan Dashboard Progres."
              : "Daftar gratis tanpa email untuk mulai belajar."}
          </p>
        </div>

        {(rawNext === "/quiz" || rawNext === "/progress") && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-center text-xs font-medium text-amber-800">
            {rawNext === "/quiz"
              ? "Masuk terlebih dahulu untuk mengerjakan Kuis."
              : "Masuk terlebih dahulu untuk melihat halaman Progres."}
          </div>
        )}

        {progress.isRegistered && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
            <span>
              Masuk sebagai <strong>{progress.explorerName}</strong>
            </span>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
            >
              Buka Progres <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="account-username"
              className="block text-xs font-semibold text-slate-700"
            >
              Username
            </label>
            <input
              id="account-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: rizky_amazon"
              autoComplete="username"
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                htmlFor="account-display-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Nama Tampilan
              </label>
              <input
                id="account-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama kamu"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="account-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Kata Sandi
            </label>
            <input
              id="account-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 4 karakter"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700"
            >
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="jungle"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk"
              : "Daftar Akun"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className="font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Daftar di sini
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className="font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
