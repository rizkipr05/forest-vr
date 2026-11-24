import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const EXPLORER_COOKIE_NAME = "amazon_explorer_id";

export async function getOrCreateExplorerTag(): Promise<{
  explorerTag: string;
  isNew: boolean;
}> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(EXPLORER_COOKIE_NAME)?.value;
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
    return { explorerTag: existing, isNew: false };
  }
  return { explorerTag: `exp-${crypto.randomUUID()}`, isNew: true };
}

export function attachExplorerCookie(
  res: NextResponse,
  explorerTag: string,
  isNew: boolean
): NextResponse {
  if (isNew) {
    res.cookies.set(EXPLORER_COOKIE_NAME, explorerTag, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
