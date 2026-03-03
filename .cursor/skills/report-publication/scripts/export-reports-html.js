/**
 * Generates self-contained HTML files for each report.
 * Writes to public/reports-standalone/ so they're served in dev and copied to out/ on build.
 * Run via prebuild and predev.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { unified } = require("unified");
const remarkParse = require("remark-parse").default || require("remark-parse");
const remarkHtml = require("remark-html").default || require("remark-html");

// Project root (from .cursor/skills/report-publication/scripts/)
const ROOT = path.resolve(__dirname, "../../../..");
const CONTENT_DIR = path.join(ROOT, "content", "reports");
const DATA_DIR = path.join(ROOT, "data");
const TRANSCRIPT_DIR = path.join(ROOT, "data", "transcripts");
const VTT_DIR = path.join(ROOT, "public", "vtt");
const VIDEOS_DIR = path.join(ROOT, "public", "videos");

const CLIP_RE = /<Clip\s+([\s\S]+?)\s*\/>/g;
const CALLOUT_RE = /<Callout\s+variant=["'](\w+)["']\s*title=["']([^"']*)["']\s*>([\s\S]*?)<\/Callout>/g;
const CALLOUT_NOTITLE_RE = /<Callout\s+variant=["'](\w+)["']\s*>([\s\S]*?)<\/Callout>/g;
const DIVIDER_LABEL_RE = /<Divider\s+label=["']([^"']*)["']\s*\/>/g;
const DIVIDER_RE = /<Divider\s*\/>/g;
const TOOLTIP_RE = /<Tooltip\s+content=["']([^"']*)["']\s*>([\s\S]*?)<\/Tooltip>/g;

/** Convert Callout, Divider, Tooltip to markdown/html that remark can process. */
function preprocessCustomComponents(str) {
  let s = str;
  // Tooltip: emit just the inner text (tooltips need JS for hover)
  s = s.replace(TOOLTIP_RE, "$2");
  // Divider with label
  s = s.replace(DIVIDER_LABEL_RE, "\n\n---\n\n*$1*\n\n---\n\n");
  // Divider without label
  s = s.replace(DIVIDER_RE, "\n\n---\n\n");
  // Callout with title
  s = s.replace(CALLOUT_RE, (_, _variant, title, body) => {
    const t = title.replace(/"/g, "&quot;");
    const b = body.trim().replace(/\n/g, "\n> ");
    return `\n\n> **${t}**\n>\n> ${b}\n\n`;
  });
  // Callout without title
  s = s.replace(CALLOUT_NOTITLE_RE, (_, _variant, body) => {
    const b = body.trim().replace(/\n/g, "\n> ");
    return `\n\n> ${b}\n\n`;
  });
  return s;
}

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

function parseTranscriptLines(raw) {
  const lines = [];
  raw.split("\n").forEach((line) => {
    const m = line.match(/\[(\d{1,2}):(\d{2})\]\s*(.*)/);
    if (m) {
      const sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      const text = m[3].trim();
      if (text) lines.push({ sec, text });
    } else if (line.trim() && lines.length > 0) {
      lines[lines.length - 1].text += " " + line.trim();
    }
  });
  return lines;
}

function getTranscriptForRange(lines, startSec, endSec) {
  return lines.filter((l) => l.sec >= startSec && l.sec < endSec).map((l) => l.text).join(" ");
}

function transcriptToVtt(lines) {
  let vtt = "WEBVTT\n\n";
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].sec;
    const end = i + 1 < lines.length ? lines[i + 1].sec : start + 5;
    const h1 = Math.floor(start / 3600);
    const m1 = Math.floor((start % 3600) / 60);
    const s1 = start % 60;
    const h2 = Math.floor(end / 3600);
    const m2 = Math.floor((end % 3600) / 60);
    const s2 = end % 60;
    const ts = (h, m, s) => `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.000`;
    vtt += `${i + 1}\n${ts(h1, m1, s1)} --> ${ts(h2, m2, s2)}\n${lines[i].text.replace(/\n/g, " ")}\n\n`;
  }
  return vtt;
}

/** VTT for a clip segment using transcript timestamps. One cue per line, rebased to 0. */
function transcriptToClipVtt(lines, startSec, endSec) {
  const clipLines = lines.filter((l) => l.sec >= startSec && l.sec < endSec);
  if (clipLines.length === 0) return "";
  const clipDuration = endSec - startSec;
  const ts = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.round((sec % 1) * 1000) % 1000;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };
  let vtt = "WEBVTT\n\n";
  for (let i = 0; i < clipLines.length; i++) {
    const origStart = clipLines[i].sec;
    const origEnd = i + 1 < clipLines.length ? clipLines[i + 1].sec : Math.min(origStart + 10, endSec);
    const rebasedStart = origStart - startSec;
    const rebasedEnd = Math.min(origEnd - startSec, clipDuration);
    if (rebasedEnd <= rebasedStart) continue;
    const text = clipLines[i].text.replace(/\n/g, " ").trim();
    const endTs = ts(Math.max(rebasedStart + 0.001, rebasedEnd));
    vtt += `${i + 1}\n${ts(rebasedStart)} --> ${endTs}\n${text}\n\n`;
  }
  return vtt;
}

function isSlicedClip(src) {
  return src && (/\/clips\//.test(src) || /_\d+_\d+s\.(mp4|webm|mkv)/i.test(src));
}

function isCloudVideoUrl(src) {
  return src && /drive\.google\.com|1drv\.ms|onedrive\.live\.com|sharepoint\.com/i.test(src);
}

function isOneDriveOrSharePoint(src) {
  return src && /1drv\.ms|onedrive\.live\.com|sharepoint\.com/i.test(src);
}

function toCloudEmbedUrl(url) {
  if (/drive\.google\.com/.test(url)) {
    return url.replace(/\/view[^/]*$/, "/preview").replace(/\?.*$/, "");
  }
  if (/1drv\.ms/.test(url)) {
    let u = url.replace(/\/v\//, "/i/").replace(/\/e\//, "/i/");
    if (!/embed=1/.test(u)) u = u + (u.includes("?") ? "&embed=1" : "?embed=1");
    return u;
  }
  if (/onedrive\.live\.com|sharepoint\.com/i.test(url)) {
    return url.includes("embed=1") ? url : url + (url.includes("?") ? "&embed=1" : "?embed=1");
  }
  return url;
}

function clipToHtml(props, transcriptExcerpt, vttPath, pathPrefix = "../", transcriptLines = []) {
  const src = props.src || "";
  const label = (props.label || "").replace(/"/g, "&quot;");
  const participant = props.participant || "";
  const duration = props.duration || "";
  const start = props.start || 0;
  const end = props.end ?? start + 20;
  const clipEnd = Math.min(end, start + 20);
  const mm = Math.floor(start / 60).toString().padStart(2, "0");
  const ss = (start % 60).toString().padStart(2, "0");
  const mm2 = Math.floor(clipEnd / 60).toString().padStart(2, "0");
  const ss2 = (clipEnd % 60).toString().padStart(2, "0");
  const timeLabel = `${mm}:${ss}`;
  const timeRange = `${mm}:${ss} – ${mm2}:${ss2}`;

  const videoPath = src.startsWith("/videos/")
    ? `${pathPrefix}videos/${src.replace(/^\/videos\//, "")}`
    : src.startsWith("/")
      ? `${pathPrefix}${src.slice(1)}`
      : src;
  // Sliced clips start at 0; full-video URLs need #t= to seek
  const srcWithStart = videoPath.includes("#") ? videoPath : isSlicedClip(src) ? videoPath : `${videoPath}#t=${start}`;
  const watchHref = isCloudVideoUrl(src) ? src : `${videoPath}#t=${start}`;

  // For sliced clips, use clip-specific VTT with rebased timestamps (0..duration). Full vttPath uses original video timeline.
  let trackSrc = vttPath;
  if (isSlicedClip(src) && transcriptLines.length > 0) {
    const clipVtt = transcriptToClipVtt(transcriptLines, start, clipEnd);
    if (clipVtt) trackSrc = `data:text/vtt;base64,${Buffer.from(clipVtt, "utf-8").toString("base64")}`;
  }
  const trackEl = trackSrc ? `<track kind="captions" src="${trackSrc}" srclang="en" label="English" default />` : "";
  const transcriptSection = transcriptExcerpt
    ? `<details style="margin-top:0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;overflow:hidden"><summary style="padding:0.5rem 0.75rem;font-size:0.8125rem;font-weight:600;color:#64748b;cursor:pointer;user-select:none">Transcript (${timeRange})</summary><div style="padding:0.75rem 1rem;font-size:0.875rem;line-height:1.5;color:#475569;background:#f8fafc">${transcriptExcerpt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></details>`
    : "";

  let videoEl;
  if (isCloudVideoUrl(src)) {
    if (isOneDriveOrSharePoint(src)) {
      videoEl = `<a href="${watchHref}" target="_blank" rel="noopener noreferrer" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;height:180px;max-width:28rem;border-radius:0.75rem;border:2px dashed #e2e8f0;background:#f8fafc;text-decoration:none;color:#475569;font-size:0.875rem;font-weight:500;transition:all 0.2s"><span style="font-size:2rem">▶</span> Watch clip at ${timeRange}</a>`;
    } else {
      videoEl = `<iframe src="${toCloudEmbedUrl(src)}" title="Video clip" style="height:240px;width:100%;max-width:28rem;border-radius:0.75rem;background:#000" allow="autoplay" allowfullscreen></iframe>`;
    }
  } else {
    videoEl = `<video src="${srcWithStart}" controls preload="metadata" style="height:auto;max-width:28rem;border-radius:0.75rem;background:#000">${trackEl}</video>`;
  }

  const watchTarget = ' target="_blank" rel="noopener noreferrer"';

  return `<div style="margin:1.5rem 0;border-radius:0.75rem;border-left:4px solid #137fec;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden"><div style="display:flex;flex-direction:column;gap:1rem;padding:1.25rem"><div style="position:relative;flex-shrink:0">${videoEl}${start > 0 ? `<span style="position:absolute;bottom:-8px;right:-8px;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,0.8);font-size:10px;font-weight:700;color:#fff">${timeLabel}</span>` : ""}</div><div style="flex:1;min-width:0">${participant ? `<div style="font-size:12px;font-weight:600;letter-spacing:0.05em;color:#64748b;margin-bottom:0.5rem">${participant}${duration ? ` • ${duration}` : ""}</div>` : ""}<blockquote style="margin:0"><p style="font-size:1.125rem;font-weight:500;line-height:1.5;color:#334155">${label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></blockquote><div style="margin-top:0.5rem;font-size:0.75rem;color:#94a3b8"><a href="${watchHref}"${watchTarget} style="color:#137fec;text-decoration:none">Watch clip at ${timeRange}</a></div>${transcriptSection}</div></div></div>`;
}

function getStudyById(id) {
  const filePath = path.join(DATA_DIR, "research-index.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const studies = JSON.parse(raw);
  return studies.find((s) => s.id === id) || null;
}

const REPORT_CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.6;color:#334155;background:#fff}
.container{max-width:48rem;margin:0 auto;padding:2rem 1.5rem}
h1{font-size:2rem;font-weight:700;margin:0 0 1.5rem;color:#0f172a}
h2{font-size:1.25rem;font-weight:600;margin:2rem 0 1rem;color:#0f172a}
p{margin:0 0 1rem;color:#475569}
strong{font-weight:600;color:#1e293b}
ul,ol{margin:0 0 1rem;padding-left:1.5rem}
li{margin-bottom:0.25rem}
hr{border:none;border-top:1px solid #e2e8f0;margin:2rem 0}
blockquote{margin:1.5rem 0;padding:1rem 1.25rem;border-left:4px solid #137fec;background:#eff6ff;border-radius:0 0.5rem 0.5rem 0;color:#1e3a5f}
blockquote p{margin:0.25rem 0}
blockquote strong{color:#0c4a6e}
.meta{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;padding-bottom:2rem;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b}
details summary::-webkit-details-marker{display:none}
`;

async function exportReport(filename, outDir, pathPrefix) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
  const { data: frontmatter, content } = matter(raw);
  const study = frontmatter.studyId ? getStudyById(frontmatter.studyId) : null;
  const date = frontmatter.date ?? study?.date;
  const author = study?.persona;
  const category = study?.product;

  let transcriptLines = [];
  let vttPath = null;
  const slug = filename.replace(/\.mdx?$/, "");
  if (study?.transcriptFile) {
    const transcriptPath = path.join(TRANSCRIPT_DIR, study.transcriptFile);
    if (fs.existsSync(transcriptPath)) {
      transcriptLines = parseTranscriptLines(fs.readFileSync(transcriptPath, "utf-8"));
      if (transcriptLines.length > 0) {
        if (!fs.existsSync(VTT_DIR)) fs.mkdirSync(VTT_DIR, { recursive: true });
        const vttFile = path.join(VTT_DIR, `${slug}.vtt`);
        fs.writeFileSync(vttFile, transcriptToVtt(transcriptLines), "utf-8");
        vttPath = `${pathPrefix}vtt/${slug}.vtt`;
      }
    }
  }

  const processor = unified().use(remarkParse).use(remarkHtml, { sanitize: true });
  const parts = content.split(CLIP_RE);
  const htmlParts = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      let md = parts[i];
      md = preprocessCustomComponents(md);
      if (md.trim()) {
        const mdResult = await processor.process(md);
        htmlParts.push(String(mdResult));
      }
    } else {
      const props = parseClipProps(parts[i]);
      const start = props.start || 0;
      const end = props.end ?? start + 20;
      const excerpt = getTranscriptForRange(transcriptLines, start, end);
      htmlParts.push(clipToHtml(props, excerpt, vttPath, pathPrefix, transcriptLines));
    }
  }
  const html = htmlParts.join("\n\n");

  const title = frontmatter.title || "Report";
  const dateStr = date
    ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<!-- Portable: HTML + videos/ + vtt/ in same folder. Zip and share. Open via http (e.g. npx serve) for video playback. -->
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="container">
<h1>${title}</h1>
<div class="meta">
${author ? `<span>${author}</span>` : ""}
${dateStr ? `<span>${dateStr}</span>` : ""}
${category ? `<span style="background:#eff6ff;color:#137fec;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500">${category}</span>` : ""}
</div>
${html}
</div>
</body>
</html>`;

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${slug}.html`), fullHtml, "utf-8");
  console.log(`  Exported ${slug}.html`);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const portable = process.argv.includes("--portable");
  const outDir = portable ? path.join(ROOT, "public", "reports-portable") : path.join(ROOT, "public", "reports-standalone");
  const pathPrefix = portable ? "" : "../";

  console.log(portable ? "Exporting portable report HTML (videos + vtt in same folder)..." : "Exporting standalone report HTML files...");
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const f of files) {
    await exportReport(f, outDir, pathPrefix);
  }

  if (portable) {
    const destVideos = path.join(outDir, "videos");
    const destVtt = path.join(outDir, "vtt");
    copyDirSync(VIDEOS_DIR, destVideos);
    copyDirSync(VTT_DIR, destVtt);
    fs.writeFileSync(
      path.join(outDir, "README.md"),
      `# Portable Report Export\n\nOpen the HTML files in a browser. **For local video playback**, run a local server (browsers block file:// video):\n\n\`\`\`\nnpx serve .\n\`\`\`\n\nThen open http://localhost:3000/ai-chip-war-gpu-tpu.html\n\nZip this folder and share—recipients get HTML, videos, and captions together.\n`,
      "utf-8"
    );
    console.log("  Copied videos/ and vtt/ into reports-portable/");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
