#!/usr/bin/env node
/**
 * Slice video clips from full videos using FFmpeg.
 * Parses content/reports/*.mdx for <Clip> components and extracts clips.
 *
 * Output: public/videos/clips/ (e.g. ai-chip-war-gpu-tpu_01.mp4)
 *
 * Usage:
 *   npm run slice-clips
 *   npm run slice-clips -- --report ai-chip-war-gpu-tpu
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

// Project root (from .cursor/skills/report-publication/scripts/)
const ROOT = path.resolve(__dirname, "../../../..");
const CONTENT_DIR = path.join(ROOT, "content", "reports");
const VIDEOS_DIR = path.join(ROOT, "public", "videos");
const CLIPS_DIR = path.join(ROOT, "public", "videos", "clips");
const DEFAULT_CLIP_DURATION = 20;

// Extract Clip props from MDX (simple regex; handles our format)
function extractClipsFromMdx(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const clips = [];
  const clipRegex =
    /<Clip\s+([^>]+)>/g;
  let m;
  while ((m = clipRegex.exec(content)) !== null) {
    const props = m[1];
    const src = /src=["']([^"']+)["']/.exec(props)?.[1];
    const start = /start=\{(\d+)\}/.exec(props)?.[1];
    const clipDuration = /clipDuration=\{(\d+)\}/.exec(props)?.[1];
    if (src && start) {
      clips.push({
        src: decodeURIComponent(src),
        start: parseInt(start, 10),
        duration: clipDuration ? parseInt(clipDuration, 10) : DEFAULT_CLIP_DURATION,
      });
    }
  }
  return clips;
}

function resolveVideoPath(src) {
  const rel = src.replace(/^\//, "");
  return path.join(ROOT, "public", rel);
}

function runFfmpeg(inputPath, startSec, durationSec, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-ss",
      String(startSec),
      "-i",
      inputPath,
      "-t",
      String(durationSec),
      "-c",
      "copy",
      outputPath,
    ];
    const proc = spawn(ffmpegPath, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    proc.on("error", (err) => reject(err));
  });
}

async function main() {
  const reportIdx = process.argv.indexOf("--report");
  const reportFilter = reportIdx >= 0 ? process.argv[reportIdx + 1] : null;

  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error("Videos dir missing:", VIDEOS_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(CLIPS_DIR)) {
    fs.mkdirSync(CLIPS_DIR, { recursive: true });
  }

  const mdxFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  let total = 0;
  let ok = 0;

  for (const file of mdxFiles) {
    const slug = path.basename(file, ".mdx");
    if (reportFilter && slug !== reportFilter) continue;

    const filePath = path.join(CONTENT_DIR, file);
    const clips = extractClipsFromMdx(filePath);
    if (clips.length === 0) continue;

    console.log(`\nReport: ${slug} (${clips.length} clips)`);

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const inputPath = resolveVideoPath(c.src);
      const idx = String(i + 1).padStart(2, "0");
      const outName = `${slug}_${idx}_${c.start}s.mp4`;
      const outputPath = path.join(CLIPS_DIR, outName);

      if (!fs.existsSync(inputPath)) {
        console.warn(`  Skip clip ${i + 1}: input not found: ${inputPath}`);
        continue;
      }

      total++;
      try {
        await runFfmpeg(inputPath, c.start, c.duration, outputPath);
        console.log(`  ✓ ${outName} (${c.start}s, ${c.duration}s)`);
        ok++;
      } catch (e) {
        console.error(`  ✗ ${outName}: ${e.message}`);
      }
    }
  }

  console.log(`\nDone. ${ok}/${total} clips written to ${CLIPS_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
