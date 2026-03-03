#!/usr/bin/env node
/**
 * Update Clip src URLs in an MDX report from a clip-urls JSON file.
 * Use after copying clips to Google Drive and filling in share links.
 *
 * Usage:
 *   node .cursor/skills/report-publication/scripts/update-clip-urls.js data/clip-urls-ai-chip-war.json content/reports/ai-chip-war-gpu-tpu.mdx
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../../..");

const clipOrder = [
  "ai-chip-war-gpu-tpu_01_70s.mp4",
  "ai-chip-war-gpu-tpu_02_45s.mp4",
  "ai-chip-war-gpu-tpu_03_128s.mp4",
  "ai-chip-war-gpu-tpu_04_208s.mp4",
  "ai-chip-war-gpu-tpu_05_250s.mp4",
  "ai-chip-war-gpu-tpu_06_275s.mp4",
  "ai-chip-war-gpu-tpu_07_123s.mp4",
];

function main() {
  const jsonPath = path.join(ROOT, process.argv[2] || "data/clip-urls-ai-chip-war.json");
  const mdxPath = path.join(ROOT, process.argv[3] || "content/reports/ai-chip-war-gpu-tpu.mdx");

  if (!fs.existsSync(jsonPath)) {
    console.error("JSON not found:", jsonPath);
    process.exit(1);
  }
  if (!fs.existsSync(mdxPath)) {
    console.error("MDX not found:", mdxPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const urls = clipOrder.map((f) => data.clips?.[f]?.trim()).filter(Boolean);

  if (urls.length === 0) {
    console.error("No clip URLs found in", jsonPath, "- fill in the share links first");
    process.exit(1);
  }

  let mdx = fs.readFileSync(mdxPath, "utf8");
  let clipIndex = 0;
  mdx = mdx.replace(
    /(<Clip[^>]*\ssrc=)(["'])([^"']+)\2/g,
    (_, prefix, quote, oldSrc) => {
      const url = urls[clipIndex];
      clipIndex++;
      if (url) {
        return prefix + quote + url + quote;
      }
      return prefix + quote + oldSrc + quote;
    }
  );

  fs.writeFileSync(mdxPath, mdx, "utf8");
  console.log(`Updated ${clipIndex} clips in ${path.basename(mdxPath)}`);
}

main();
