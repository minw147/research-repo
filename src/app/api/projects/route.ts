// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/projects";

export async function GET() {
  const projects = listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = createProject(body);
  return NextResponse.json(project);
}
