#!/usr/bin/env node
/**
 * Export research reports to PowerPoint (.pptx) with embedded video clips.
 * Uses PptxGenJS. Videos must be local (public/videos/clips/ or public/videos/).
 * For cloud-hosted clips (Drive/OneDrive), tries clip-urls mapping to local filename; falls back to link-only slide.
 *
 * Output: public/reports-pptx/[slug].pptx
 *
 * Usage:
 *   npm run export-pptx
 *   npm run export-pptx -- --report ai-chip-war-gpu-tpu
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const PptxGenJS = require("pptxgenjs");

// Project root (from .cursor/skills/report-publication/scripts/)
const ROOT = path.resolve(__dirname, "../../../..");
const CONTENT_DIR = path.join(ROOT, "content", "reports");
const DATA_DIR = path.join(ROOT, "data");
const VIDEOS_DIR = path.join(ROOT, "public", "videos");
const CLIPS_DIR = path.join(ROOT, "public", "videos", "clips");

const CLIP_RE = /<Clip\s+([\s\S]+?)\s*\/>/g;

function parseClipProps(str) {
  const props = {};
  const srcMatch = str.match(/src=["']([^"']+)["']/);
  const labelMatch = str.match(/label="([^"]*)"/);
  const participantMatch = str.match(/participant=["']([^"']+)["']/);
  const durationMatch = str.match(/duration=["']([^"']+)["']/);
  const startMatch = str.match(/start=\{\s*(\d+)\s*\}/);
  if (srcMatch) props.src = srcMatch[1];
  if (labelMatch) props.label = labelMatch[1];
  if (participantMatch) props.participant = participantMatch[1];
  if (durationMatch) props.duration = durationMatch[1];
  if (startMatch) props.start = parseInt(startMatch[1], 10);
  return props;
}

function isCloudVideoUrl(src) {
  return src && /drive\.google\.com|1drv\.ms|onedrive\.live\.com|sharepoint\.com/i.test(src);
}

/**
 * Resolve clip src to absolute local file path.
 * PREFERS sliced clips (slice-clips output: {slug}_{idx}_{start}s.mp4) over full video.
 * Returns null if not local or not found.
 */
function resolveLocalVideoPath(src, clipUrls, slug, clipIndex, startSec) {
  if (!src) return null;
  const decoded = decodeURIComponent(src);

  // 1. Prefer sliced clip by slice-clips naming: {slug}_01_{start}s.mp4
  if (slug != null && clipIndex != null && startSec != null) {
    const idx = String(clipIndex + 1).padStart(2, "0");
    const clipName = `${slug}_${idx}_${startSec}s.mp4`;
    const slicedPath = path.join(CLIPS_DIR, clipName);
    if (fs.existsSync(slicedPath)) return slicedPath;
  }

  // 2. Local path: /videos/clips/... (explicit clip reference only — never use full video)
  if (decoded.startsWith("/videos/")) {
    const rel = decoded.replace(/^\/videos\//, "").replace(/#.*$/, "");
    const clipFilename = rel.startsWith("clips/") ? rel.slice(6) : rel;
    const clipPath = path.join(CLIPS_DIR, clipFilename);
    if (fs.existsSync(clipPath)) return clipPath;
    return null;
  }

  // 3. Cloud URL: look up clip-urls for local filename
  if (isCloudVideoUrl(decoded) && clipUrls) {
    const srcNorm = decoded.split("?")[0];
    for (const [filename, url] of Object.entries(clipUrls.clips || {})) {
      if (url) {
        const urlNorm = url.split("?")[0];
        if (srcNorm === urlNorm || srcNorm.endsWith(urlNorm) || urlNorm.endsWith(srcNorm)) {
          const localPath = path.join(CLIPS_DIR, filename);
          if (fs.existsSync(localPath)) return localPath;
        }
      }
    }
  }
  return null;
}

/** Convert markdown block to PptxGenJS text items. */
function mdToTextItems(md) {
  const items = [];
  md.split("\n").forEach((line, i) => {
    let t = line.trim();
    if (!t) return;
    t = t.replace(/^#+\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
    const bulletMatch = t.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      items.push({ text: bulletMatch[1], options: { bullet: true, breakLine: true } });
    } else {
      items.push({ text: t, options: { breakLine: true } });
    }
  });
  return items;
}

function getStudyById(id) {
  const filePath = path.join(DATA_DIR, "research-index.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const studies = JSON.parse(raw);
  return studies.find((s) => s.id === id) || null;
}

function loadClipUrls(slug) {
  const p = path.join(DATA_DIR, `clip-urls-${slug}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

// Design (pptx + ui-ux-pro-max): Tech/AI content → Deep Purple & Emerald palette
// Content-informed: AI chips, infrastructure, investment → modern, analytical, professional
const DESIGN = {
  // Palette from pptx skill #4 - Deep Purple & Emerald (tech-forward)
  darkBg: "181B24",
  purple: "B165FB",
  emerald: "40695B",
  darkBlue: "1E293B",
  white: "FFFFFF",
  cream: "FCFCFC",
  silver: "94A3B8",
};

async function exportReportToPptx(filename, outDir) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
  const { data: frontmatter, content } = matter(raw);
  const study = frontmatter.studyId ? getStudyById(frontmatter.studyId) : null;
  const date = frontmatter.date ?? study?.date;
  const author = study?.persona;
  const category = study?.product;
  const slug = filename.replace(/\.mdx?$/, "");
  const clipUrls = loadClipUrls(slug);

  const dateStr = date
    ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const pptx = new PptxGenJS();
  pptx.author = author || "Research";
  pptx.title = frontmatter.title || "Report";

  // Title slide — dark background, strong hierarchy (pptx skill: background treatments)
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: DESIGN.darkBg };
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.15,
    fill: { color: DESIGN.emerald },
  });
  titleSlide.addText(frontmatter.title || "Report", {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 1.2,
    fontSize: 32,
    bold: true,
    color: DESIGN.white,
    fontFace: "Arial",
  });
  const metaParts = [author, dateStr, category].filter(Boolean);
  if (metaParts.length) {
    titleSlide.addText(metaParts.join(" • "), {
      x: 0.5,
      y: 2.8,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: DESIGN.silver,
      fontFace: "Arial",
    });
  }

  const parts = content.split(CLIP_RE);
  let clipIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const md = parts[i].trim();
      if (!md) continue;
      const slide = pptx.addSlide();
      slide.background = { color: DESIGN.cream };
      // Left accent bar (pptx skill: underline accents, border treatments)
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.08,
        h: "100%",
        fill: { color: DESIGN.emerald },
      });
      const items = mdToTextItems(md);
      if (items.length === 0) continue;
      const isHeading = md.trimStart().startsWith("#");
      const first = items[0];
      const bodyOpts = { x: 0.6, w: 8.9, fontSize: 12, color: DESIGN.darkBlue, fontFace: "Arial" };
      if (isHeading && first.text) {
        slide.addText(first.text, {
          x: 0.6,
          y: 0.4,
          w: 8.9,
          h: 0.65,
          fontSize: 22,
          bold: true,
          color: DESIGN.darkBlue,
          fontFace: "Arial",
        });
        const rest = items.slice(1);
        if (rest.length) {
          slide.addText(rest, { ...bodyOpts, y: 1.25, h: 5 });
        }
      } else {
        slide.addText(items, { ...bodyOpts, y: 0.5, h: 5.5 });
      }
    } else {
      const props = parseClipProps(parts[i]);
      const label = props.label || "";
      const participant = props.participant || "";
      const duration = props.duration || "";
      const start = props.start || 0;
      const mm = Math.floor(start / 60).toString().padStart(2, "0");
      const ss = (start % 60).toString().padStart(2, "0");
      const timeLabel = `${mm}:${ss}`;

      const slide = pptx.addSlide();
      slide.background = { color: DESIGN.cream };
      // Quote block with left accent (pptx skill: L-shaped borders)
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.06,
        h: "100%",
        fill: { color: DESIGN.purple },
      });
      const localPath = resolveLocalVideoPath(props.src, clipUrls, slug, clipIndex, start);
      clipIndex++;
      const cloudUrl = isCloudVideoUrl(props.src) ? props.src : null;

      if (localPath) {
        slide.addMedia({
          type: "video",
          path: localPath,
          x: 0.5,
          y: 0.5,
          w: 5.8,
          h: 3.25,
        });
        slide.addText(label, {
          x: 0.6,
          y: 4.0,
          w: 8.9,
          h: 1.1,
          fontSize: 14,
          color: DESIGN.darkBlue,
          fontFace: "Georgia",
          valign: "top",
        });
        if (participant || duration) {
          slide.addText([participant, duration].filter(Boolean).join(" • "), {
            x: 0.6,
            y: 5.15,
            w: 8.9,
            h: 0.4,
            fontSize: 11,
            color: DESIGN.emerald,
            fontFace: "Arial",
          });
        }
      } else {
        // No local video: quote + link if cloud
        slide.addText(label, {
          x: 0.6,
          y: 0.5,
          w: 8.9,
          h: cloudUrl ? 4 : 5,
          fontSize: 14,
          color: DESIGN.darkBlue,
          fontFace: "Georgia",
          valign: "top",
        });
        if (participant || duration) {
          slide.addText([participant, duration].filter(Boolean).join(" • "), {
            x: 0.6,
            y: cloudUrl ? 4.7 : 5.2,
            w: 8.9,
            h: 0.4,
            fontSize: 11,
            color: DESIGN.emerald,
            fontFace: "Arial",
          });
        }
        if (cloudUrl) {
          slide.addText(`Watch clip at ${timeLabel}`, {
            x: 0.6,
            y: 5.2,
            w: 8.9,
            h: 0.4,
            fontSize: 10,
            color: DESIGN.purple,
            fontFace: "Arial",
          });
        }
      }
    }
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.pptx`);
  await pptx.writeFile({ fileName: outPath });
  console.log(`  Exported ${slug}.pptx`);
}

async function main() {
  const reportIdx = process.argv.indexOf("--report");
  const reportFilter = reportIdx >= 0 ? process.argv[reportIdx + 1] : null;
  const outDir = path.join(ROOT, "public", "reports-pptx");

  console.log("Exporting report(s) to PowerPoint...");
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const f of files) {
    const slug = f.replace(/\.mdx?$/, "");
    if (reportFilter && slug !== reportFilter) continue;
    await exportReportToPptx(f, outDir);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
