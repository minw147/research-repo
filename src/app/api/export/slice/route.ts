import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getFfmpegPath } from "@/lib/ffmpeg-path";
import { getProject, sanitizeSlug } from "@/lib/projects";
import type { ParsedQuote } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Task 6.1: Build the Slice API
 * Extracts video segments from transcripts/findings/reports.
 * Returns an SSE stream for progress tracking.
 * 
 * FIXES:
 * 1. Security: Replaced exec with spawn to prevent shell injection.
 * 2. Security: Sanitized slug and validated paths.
 * 3. Type Safety: Used ParsedQuote interface.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug: providedSlug, quotes: providedQuotes }: { slug: string; quotes: ParsedQuote[] } = body;

    // 1. Sanitize Slug: allow only alphanumeric and hyphens
    const slug = sanitizeSlug(providedSlug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
    }

    const project = getProject(slug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectDir = path.resolve(process.cwd(), "content/projects", slug);
    const clipsDir = path.resolve(projectDir, "clips");
    const videosDir = path.resolve(projectDir, "videos");

    // Ensure paths are within the workspace
    const workspaceRoot = path.resolve(process.cwd());
    if (!projectDir.startsWith(workspaceRoot) || !clipsDir.startsWith(workspaceRoot) || !videosDir.startsWith(workspaceRoot)) {
      return NextResponse.json({ error: "Invalid path configuration" }, { status: 400 });
    }

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    const quotesToSlice = providedQuotes || [];
    if (quotesToSlice.length === 0) {
      return NextResponse.json({ error: "No quotes to slice" }, { status: 400 });
    }

    const ffmpeg = getFfmpegPath();
    if (!ffmpeg) {
      return NextResponse.json({ error: "FFmpeg not found" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const total = quotesToSlice.length;

    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          for (let i = 0; i < total; i++) {
            const quote = quotesToSlice[i];
            const sessionIndex = Number(quote.sessionIndex);
            const session = project.sessions[sessionIndex - 1];
            
            if (!session) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Session ${sessionIndex} not found`,
                message: `Error: Session ${sessionIndex} not found` 
              });
              continue;
            }

            // Path Sanitization: Ensure videoFile is within videosDir
            const videoFile = session.videoFile;
            const videoPath = path.resolve(videosDir, videoFile);

            if (!videoPath.startsWith(videosDir)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Invalid video path: ${videoFile}`,
                message: `Error: Invalid video path` 
              });
              continue;
            }

            if (!fs.existsSync(videoPath)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Video file not found: ${videoFile}`,
                message: `Error: Video file not found` 
              });
              continue;
            }

            const start = Number(quote.startSeconds);
            const duration = Number(quote.durationSeconds) || 20;
            
            if (isNaN(start) || isNaN(duration)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Invalid timestamp or duration for quote ${i + 1}`,
                message: `Error: Invalid quote data` 
              });
              continue;
            }

            const filename = `clip-${sessionIndex}-${start}s.mp4`;
            const outputPath = path.resolve(clipsDir, filename);

            if (!outputPath.startsWith(clipsDir)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Invalid output path for clip ${i + 1}`,
                message: `Error: Invalid output path` 
              });
              continue;
            }

            sendProgress({ 
              current: i + 1, 
              total, 
              message: `Slicing clip ${i + 1} of ${total}...` 
            });

            // Slicing command using spawn to prevent shell injection
            await new Promise<void>((resolve, reject) => {
              const args = [
                "-y",
                "-ss", start.toString(),
                "-t", duration.toString(),
                "-i", videoPath,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-strict", "experimental",
                outputPath
              ];

              const proc = spawn(ffmpeg, args);

              proc.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
              });

              proc.on("error", (err) => {
                reject(err);
              });
            }).catch((error: any) => {
              console.error(`ffmpeg error for clip at ${start}s:`, error);
              sendProgress({ 
                current: i + 1, 
                total, 
                error: error.message,
                message: `Error slicing clip ${i + 1}` 
              });
            });
          }

          sendProgress({ 
            current: total, 
            total, 
            done: true, 
            message: "Slicing complete!" 
          });
          controller.close();
        } catch (error: any) {
          sendProgress({ error: error.message, message: "Critical error in slice stream" });
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Slice API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
