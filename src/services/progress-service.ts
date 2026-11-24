import { AMAZON_ACHIEVEMENTS } from "@/data/quizzes";
import { getSpeciesBySlug } from "@/data/species";
import { getPrisma } from "@/lib/prisma";
import type { ExplorerProgressSnapshot } from "@/types/amazon";

export async function ensureExplorerUser(explorerTag: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.user.upsert({
    where: { explorerTag },
    update: {},
    create: {
      explorerTag,
      displayName: "Penjelajah Muda",
    },
  });
}

export async function evaluateAndUnlockAchievements(userId: string): Promise<string[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const [discoveriesCount, attempts, allAchievements, existingUnlocks] = await Promise.all([
    prisma.learningProgress.count({ where: { userId, discovered: true } }),
    prisma.quizAttempt.findMany({ where: { userId } }),
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
  ]);

  const unlockedSet = new Set(existingUnlocks.map((u) => u.achievement.code));
  const bestPercentage = attempts.reduce((m, a) => Math.max(m, a.percentage), 0);
  const newlyUnlocked: string[] = [];

  for (const ach of allAchievements) {
    if (unlockedSet.has(ach.code)) continue;
    let eligible = false;
    if (ach.requirementType === "discover_count" && discoveriesCount >= ach.requirementValue) {
      eligible = true;
    } else if (ach.requirementType === "discover_all" && discoveriesCount >= ach.requirementValue) {
      eligible = true;
    } else if (ach.requirementType === "quiz_complete" && attempts.length >= ach.requirementValue) {
      eligible = true;
    } else if (ach.requirementType === "quiz_score" && bestPercentage >= ach.requirementValue) {
      eligible = true;
    }

    if (eligible) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: ach.id } },
        update: {},
        create: { userId, achievementId: ach.id },
      });
      newlyUnlocked.push(ach.code);
    }
  }

  return newlyUnlocked;
}

export async function getExplorerProgress(
  explorerTag: string
): Promise<ExplorerProgressSnapshot> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      explorerId: explorerTag,
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

  try {
    const user = await prisma.user.upsert({
      where: { explorerTag },
      update: {},
      create: {
        explorerTag,
        displayName: "Penjelajah Muda",
      },
      include: {
        learningProgress: {
          where: { discovered: true },
          orderBy: { lastVisitedAt: "desc" },
        },
        quizAttempts: {
          include: { quiz: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        achievements: {
          include: { achievement: true },
        },
      },
    });

    const discoveredSlugs = user.learningProgress.map((p) => p.speciesSlug);
    const bestQuizScore = user.quizAttempts.reduce(
      (max, a) => Math.max(max, Math.round(a.percentage)),
      0
    );
    return {
      explorerId: user.explorerTag,
      explorerName: user.displayName,
      username: user.username,
      avatarSlug: user.avatarSlug,
      isRegistered: user.isRegistered,
      joinedAt: user.createdAt.toISOString(),
      bestQuizScore,
      discoveredSlugs,
      totalDiscoveries: discoveredSlugs.length,
      quizAttempts: user.quizAttempts.map((a) => ({
        id: a.id,
        quizTitle: a.quiz.title,
        score: a.score,
        totalQuestions: a.totalQuestions,
        percentage: a.percentage,
        createdAt: a.createdAt.toISOString(),
      })),
      unlockedAchievementCodes: user.achievements.map((u) => u.achievement.code),
      storageSource: "database",
    };
  } catch {
    return {
      explorerId: explorerTag,
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
}

export async function recordSpeciesDiscovery(explorerTag: string, speciesSlug: string) {
  const species = getSpeciesBySlug(speciesSlug);
  const prisma = getPrisma();
  if (!prisma || !species) {
    return { savedToDatabase: false, unlockedAchievements: [] as string[] };
  }

  try {
    const user = await ensureExplorerUser(explorerTag);
    if (!user) return { savedToDatabase: false, unlockedAchievements: [] as string[] };

    await prisma.learningProgress.upsert({
      where: { userId_speciesSlug: { userId: user.id, speciesSlug } },
      update: {
        discovered: true,
        timesVisited: { increment: 1 },
        lastVisitedAt: new Date(),
      },
      create: {
        userId: user.id,
        speciesSlug,
        speciesKind: species.kind,
        discovered: true,
        timesVisited: 1,
      },
    });

    const newlyUnlocked = await evaluateAndUnlockAchievements(user.id);
    return { savedToDatabase: true, unlockedAchievements: newlyUnlocked };
  } catch {
    return { savedToDatabase: false, unlockedAchievements: [] as string[] };
  }
}

export function getAchievementCatalogFallback() {
  return AMAZON_ACHIEVEMENTS;
}
