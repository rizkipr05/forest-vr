import { connection, NextResponse } from "next/server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  await connection();
  const configured = isDatabaseConfigured();
  let connected = false;

  if (configured) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        connected = true;
      } catch {
        connected = false;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    databaseConfigured: configured,
    databaseConnected: connected,
    mode: connected ? "neon-postgresql" : "seed-fallback",
  });
}
