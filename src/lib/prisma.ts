import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

/**
 * Returns a shared PrismaClient when DATABASE_URL is configured, or null if running
 * in seed-data fallback mode without a database connection string.
 * Automatically refreshes a stale HMR client if the generated schema changed.
 */
export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;

  const existing = globalForPrisma.prismaClient as
    | (PrismaClient & { user?: { fields?: Record<string, unknown> } })
    | undefined;

  if (existing && (!existing.user?.fields || !("isRegistered" in existing.user.fields))) {
    void existing.$disconnect().catch(() => {});
    globalForPrisma.prismaClient = undefined;
  }

  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prismaClient;
}

export async function isRegisteredExplorer(explorerTag: string): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) return false;
  try {
    const rows = await prisma.$queryRaw<{ isRegistered: boolean }[]>`
      SELECT "isRegistered" FROM "users" WHERE "explorerTag" = ${explorerTag} LIMIT 1
    `;
    return Boolean(rows[0]?.isRegistered);
  } catch {
    return false;
  }
}
