import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sanitizeSlug } from "@/lib/projects";

/**
 * Task 6.1 Fix: Add a route to serve project files for previewing
 * GET /api/projects/[slug]/files/[...path]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; path: string[] } }
) {
  try {
    const { slug: providedSlug, path: filePathParts } = params;
    
    // 1. Sanitize Slug: allow only alphanumeric and hyphens
    const slug = sanitizeSlug(providedSlug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
    }

    const filePath = filePathParts.join("/");

    const projectDir = path.resolve(process.cwd(), "content/projects", slug);
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
    const isVideo = ext === ".mp4" || ext === ".webm";
    const fileSize = stat.size;

    // Support Range requests for video so the browser can seek
    const rangeHeader = req.headers.get("range");
    if (isVideo && rangeHeader?.startsWith("bytes=")) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] === "" ? 0 : parseInt(match[1], 10);
        const end = match[2] === "" ? fileSize - 1 : parseInt(match[2], 10);
        const chunkSize = end - start + 1;
        const buffer = Buffer.alloc(chunkSize);
        const fd = fs.openSync(resolvedPath, "r");
        fs.readSync(fd, buffer, 0, chunkSize, start);
        fs.closeSync(fd);
        return new Response(buffer, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(chunkSize),
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    };
    if (isVideo) {
      headers["Accept-Ranges"] = "bytes";
      headers["Content-Length"] = String(fileSize);
    }

    return new Response(fileBuffer, {
      headers,
    });
  } catch (error: any) {
    console.error("Preview API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
