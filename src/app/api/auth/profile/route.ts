import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getOrCreateExplorerTag } from "@/lib/explorer-cookie";
import { EXPLORER_AVATARS } from "@/lib/auth";
import { getExplorerProgress } from "@/services/progress-service";

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      displayName?: string;
      avatarSlug?: string;
    };

    const displayName = (body.displayName ?? "").trim();
    if (displayName.length < 2 || displayName.length > 32) {
      return NextResponse.json(
        { ok: false, error: "Nama panggilan harus 2–32 karakter." },
        { status: 400 }
      );
    }

    const avatarSlug = EXPLORER_AVATARS.some((a) => a.slug === body.avatarSlug)
      ? (body.avatarSlug as string)
      : "jaguar";

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Database belum terhubung." },
        { status: 503 }
      );
    }

    const { explorerTag } = await getOrCreateExplorerTag();
    await prisma.user.upsert({
      where: { explorerTag },
      update: { displayName, avatarSlug },
      create: { explorerTag, displayName, avatarSlug },
    });

    const snapshot = await getExplorerProgress(explorerTag);
    return NextResponse.json({ ok: true, profile: snapshot });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
