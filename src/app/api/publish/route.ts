// src/app/api/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapters";
import { getProject, getProjectsDir, updateProject } from "@/lib/projects";
import path from "path";
import fs from "fs";
import { PublishPayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, adapterId, config } = body;

    if (!slug || !adapterId) {
      return NextResponse.json(
        { success: false, message: "Missing slug or adapterId" },
        { status: 400 }
      );
    }

    const adapter = getAdapter(adapterId);
    if (!adapter) {
      return NextResponse.json(
        { success: false, message: `Adapter not found: ${adapterId}` },
        { status: 404 }
      );
    }

    const project = getProject(slug);
    if (!project) {
      return NextResponse.json(
        { success: false, message: `Project not found: ${slug}` },
        { status: 404 }
      );
    }

    const projectsDir = getProjectsDir();
    const projectDir = path.join(projectsDir, slug);
    const htmlPath = path.join(projectDir, "export", "index.html");
    const clipsDir = path.join(projectDir, "export", "clips");
    const tagsHtmlPath = path.join(projectDir, "export", "tags.html");

    const payload: PublishPayload = {
      projectDir,
      project,
      htmlPath,
      clipsDir,
      tagsHtmlPath: fs.existsSync(tagsHtmlPath) ? tagsHtmlPath : undefined,
    };

    const result = await adapter.publish(payload, config || {});

    if (result.success) {
      // Update project status and publishedUrl
      updateProject(slug, {
        status: "published",
        publishedUrl: result.url || project.publishedUrl,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Publish API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
