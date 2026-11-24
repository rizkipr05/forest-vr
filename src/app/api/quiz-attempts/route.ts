import { NextRequest, NextResponse } from "next/server";
import { attachExplorerCookie, getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import { isDatabaseConfigured, isRegisteredExplorer } from "@/lib/prisma";
import { saveQuizAttempt } from "@/services/quiz-service";

export async function POST(req: NextRequest) {
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  if (isDatabaseConfigured()) {
    if (isNew || !(await isRegisteredExplorer(explorerTag))) {
      return NextResponse.json(
        {
          ok: false,
          error: "Silakan masuk atau buat akun terlebih dahulu untuk mengerjakan kuis.",
        },
        { status: 401 }
      );
    }
  }

  let body: {
    quizSlug?: string;
    score?: number;
    totalQuestions?: number;
    percentage?: number;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 });
  }

  const score = Math.max(0, Math.floor(Number(body.score ?? 0)));
  const totalQuestions = Math.max(1, Math.floor(Number(body.totalQuestions ?? 1)));
  const percentage = Math.max(
    0,
    Math.min(100, Number(body.percentage ?? (score / totalQuestions) * 100))
  );
  const quizSlug =
    typeof body.quizSlug === "string" ? body.quizSlug : "petualangan-amazon-dasar";

  const result = await saveQuizAttempt(explorerTag, {
    quizSlug,
    score,
    totalQuestions,
    percentage,
  });

  const res = NextResponse.json({ ok: true, ...result });
  return attachExplorerCookie(res, explorerTag, isNew);
}
