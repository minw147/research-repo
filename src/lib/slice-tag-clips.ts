import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getFfmpegPath } from "./ffmpeg-path";
import { parseQuotesFromMarkdown } from "./quote-parser";
import type { Project } from "@/types";

export interface ClipSliceResult {
  clipFile: string;
  status: "sliced" | "skipped" | "error";
  error?: string;
}

/**
 * Ensures all clips referenced in tags.md exist in {projectDir}/clips/.
 * Slices any that are missing using FFmpeg.
 * Already-existing clips are skipped.
 * Never throws — returns error statuses for missing videos/FFmpeg.
 */
export async function sliceTagClips(
  projectDir: string,
  project: Project
): Promise<ClipSliceResult[]> {
  const tagsPath = path.join(projectDir, "tags.md");
  if (!fs.existsSync(tagsPath)) return [];

  const ffmpeg = getFfmpegPath();
  if (!ffmpeg) {
    console.warn("[sliceTagClips] FFmpeg not found — skipping clip slicing");
    return [];
  }

  let quotes;
  try {
    const markdown = fs.readFileSync(tagsPath, "utf-8");
    quotes = parseQuotesFromMarkdown(markdown).filter((q) => !q.hidden);
  } catch (err) {
    console.error("[sliceTagClips] Failed to parse tags.md:", err);
    return [];
  }

  const clipsDir = path.join(projectDir, "clips");
  const videosDir = path.join(projectDir, "videos");
  fs.mkdirSync(clipsDir, { recursive: true });

  const results: ClipSliceResult[] = [];

  for (const quote of quotes) {
    const sessionIndex = Number(quote.sessionIndex);
    const clipFile = `clip-${sessionIndex}-${quote.startSeconds}s.mp4`;
    const outputPath = path.join(clipsDir, clipFile);

    if (fs.existsSync(outputPath)) {
      results.push({ clipFile, status: "skipped" });
      continue;
    }

    const session = (project.sessions ?? [])[sessionIndex - 1];
    if (!session) {
      results.push({ clipFile, status: "error", error: `Session ${sessionIndex} not found` });
      continue;
    }

    const videoPath = path.join(videosDir, session.videoFile);
    if (!fs.existsSync(videoPath)) {
      results.push({ clipFile, status: "error", error: `Video file not found: ${session.videoFile}` });
      continue;
    }

    const start = Number(quote.startSeconds);
    const duration = Number(quote.durationSeconds) || 20;

    await new Promise<void>((resolve) => {
      const proc = spawn(ffmpeg, [
        "-y",
        "-ss", start.toString(),
        "-t", duration.toString(),
        "-i", videoPath,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        outputPath,
      ]);

      proc.on("close", (code) => {
        if (code === 0) {
          results.push({ clipFile, status: "sliced" });
        } else {
          results.push({ clipFile, status: "error", error: `FFmpeg exited with code ${code}` });
        }
        resolve();
      });

      proc.on("error", (err) => {
        results.push({ clipFile, status: "error", error: err.message });
        resolve();
      });
    });
  }

  return results;
}
