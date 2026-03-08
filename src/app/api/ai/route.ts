import { NextRequest, NextResponse } from "next/server";
import { runClaudePrompt } from "@/lib/ai-bridge";
import path from "path";

export async function POST(req: NextRequest) {
  const { prompt, slug } = await req.json();
  const workingDir = path.join(process.cwd(), "content/projects", slug);
  try {
    const result = await runClaudePrompt(prompt, workingDir);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
