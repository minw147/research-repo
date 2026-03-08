import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ffmpeg from "ffmpeg-static";
import { exec } from "child_process";
import { promisify } from "util";
import { getProject } from "@/lib/projects";
import type { ParsedQuote } from "@/types";

const execAsync = promisify(exec);

const CLIP_RE = /<Clip\s+([\s\S]+?)\s*\/>/g;

/**
 * Task 6.1: Build the Slice API
 * Extracts video segments from transcripts/findings/reports.
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
    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    // If quotes aren't provided, try to extract them from report.mdx or findings.md
    let quotesToSlice = providedQuotes || [];
    if (quotesToSlice.length === 0) {
      const reportPath = path.join(projectDir, "report.mdx");
      const findingsPath = path.join(projectDir, "findings.md");
      const contentPath = fs.existsSync(reportPath) ? reportPath : findingsPath;
      
      if (fs.existsSync(contentPath)) {
        const content = fs.readFileSync(contentPath, "utf-8");
        // We'll let the client handle the extraction and pass it in for better control,
        // but this is a fallback.
      }
    }

    if (quotesToSlice.length === 0) {
      return NextResponse.json({ error: "No quotes to slice" }, { status: 400 });
    }

    const results = [];
    const total = quotesToSlice.length;

    for (let i = 0; i < total; i++) {
      const quote = quotesToSlice[i];
      const sessionIndex = quote.sessionIndex;
      // Session index is 1-based in quotes/tags
      const session = project.sessions[sessionIndex - 1];
      
      if (!session) {
        results.push({ quote, error: `Session ${sessionIndex} not found` });
        continue;
      }

      const videoPath = path.join(projectDir, "videos", session.videoFile);
      if (!fs.existsSync(videoPath)) {
        results.push({ quote, error: `Video file not found: ${session.videoFile}` });
        continue;
      }

      const start = quote.startSeconds;
      const duration = quote.durationSeconds || 20;
      const filename = `clip-${sessionIndex}-${start}s.mp4`;
      const outputPath = path.join(clipsDir, filename);

      // Slicing command: fast and precise enough for most use cases
      // Using -c:v libx264 -c:a aac for widest compatibility in the exported HTML
      const command = `"${ffmpeg}" -y -ss ${start} -t ${duration} -i "${videoPath}" -c:v libx264 -c:a aac -strict experimental "${outputPath}"`;
      
      try {
        await execAsync(command);
        results.push({ quote, success: true, filename });
      } catch (error: any) {
        console.error(`ffmpeg error for clip at ${start}s:`, error);
        results.push({ quote, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({ 
      success: true, 
      results,
      summary: `Successfully sliced ${successCount} of ${total} clips.`
    });
  } catch (error: any) {
    console.error("Slice API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
