import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { attachExplorerCookie } from "@/lib/explorer-cookie";
import { normalizeUsername, verifyPassword } from "@/lib/auth";
import { getExplorerProgress } from "@/services/progress-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const username = normalizeUsername(body.username ?? "");
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Masukkan username dan kata sandi." },
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

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { ok: false, error: "Username atau kata sandi tidak cocok." },
        { status: 401 }
      );
    }

    const snapshot = await getExplorerProgress(user.explorerTag);
    const res = NextResponse.json({ ok: true, profile: snapshot });
    return attachExplorerCookie(res, user.explorerTag, true);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal masuk ke akun." },
      { status: 500 }
    );
  }
}
