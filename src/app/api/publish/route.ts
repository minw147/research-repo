// src/app/api/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapters";
import { getProject, getProjectsDir, updateProject } from "@/lib/projects";
import path from "path";
import fs from "fs";
import { PublishPayload } from "@/adapters/types";
import { PublishRecord } from "@/types";

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
      const existing = project.publishedUrls ?? [];
      const record: PublishRecord = {
        adapterId: adapter.id,
        adapterName: adapter.name,
        url: result.url ?? "",
        publishedAt: new Date().toISOString(),
      };
      // Replace existing record for the same adapter+url, otherwise append
      const idx = existing.findIndex(
        (r) => r.adapterId === adapterId && r.url === record.url
      );
      const publishedUrls =
        idx >= 0
          ? [...existing.slice(0, idx), record, ...existing.slice(idx + 1)]
          : [...existing, record];

      updateProject(slug, {
        status: "published",
        publishedUrl: record.url || project.publishedUrl,
        publishedUrls,
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

export async function DELETE(req: NextRequest) {
  try {
    const { slug, url } = await req.json();
    if (!slug || !url) {
      return NextResponse.json({ success: false, message: "Missing slug or url" }, { status: 400 });
    }

    const project = getProject(slug);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const publishedUrls = (project.publishedUrls ?? []).filter((r) => r.url !== url);
    const publishedUrl =
      publishedUrls.length > 0
        ? publishedUrls[publishedUrls.length - 1].url
        : null;
    const status = publishedUrls.length > 0 ? project.status : "exported";

    updateProject(slug, { publishedUrl, publishedUrls, status });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
