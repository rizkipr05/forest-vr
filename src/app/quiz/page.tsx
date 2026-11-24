import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import { isRegisteredExplorer } from "@/lib/prisma";
import { getActiveQuiz } from "@/services/quiz-service";
import { QuizClient } from "@/components/quiz/QuizClient";

async function QuizLoader() {
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  if (isNew || !(await isRegisteredExplorer(explorerTag))) {
    redirect("/account?next=/quiz");
  }

  const { quiz } = await getActiveQuiz();
  return <QuizClient quiz={quiz} />;
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-16 text-center font-display text-xl text-emerald-800">
          Menyiapkan Kuis Petualangan Amazon...
        </div>
      }
    >
      <QuizLoader />
    </Suspense>
  );
}
