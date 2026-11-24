import { connection, NextResponse } from "next/server";
import { listPlants } from "@/services/catalog-service";

export async function GET() {
  await connection();
  const data = await listPlants();
  return NextResponse.json(data);
}
