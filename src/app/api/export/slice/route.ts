import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ffmpeg from "ffmpeg-static";
import { exec } from "child_process";
import { promisify } from "util";
import { getProject } from "@/lib/projects";
import type { ParsedQuote } from "@/types";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

/**
 * Task 6.1: Build the Slice API
 * Extracts video segments from transcripts/findings/reports.
 * Returns an SSE stream for progress tracking.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, quotes: providedQuotes } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const project = getProject(slug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectDir = path.join(process.cwd(), "content/projects", slug);
    const clipsDir = path.join(projectDir, "clips");
    const videosDir = path.join(projectDir, "videos");

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    const quotesToSlice = providedQuotes || [];
    if (quotesToSlice.length === 0) {
      return NextResponse.json({ error: "No quotes to slice" }, { status: 400 });
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
            const sessionIndex = quote.sessionIndex;
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

            // Path Sanitization: Ensure videoFile is just a filename or relative to videosDir
            const videoFile = session.videoFile;
            const videoPath = path.join(videosDir, videoFile);
            const resolvedVideoPath = path.resolve(videoPath);
            const resolvedVideosDir = path.resolve(videosDir);

            if (!resolvedVideoPath.startsWith(resolvedVideosDir)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Invalid video path: ${videoFile}`,
                message: `Error: Invalid video path` 
              });
              continue;
            }

            if (!fs.existsSync(resolvedVideoPath)) {
              sendProgress({ 
                current: i + 1, 
                total, 
                error: `Video file not found: ${videoFile}`,
                message: `Error: Video file not found` 
              });
              continue;
            }

            const start = quote.startSeconds;
            const duration = quote.durationSeconds || 20;
            const filename = `clip-${sessionIndex}-${start}s.mp4`;
            const outputPath = path.join(clipsDir, filename);

            sendProgress({ 
              current: i + 1, 
              total, 
              message: `Slicing clip ${i + 1} of ${total}...` 
            });

            // Slicing command
            const command = `"${ffmpeg}" -y -ss ${start} -t ${duration} -i "${resolvedVideoPath}" -c:v libx264 -c:a aac -strict experimental "${outputPath}"`;
            
            try {
              await execAsync(command);
            } catch (error: any) {
              console.error(`ffmpeg error for clip at ${start}s:`, error);
              sendProgress({ 
                current: i + 1, 
                total, 
                error: error.message,
                message: `Error slicing clip ${i + 1}` 
              });
              continue;
            }
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
