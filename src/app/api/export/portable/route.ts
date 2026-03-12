import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getFfmpegPath } from "@/lib/ffmpeg-path";
import { getProject, sanitizeSlug, updateProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

/**
 * Parses video elements from findings.html and extracts clip metadata.
 * Video src format: /api/projects/{slug}/files/videos/{videoFile}#t={start},{end}
 */
interface VideoClip {
  videoFile: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  sessionIndex: number;
  clipFilename: string;
  originalSrc: string;
}

function parseVideoClipsFromHtml(html: string, projectSlug: string, sessions: { videoFile: string }[]): VideoClip[] {
  const clips: VideoClip[] = [];
  // Match src="/api/projects/slug/files/videos/videoFile#t=start,end" or src='/...'
  const videoRegex = /<video[^>]+src=["'](\/api\/projects\/[^/]+\/files\/videos\/([^"#'?#]+)#t=(\d+),(\d+))["'][^>]*>/gi;
  const seen = new Set<string>();

  let match;
  while ((match = videoRegex.exec(html)) !== null) {
    const fullSrc = match[1];
    const videoFile = match[2];
    const startSeconds = parseInt(match[3], 10);
    const endSeconds = parseInt(match[4], 10);
    const durationSeconds = endSeconds - startSeconds;

    const sessionIndex = sessions.findIndex((s) => s.videoFile === videoFile) + 1;
    if (sessionIndex === 0) continue;

    const clipFilename = `clip-${sessionIndex}-${startSeconds}s.mp4`;
    const key = `${sessionIndex}-${startSeconds}`;
    if (seen.has(key)) continue;
    seen.add(key);

    clips.push({
      videoFile,
      startSeconds,
      endSeconds,
      durationSeconds,
      sessionIndex,
      clipFilename,
      originalSrc: fullSrc,
    });
  }

  return clips;
}

function rewriteHtmlWithRelativePaths(html: string, clips: VideoClip[]): string {
  let result = html;
  for (const clip of clips) {
    const oldSrc = clip.originalSrc;
    const newSrc = `./clips/${clip.clipFilename}`;
    result = result.split(oldSrc).join(newSrc);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug: providedSlug }: { slug: string } = body;

    const slug = sanitizeSlug(providedSlug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
    }

    const project = getProject(slug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectDir = path.resolve(process.cwd(), "content/projects", slug);
    const findingsPath = path.join(projectDir, "findings.html");
    const clipsDir = path.join(projectDir, "clips");
    const exportDir = path.join(projectDir, "export");
    const exportClipsDir = path.join(exportDir, "clips");
    const videosDir = path.join(projectDir, "videos");
    const workspaceRoot = path.resolve(process.cwd());

    if (!fs.existsSync(findingsPath)) {
      return NextResponse.json({ error: "findings.html not found" }, { status: 404 });
    }

    if (!projectDir.startsWith(workspaceRoot) || !clipsDir.startsWith(workspaceRoot)) {
      return NextResponse.json({ error: "Invalid path configuration" }, { status: 400 });
    }

    const ffmpeg = getFfmpegPath();
    if (!ffmpeg) {
      return NextResponse.json({ error: "FFmpeg not found" }, { status: 500 });
    }

    const html = fs.readFileSync(findingsPath, "utf-8");
    const clips = parseVideoClipsFromHtml(html, slug, project.sessions || []);

    if (clips.length === 0) {
      return NextResponse.json({ error: "No video clips found in findings.html" }, { status: 400 });
    }

    fs.mkdirSync(clipsDir, { recursive: true });
    fs.mkdirSync(exportClipsDir, { recursive: true });

    const encoder = new TextEncoder();
    const total = clips.length;

    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          for (let i = 0; i < total; i++) {
            const clip = clips[i];
            const session = project.sessions?.[clip.sessionIndex - 1];

            if (!session) {
              sendProgress({
                current: i + 1,
                total,
                error: `Session ${clip.sessionIndex} not found`,
                message: `Error: Session ${clip.sessionIndex} not found`,
              });
              continue;
            }

            const videoPath = path.resolve(videosDir, clip.videoFile);
            const outputPath = path.resolve(clipsDir, clip.clipFilename);

            if (!videoPath.startsWith(videosDir) || !outputPath.startsWith(clipsDir)) {
              sendProgress({
                current: i + 1,
                total,
                error: `Invalid path for clip ${i + 1}`,
                message: `Error: Invalid path`,
              });
              continue;
            }

            if (!fs.existsSync(videoPath)) {
              sendProgress({
                current: i + 1,
                total,
                error: `Video file not found: ${clip.videoFile}`,
                message: `Error: Video file not found`,
              });
              continue;
            }

            sendProgress({
              current: i + 1,
              total,
              message: `Slicing clip ${i + 1} of ${total}...`,
            });

            await new Promise<void>((resolve, reject) => {
              const args = [
                "-y",
                "-ss",
                clip.startSeconds.toString(),
                "-t",
                clip.durationSeconds.toString(),
                "-i",
                videoPath,
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-strict",
                "experimental",
                outputPath,
              ];

              const proc = spawn(ffmpeg, args);

              proc.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
              });

              proc.on("error", (err) => reject(err));
            }).catch((error: Error) => {
              sendProgress({
                current: i + 1,
                total,
                error: error.message,
                message: `Error slicing clip ${i + 1}`,
              });
            });

            const exportClipPath = path.join(exportClipsDir, clip.clipFilename);
            if (fs.existsSync(outputPath)) {
              fs.copyFileSync(outputPath, exportClipPath);
            }
          }

          sendProgress({
            current: total,
            total,
            message: "Writing export HTML...",
          });

          const rewrittenHtml = rewriteHtmlWithRelativePaths(html, clips);
          fs.writeFileSync(path.join(exportDir, "index.html"), rewrittenHtml);

          updateProject(slug, { status: "exported" });

          sendProgress({
            current: total,
            total,
            done: true,
            message: "Export complete!",
          });
          controller.close();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          sendProgress({ error: msg, message: "Critical error in export" });
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Portable export API error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
