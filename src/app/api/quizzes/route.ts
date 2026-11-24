import { connection, NextResponse } from "next/server";
import { getActiveQuiz } from "@/services/quiz-service";

export async function GET() {
  await connection();
  const data = await getActiveQuiz();
  return NextResponse.json(data);
}
