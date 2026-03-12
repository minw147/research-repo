import { NextRequest, NextResponse } from "next/server";
import { runClaudePrompt } from "@/lib/ai-bridge";
import { sanitizeSlug } from "@/lib/projects";
import path from "path";

const PROJECTS_BASE_DIR = path.join(process.cwd(), "content/projects");

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectSlug } = await req.json();

    if (!prompt || !projectSlug) {
      return NextResponse.json(
        { error: "Both 'prompt' and 'projectSlug' are required fields." },
        { status: 400 }
      );
    }

    const slug = sanitizeSlug(projectSlug);
    if (!slug) {
      return NextResponse.json(
        { error: "Invalid projectSlug provided." },
        { status: 400 }
      );
    }

    const workingDir = path.join(PROJECTS_BASE_DIR, slug);
    
    // Extra security: ensure the resolved path is inside PROJECTS_BASE_DIR
    const resolvedPath = path.resolve(workingDir);
    if (!resolvedPath.startsWith(path.resolve(PROJECTS_BASE_DIR))) {
        return NextResponse.json(
            { error: "Access denied: Path is outside project directory." },
            { status: 403 }
        );
    }

    const output = await runClaudePrompt(prompt, resolvedPath);
    return NextResponse.json({ output });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
