// src/app/api/projects/[slug]/route.ts
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getProject, getProjectsDir, sanitizeSlug } from "@/lib/projects";
import type { Codebook } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = sanitizeSlug(params.slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
  }

  const project = getProject(slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Load project-level codebook from codebook.json if it exists
  const codebookPath = path.join(getProjectsDir(), slug, "codebook.json");
  let codebookData: Codebook | undefined;
  if (fs.existsSync(codebookPath)) {
    try {
      const raw = fs.readFileSync(codebookPath, "utf-8");
      const parsed = JSON.parse(raw) as Codebook;
      if (parsed?.tags && Array.isArray(parsed.tags) && parsed?.categories && Array.isArray(parsed.categories)) {
        codebookData = parsed;
      }
    } catch {
      // ignore parse errors — treat as no codebook
    }
  }

  return NextResponse.json({ ...project, codebookData: codebookData ?? null });
}
