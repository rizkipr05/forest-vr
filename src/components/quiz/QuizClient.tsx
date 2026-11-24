"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Compass,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import type { QuizDefinition, QuizQuestionType } from "@/types/amazon";
import { AMAZON_ACHIEVEMENTS } from "@/data/quizzes";
import { formatPercent } from "@/lib/utils";
import { useAudio } from "@/hooks/use-audio";
import { useExplorerProgress } from "@/hooks/use-explorer-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

const QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  multiple_choice: "Pilihan Ganda",
  guess_image: "Tebak Gambar Satwa",
  plant_id: "Identifikasi Tumbuhan",
  amazon_fact: "Fakta Menarik Amazon",
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

const BADGE_IMAGE_MAP: Record<string, string> = {
  FIRST_DISCOVERY: "/images/badges/first-discovery.svg",
  RAINFOREST_SCOUT: "/images/badges/rainforest-scout.svg",
  AMAZON_GUARDIAN: "/images/badges/amazon-guardian.svg",
  QUIZ_CHALLENGER: "/images/badges/quiz-challenger.svg",
  AMAZON_SCHOLAR: "/images/badges/amazon-scholar.svg",
};

export function QuizClient({ quiz }: { quiz: QuizDefinition }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const router = useRouter();
  const audio = useAudio();
  const { progress, loaded, recordQuizAttempt } = useExplorerProgress();

  useEffect(() => {
    if (loaded && !progress.isRegistered) {
      router.replace("/account?next=/quiz");
    }
  }, [loaded, progress.isRegistered, router]);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const answered = selectedOptionId !== null;
  const selectedOption = currentQuestion?.options.find(
    (o) => o.id === selectedOptionId
  );

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    if (answered) return;
    setSelectedOptionId(optionId);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      audio.playSfx("correct");
    } else {
      audio.playSfx("wrong");
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setShowHint(false);
      return;
    }

    const pct = (score / questions.length) * 100;
    setFinished(true);
    setSavingResult(true);
    audio.playSfx("badge");
    await recordQuizAttempt({
      quizSlug: quiz.slug,
      quizTitle: quiz.title,
      score,
      totalQuestions: questions.length,
      percentage: pct,
    });
    setSavingResult(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setScore(0);
    setShowHint(false);
    setFinished(false);
  };

  const finalPercentage = (score / questions.length) * 100;
  const earnedBadges = AMAZON_ACHIEVEMENTS.filter((ach) => {
    if (ach.requirementType === "quiz_complete") return true;
    if (ach.requirementType === "quiz_score") return finalPercentage >= ach.requirementValue;
    return progress.unlockedAchievementCodes.includes(ach.code);
  });

  if (finished) {
    const isStarExplorer = finalPercentage >= 80;
    return (
      <div className="min-h-full bg-soft-tint px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="overflow-hidden border-slate-200 text-center shadow-xl">
              <div className="border-b border-slate-100 bg-clean-grid p-8">
                <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-xs">
                  <Trophy className="h-9 w-9" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                  {isStarExplorer
                    ? "Luar Biasa, Penjelajah Hebat!"
                    : "Petualangan Kuis Selesai!"}
                </h1>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  {isStarExplorer
                    ? "Kamu menguasai fakta satwa dan flora ekosistem Hutan Amazon!"
                    : "Jelajahi kembali hutan 3D dan ensiklopedia agar skor ekspedisimu makin tinggi."}
                </p>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
                      Skor Akhir
                    </p>
                    <p className="mt-1 font-display text-4xl font-bold text-slate-900">
                      {score} / {questions.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                    <p className="text-xs font-bold tracking-wider text-amber-700 uppercase">
                      Persentase Benar
                    </p>
                    <p className="mt-1 font-display text-4xl font-bold text-amber-600">
                      {formatPercent(finalPercentage)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Lencana Pencapaian Kamu
                    </h2>
                    {savingResult && (
                      <span className="text-xs font-bold text-emerald-600">
                        Menyimpan ke database...
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.code}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <Image
                          src={BADGE_IMAGE_MAP[badge.code] || "/images/badges/quiz-challenger.svg"}
                          alt={badge.title}
                          width={44}
                          height={44}
                          className="shrink-0"
                        />
                        <div>
                          <p className="font-display text-sm font-bold text-slate-900">
                            {badge.title}
                          </p>
                          <p className="text-xs text-slate-600">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button variant="sun" size="lg" onClick={handleRestart}>
                    <RotateCcw className="h-4 w-4" />
                    Ulangi Kuis
                  </Button>
                  <Link href="/progress">
                    <Button variant="jungle" size="lg">
                      <Trophy className="h-4 w-4" />
                      Lihat Progresku
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="cream" size="lg">
                      <Compass className="h-4 w-4" />
                      Kembali ke Hutan 3D
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-soft-tint pb-14">
      <section className="border-b border-slate-200/80 bg-clean-grid py-8">
        <div className="mx-auto flex max-w-3xl flex-col justify-between gap-4 px-4 sm:flex-row sm:items-end sm:px-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <HelpCircle className="h-3.5 w-3.5" />
              {quiz.title}
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
              Pertanyaan {currentIndex + 1} dari {questions.length}
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Skor Saat Ini</p>
            <p className="font-display text-xl font-bold text-emerald-600">{score}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <ProgressBar
          value={currentIndex + (answered ? 1 : 0)}
          max={questions.length}
          className="mb-6"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <Card className="overflow-hidden p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {QUESTION_TYPE_LABELS[currentQuestion.type]}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {showHint ? "Sembunyikan Petunjuk" : "Butuh Petunjuk?"}
                </button>
              </div>

              <h2 className="mt-4 font-display text-xl leading-snug font-bold text-slate-900 sm:text-2xl">
                {currentQuestion.prompt}
              </h2>

              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-medium text-amber-900"
                >
                  Petunjuk: {currentQuestion.hint}
                </motion.div>
              )}

              {currentQuestion.imageUrl && (
                <div className="relative mx-auto mt-5 aspect-[4/3] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                  <Image
                    src={currentQuestion.imageUrl}
                    alt="Foto spesimen pertanyaan kuis"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  let styleClass =
                    "border-slate-200 bg-white text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50";

                  if (answered) {
                    if (opt.isCorrect) {
                      styleClass = "border-emerald-600 bg-emerald-600 text-white shadow-sm";
                    } else if (isSelected && !opt.isCorrect) {
                      styleClass = "border-rose-500 bg-rose-500 text-white";
                    } else {
                      styleClass = "border-slate-100 bg-slate-50 text-slate-400 opacity-75";
                    }
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      whileTap={!answered ? { scale: 0.98 } : undefined}
                      disabled={answered}
                      onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left font-display text-base font-semibold transition cursor-pointer disabled:cursor-default ${styleClass}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          answered && (opt.isCorrect || isSelected)
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {answered && opt.isCorrect && (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      )}
                      {answered && isSelected && !opt.isCorrect && (
                        <XCircle className="h-5 w-5 shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-2xl border p-5 ${
                      selectedOption?.isCorrect
                        ? "border-emerald-200 bg-emerald-50/70 text-slate-900"
                        : "border-amber-200 bg-amber-50/70 text-slate-900"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-display text-lg font-bold">
                          {selectedOption?.isCorrect
                            ? "Tepat Sekali!"
                            : "Hampir Benar! Penjelasan:"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                      <Button
                        variant={selectedOption?.isCorrect ? "jungle" : "sun"}
                        size="md"
                        onClick={handleNext}
                        className="shrink-0"
                      >
                        {currentIndex + 1 < questions.length
                          ? "Pertanyaan Berikutnya"
                          : "Lihat Skor Akhir"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
