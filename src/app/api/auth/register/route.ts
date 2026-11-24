import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { attachExplorerCookie } from "@/lib/explorer-cookie";
import {
  EXPLORER_AVATARS,
  hashPassword,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth";
import { getExplorerProgress } from "@/services/progress-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      displayName?: string;
      password?: string;
      avatarSlug?: string;
    };

    const username = normalizeUsername(body.username ?? "");
    const displayName = (body.displayName ?? "").trim();
    const password = body.password ?? "";
    const avatarSlug = EXPLORER_AVATARS.some((a) => a.slug === body.avatarSlug)
      ? (body.avatarSlug as string)
      : "jaguar";

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Username harus 3–24 karakter dan hanya boleh huruf kecil, angka, atau garis bawah (_).",
        },
        { status: 400 }
      );
    }

    if (displayName.length < 2 || displayName.length > 32) {
      return NextResponse.json(
        { ok: false, error: "Nama panggilan harus 2–32 karakter." },
        { status: 400 }
      );
    }

    if (password.length < 4 || password.length > 64) {
      return NextResponse.json(
        { ok: false, error: "Kata sandi minimal 4 karakter." },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Database belum terhubung." },
        { status: 503 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Username sudah dipakai penjelajah lain. Coba nama lain!" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const activeExplorerTag = `exp-${crypto.randomUUID()}`;

    await prisma.user.create({
      data: {
        explorerTag: activeExplorerTag,
        username,
        passwordHash,
        displayName,
        avatarSlug,
        isRegistered: true,
      },
    });

    const snapshot = await getExplorerProgress(activeExplorerTag);
    const res = NextResponse.json({ ok: true, profile: snapshot }, { status: 201 });
    return attachExplorerCookie(res, activeExplorerTag, true);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal membuat akun penjelajah." },
      { status: 500 }
    );
  }
}
