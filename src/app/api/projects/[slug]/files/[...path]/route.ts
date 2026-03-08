import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Task 6.1 Fix: Add a route to serve project files for previewing
 * GET /api/projects/[slug]/files/[...path]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; path: string[] } }
) {
  try {
    const { slug, path: filePathParts } = params;
    const filePath = filePathParts.join("/");

    const projectDir = path.join(process.cwd(), "content/projects", slug);
    const absolutePath = path.join(projectDir, filePath);
    const resolvedPath = path.resolve(absolutePath);
    const resolvedProjectDir = path.resolve(projectDir);

    // Path Sanitization
    if (!resolvedPath.startsWith(resolvedProjectDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();

    // Map extensions to content types
    const contentTypeMap: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".vtt": "text/vtt",
      ".md": "text/markdown",
      ".mdx": "text/markdown",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Preview API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
