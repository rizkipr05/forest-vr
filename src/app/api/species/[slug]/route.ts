import { connection, NextRequest, NextResponse } from "next/server";
import { findSpeciesBySlug } from "@/services/catalog-service";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/species/[slug]">
) {
  await connection();
  const { slug } = await ctx.params;
  const item = await findSpeciesBySlug(slug);
  if (!item) {
    return NextResponse.json(
      { error: "Spesies tidak ditemukan" },
      { status: 404 }
    );
  }
  return NextResponse.json({ item });
}
