import { NextResponse } from "next/server";
import { detectClaudeCli } from "@/lib/ai-bridge";

export async function GET() {
  const available = await detectClaudeCli();
  return NextResponse.json({ available });
}
