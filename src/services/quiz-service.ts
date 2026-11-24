import { AMAZON_ACHIEVEMENTS, AMAZON_QUIZ } from "@/data/quizzes";
import { getPrisma } from "@/lib/prisma";
import type { QuizDefinition, QuizQuestionType } from "@/types/amazon";
import { ensureExplorerUser, evaluateAndUnlockAchievements } from "./progress-service";

export async function getActiveQuiz(): Promise<{ quiz: QuizDefinition; source: "database" | "seed" }> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const dbQuiz = await prisma.quiz.findFirst({
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: {
              options: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });
      if (dbQuiz && dbQuiz.questions.length > 0) {
        return {
          source: "database",
          quiz: {
            id: dbQuiz.id,
            slug: dbQuiz.slug,
            title: dbQuiz.title,
            description: dbQuiz.description,
            questions: dbQuiz.questions.map((q) => ({
              id: q.id,
              type: q.type as QuizQuestionType,
              prompt: q.prompt,
              hint: q.hint,
              imageUrl: q.imageUrl ?? undefined,
              relatedSpeciesSlug: q.relatedSpeciesSlug ?? undefined,
              explanation: q.explanation,
              options: q.options.map((o) => ({
                id: o.id,
                label: o.label,
                isCorrect: o.isCorrect,
              })),
            })),
          },
        };
      }
    } catch {
      // Fall back cleanly to seed data
    }
  }

  return { quiz: AMAZON_QUIZ, source: "seed" };
}

export async function saveQuizAttempt(
  explorerTag: string,
  input: {
    quizSlug: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }
) {
  const prisma = getPrisma();
  if (!prisma) {
    return { savedToDatabase: false, unlockedAchievements: [] as string[] };
  }

  try {
    const user = await ensureExplorerUser(explorerTag);
    if (!user) return { savedToDatabase: false, unlockedAchievements: [] as string[] };

    let quiz = await prisma.quiz.findUnique({ where: { slug: input.quizSlug } });
    if (!quiz) {
      quiz = await prisma.quiz.findFirst();
    }
    if (!quiz) {
      return { savedToDatabase: false, unlockedAchievements: [] as string[] };
    }

    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score: input.score,
        totalQuestions: input.totalQuestions,
        percentage: input.percentage,
      },
    });

    const newlyUnlocked = await evaluateAndUnlockAchievements(user.id);
    return { savedToDatabase: true, unlockedAchievements: newlyUnlocked };
  } catch {
    return { savedToDatabase: false, unlockedAchievements: [] as string[] };
  }
}

export async function listAchievementsCatalog() {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.achievement.findMany({ orderBy: { requirementValue: "asc" } });
      if (rows.length > 0) {
        return { items: rows, source: "database" as const };
      }
    } catch {
      // Fallback
    }
  }
  return { items: AMAZON_ACHIEVEMENTS, source: "seed" as const };
}
