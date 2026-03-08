// src/app/api/projects/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProject, sanitizeSlug } from "@/lib/projects";

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
  return NextResponse.json(project);
}
