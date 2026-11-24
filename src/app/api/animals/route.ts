import { connection, NextResponse } from "next/server";
import { listAnimals } from "@/services/catalog-service";

export async function GET() {
  await connection();
  const data = await listAnimals();
  return NextResponse.json(data);
}
