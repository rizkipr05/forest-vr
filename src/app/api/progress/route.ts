import { connection, NextRequest, NextResponse } from "next/server";
import { attachExplorerCookie, getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import {
  getExplorerProgress,
  recordSpeciesDiscovery,
} from "@/services/progress-service";

export async function GET() {
  await connection();
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  const snapshot = await getExplorerProgress(explorerTag);
  const res = NextResponse.json(snapshot);
  return attachExplorerCookie(res, explorerTag, isNew);
}

export async function POST(req: NextRequest) {
  const { explorerTag, isNew } = await getOrCreateExplorerTag();
  let body: { speciesSlug?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 });
  }

  if (!body.speciesSlug || typeof body.speciesSlug !== "string") {
    return NextResponse.json({ error: "speciesSlug wajib diisi" }, { status: 400 });
  }

  const result = await recordSpeciesDiscovery(explorerTag, body.speciesSlug);
  const snapshot = await getExplorerProgress(explorerTag);
  const res = NextResponse.json({ ok: true, ...result, snapshot });
  return attachExplorerCookie(res, explorerTag, isNew);
}
