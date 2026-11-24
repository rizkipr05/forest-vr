import { connection, NextResponse } from "next/server";
import { attachExplorerCookie, getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import { getExplorerProgress } from "@/services/progress-service";
import { listAchievementsCatalog } from "@/services/quiz-service";

export async function GET() {
  await connection();
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  const [catalog, progress] = await Promise.all([
    listAchievementsCatalog(),
    getExplorerProgress(explorerTag),
  ]);

  const items = catalog.items.map((ach) => ({
    ...ach,
    unlocked: progress.unlockedAchievementCodes.includes(ach.code),
  }));

  const res = NextResponse.json({
    items,
    source: catalog.source,
    unlockedCount: items.filter((i) => i.unlocked).length,
    totalCount: items.length,
  });
  return attachExplorerCookie(res, explorerTag, isNew);
}
