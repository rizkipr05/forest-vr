"use client";

import { useCallback, useEffect, useState } from "react";
import { AMAZON_ACHIEVEMENTS } from "@/data/quizzes";
import type { ExplorerProgressSnapshot } from "@/types/amazon";

const STORAGE_KEY = "amazon_explorer_progress_v1";

let sharedInFlightFetch: Promise<ExplorerProgressSnapshot | null> | null = null;
let sharedRemoteSnapshot: ExplorerProgressSnapshot | null = null;
const progressListeners = new Set<(snap: ExplorerProgressSnapshot) => void>();

function notifyProgressListeners(snap: ExplorerProgressSnapshot) {
  for (const listener of progressListeners) {
    listener(snap);
  }
}

async function fetchRemoteProgressDeduped(force = false): Promise<ExplorerProgressSnapshot | null> {
  if (!force && sharedRemoteSnapshot) {
    return sharedRemoteSnapshot;
  }
  if (!sharedInFlightFetch) {
    sharedInFlightFetch = fetch("/api/progress", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as ExplorerProgressSnapshot;
        sharedRemoteSnapshot = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        sharedInFlightFetch = null;
      });
  }
  return sharedInFlightFetch;
}

function createDefaultSnapshot(): ExplorerProgressSnapshot {
  return {
    explorerId: "guest-explorer",
    explorerName: "Penjelajah Muda",
    username: null,
    avatarSlug: "jaguar",
    isRegistered: false,
    bestQuizScore: 0,
    discoveredSlugs: [],
    totalDiscoveries: 0,
    quizAttempts: [],
    unlockedAchievementCodes: [],
    storageSource: "local",
  };
}

function computeAchievements(
  discovered: string[],
  attempts: ExplorerProgressSnapshot["quizAttempts"]
): string[] {
  const unlocked = new Set<string>();
  const bestPct = attempts.reduce((m, a) => Math.max(m, a.percentage), 0);

  for (const ach of AMAZON_ACHIEVEMENTS) {
    if (ach.requirementType === "discover_count" && discovered.length >= ach.requirementValue) {
      unlocked.add(ach.code);
    }
    if (ach.requirementType === "discover_all" && discovered.length >= ach.requirementValue) {
      unlocked.add(ach.code);
    }
    if (ach.requirementType === "quiz_complete" && attempts.length >= ach.requirementValue) {
      unlocked.add(ach.code);
    }
    if (ach.requirementType === "quiz_score" && bestPct >= ach.requirementValue) {
      unlocked.add(ach.code);
    }
  }
  return Array.from(unlocked);
}

export function useExplorerProgress() {
  const [progress, setProgress] = useState<ExplorerProgressSnapshot>(createDefaultSnapshot);
  const [loaded, setLoaded] = useState(false);

  const loadProgress = useCallback(async (forceRefresh = false) => {
    let localSnap = createDefaultSnapshot();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ExplorerProgressSnapshot;
        localSnap = { ...localSnap, ...parsed };
      }
    } catch {
      // ignore localStorage errors
    }

    const remote = await fetchRemoteProgressDeduped(forceRefresh);
    if (remote) {
      // When connected to database, remote is the authoritative per-user state.
      // Never merge another user's or stale localStorage discoveries into a DB user.
      const authoritative: ExplorerProgressSnapshot =
        remote.storageSource === "database"
          ? {
              ...remote,
              totalDiscoveries: (remote.discoveredSlugs || []).length,
              unlockedAchievementCodes: Array.from(
                new Set([
                  ...(remote.unlockedAchievementCodes || []),
                  ...computeAchievements(remote.discoveredSlugs || [], remote.quizAttempts || []),
                ])
              ),
            }
          : {
              ...remote,
              discoveredSlugs: Array.from(
                new Set([...localSnap.discoveredSlugs, ...(remote.discoveredSlugs || [])])
              ),
              totalDiscoveries: Array.from(
                new Set([...localSnap.discoveredSlugs, ...(remote.discoveredSlugs || [])])
              ).length,
              quizAttempts:
                remote.quizAttempts && remote.quizAttempts.length > 0
                  ? remote.quizAttempts
                  : localSnap.quizAttempts,
              unlockedAchievementCodes: Array.from(
                new Set([
                  ...(remote.unlockedAchievementCodes || []),
                  ...computeAchievements(
                    Array.from(
                      new Set([...localSnap.discoveredSlugs, ...(remote.discoveredSlugs || [])])
                    ),
                    remote.quizAttempts && remote.quizAttempts.length > 0
                      ? remote.quizAttempts
                      : localSnap.quizAttempts
                  ),
                ])
              ),
            };
      sharedRemoteSnapshot = authoritative;
      setProgress(authoritative);
      notifyProgressListeners(authoritative);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authoritative));
      } catch {
        // ignore
      }
      setLoaded(true);
      return;
    }

    localSnap.unlockedAchievementCodes = computeAchievements(
      localSnap.discoveredSlugs,
      localSnap.quizAttempts
    );
    setProgress(localSnap);
    setLoaded(true);
  }, []);

  useEffect(() => {
    progressListeners.add(setProgress);
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) {
        void loadProgress(false);
      }
    }, 0);
    return () => {
      active = false;
      progressListeners.delete(setProgress);
      window.clearTimeout(timer);
    };
  }, [loadProgress]);

  const recordDiscovery = useCallback(async (slug: string): Promise<boolean> => {
    let isNew = false;
    setProgress((prev) => {
      if (prev.discoveredSlugs.includes(slug)) {
        return prev;
      }
      isNew = true;
      const nextSlugs = [...prev.discoveredSlugs, slug];
      const next: ExplorerProgressSnapshot = {
        ...prev,
        discoveredSlugs: nextSlugs,
        totalDiscoveries: nextSlugs.length,
        unlockedAchievementCodes: computeAchievements(nextSlugs, prev.quizAttempts),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      sharedRemoteSnapshot = next;
      window.setTimeout(() => notifyProgressListeners(next), 0);
      return next;
    });

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speciesSlug: slug }),
      });
    } catch {
      // local state already preserved
    }
    return isNew;
  }, []);

  const recordQuizAttempt = useCallback(
    async (payload: {
      quizSlug: string;
      quizTitle: string;
      score: number;
      totalQuestions: number;
      percentage: number;
    }) => {
      try {
        const res = await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadProgress(true);
          return;
        }
      } catch {
        // fallback to local persistence
      }

      setProgress((prev) => {
        const nextAttempts = [
          {
            id: `local-${Date.now()}`,
            quizTitle: payload.quizTitle,
            score: payload.score,
            totalQuestions: payload.totalQuestions,
            percentage: payload.percentage,
            createdAt: new Date().toISOString(),
          },
          ...prev.quizAttempts,
        ];
        const next: ExplorerProgressSnapshot = {
          ...prev,
          quizAttempts: nextAttempts,
          unlockedAchievementCodes: computeAchievements(prev.discoveredSlugs, nextAttempts),
        };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [loadProgress]
  );

  const applyAuthProfile = useCallback((profile: ExplorerProgressSnapshot) => {
    sharedRemoteSnapshot = profile;
    setProgress(profile);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
    window.setTimeout(() => notifyProgressListeners(profile), 0);
  }, []);

  const logoutAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as {
          ok: boolean;
          profile?: ExplorerProgressSnapshot;
        };
        if (data.profile) {
          applyAuthProfile(data.profile);
          return;
        }
      }
    } catch {
      // ignore network error
    }
    applyAuthProfile(createDefaultSnapshot());
  }, [applyAuthProfile]);

  return {
    progress,
    loaded,
    recordDiscovery,
    recordQuizAttempt,
    refreshProgress: loadProgress,
    applyAuthProfile,
    logoutAccount,
  };
}
