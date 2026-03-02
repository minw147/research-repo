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
const OUT_DIR = path.join(ROOT, "public", "reports-standalone");
const VTT_DIR = path.join(ROOT, "public", "vtt");

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

function clipToHtml(props, transcriptExcerpt, vttPath) {
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
    ? `../videos/${src.replace(/^\/videos\//, "")}`
    : src.startsWith("/")
      ? `../${src.slice(1)}`
      : src;
  const srcWithStart = videoPath.includes("#") ? videoPath : `${videoPath}#t=${start}`;

  const trackEl = vttPath ? `<track kind="captions" src="${vttPath}" srclang="en" label="English" default />` : "";
  const transcriptSection = transcriptExcerpt
    ? `<details style="margin-top:0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;overflow:hidden"><summary style="padding:0.5rem 0.75rem;font-size:0.8125rem;font-weight:600;color:#64748b;cursor:pointer;user-select:none">Transcript (${timeRange})</summary><div style="padding:0.75rem 1rem;font-size:0.875rem;line-height:1.5;color:#475569;background:#f8fafc">${transcriptExcerpt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></details>`
    : "";

  return `<div style="margin:1.5rem 0;border-radius:0.75rem;border-left:4px solid #137fec;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden"><div style="display:flex;flex-direction:column;gap:1rem;padding:1.25rem"><div style="position:relative;flex-shrink:0"><video src="${srcWithStart}" controls preload="metadata" style="height:auto;max-width:28rem;border-radius:0.75rem;background:#000">${trackEl}</video>${start > 0 ? `<span style="position:absolute;bottom:-8px;right:-8px;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,0.8);font-size:10px;font-weight:700;color:#fff">${timeLabel}</span>` : ""}</div><div style="flex:1;min-width:0">${participant ? `<div style="font-size:12px;font-weight:600;letter-spacing:0.05em;color:#64748b;margin-bottom:0.5rem">${participant}${duration ? ` • ${duration}` : ""}</div>` : ""}<blockquote style="margin:0"><p style="font-size:1.125rem;font-weight:500;line-height:1.5;color:#334155">"${label}"</p></blockquote><div style="margin-top:0.5rem;font-size:0.75rem;color:#94a3b8"><a href="${videoPath}#t=${start}" style="color:#137fec;text-decoration:none">Watch clip at ${timeRange}</a></div>${transcriptSection}</div></div></div>`;
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
.meta{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;padding-bottom:2rem;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b}
details summary::-webkit-details-marker{display:none}
`;

async function exportReport(filename) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
  const { data: frontmatter, content } = matter(raw);
  const study = frontmatter.studyId ? getStudyById(frontmatter.studyId) : null;
  const date = frontmatter.date ?? study?.date;
  const author = study?.persona;
  const category = study?.product;

  let transcriptLines = [];
  let vttPath = null;
  if (study?.transcriptFile) {
    const transcriptPath = path.join(TRANSCRIPT_DIR, study.transcriptFile);
    if (fs.existsSync(transcriptPath)) {
      transcriptLines = parseTranscriptLines(fs.readFileSync(transcriptPath, "utf-8"));
      if (transcriptLines.length > 0) {
        if (!fs.existsSync(VTT_DIR)) fs.mkdirSync(VTT_DIR, { recursive: true });
        const slug = filename.replace(/\.mdx?$/, "");
        const vttFile = path.join(VTT_DIR, `${slug}.vtt`);
        fs.writeFileSync(vttFile, transcriptToVtt(transcriptLines), "utf-8");
        vttPath = `../vtt/${slug}.vtt`;
      }
    }
  }

  const processor = unified().use(remarkParse).use(remarkHtml, { sanitize: true });
  const parts = content.split(CLIP_RE);
  const htmlParts = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const md = parts[i];
      if (md.trim()) {
        const mdResult = await processor.process(md);
        htmlParts.push(String(mdResult));
      }
    } else {
      const props = parseClipProps(parts[i]);
      const start = props.start || 0;
      const end = props.end ?? start + 20;
      const excerpt = getTranscriptForRange(transcriptLines, start, end);
      htmlParts.push(clipToHtml(props, excerpt, vttPath));
    }
  }
  const html = htmlParts.join("\n\n");

  const title = frontmatter.title || "Report";
  const slug = filename.replace(/\.mdx?$/, "");
  const dateStr = date
    ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<!-- For video playback: place this file in your project root (next to the videos folder) -->
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

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), fullHtml, "utf-8");
  console.log(`  Exported ${slug}.html`);
}

async function main() {
  console.log("Exporting standalone report HTML files...");
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const f of files) {
    await exportReport(f);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
