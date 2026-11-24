import { NextResponse } from "next/server";
import { attachExplorerCookie } from "@/lib/explorer-cookie";
import { getExplorerProgress } from "@/services/progress-service";

export async function POST() {
  const newGuestTag = `exp-${crypto.randomUUID()}`;
  const snapshot = await getExplorerProgress(newGuestTag);
  const res = NextResponse.json({ ok: true, profile: snapshot });
  return attachExplorerCookie(res, newGuestTag, true);
}
