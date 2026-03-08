import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getProject } from "@/lib/projects";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

/**
 * Task 6.1 Fix: Build the HTML Export API with robust parsing
 * Generates a self-contained, portable HTML report from MDX findings.
 * 
 * FIXES:
 * 1. Portability: Copies clips into the export folder.
 * 2. Portability: Updates HTML to use relative paths.
 * 3. Security: Sanitized slug and validated paths.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, reportMdx } = body;

    if (!slug || !reportMdx) {
      return NextResponse.json({ error: "slug and reportMdx required" }, { status: 400 });
    }

    // 1. Sanitize Slug: allow only alphanumeric and hyphens
    const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-]/g, "");
    if (sanitizedSlug !== slug) {
      return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
    }

    const project = getProject(sanitizedSlug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectDir = path.resolve(process.cwd(), "content/projects", sanitizedSlug);
    const exportDir = path.resolve(projectDir, "export");
    const exportClipsDir = path.resolve(exportDir, "clips");
    const projectClipsDir = path.resolve(projectDir, "clips");

    // Ensure paths are within the workspace
    const workspaceRoot = path.resolve(process.cwd());
    if (!projectDir.startsWith(workspaceRoot) || !exportDir.startsWith(workspaceRoot)) {
      return NextResponse.json({ error: "Invalid path configuration" }, { status: 400 });
    }

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    if (!fs.existsSync(exportClipsDir)) {
      fs.mkdirSync(exportClipsDir, { recursive: true });
    }

    // Step 2: Copy necessary clips from project clips folder to export clips folder
    // We only copy clips that are referenced in the reportMdx
    const clipFilenames = extractClipFilenames(reportMdx);
    for (const filename of clipFilenames) {
      const srcPath = path.join(projectClipsDir, filename);
      const destPath = path.join(exportClipsDir, filename);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    // Generate self-contained HTML
    const html = await generateReportHtml(project, reportMdx);
    fs.writeFileSync(path.join(exportDir, "index.html"), html);

    // Copy necessary assets (CSS, JS) from repo-viewer if they exist
    const repoViewerDir = path.join(process.cwd(), "repo-viewer");
    if (fs.existsSync(repoViewerDir)) {
      const assets = ["viewer.js", "viewer.css", "index.html"];
      for (const asset of assets) {
        const srcPath = path.join(repoViewerDir, asset);
        const destPath = path.join(exportDir, asset);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      path: `/api/projects/${slug}/files/export/index.html` 
    });
  } catch (error: any) {
    console.error("HTML Export API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractClipFilenames(mdx: string): string[] {
  const filenames: string[] = [];
  
  // From <Clip /> components
  const CLIP_COMPONENT_RE = /<Clip\s+([\s\S]+?)\s*\/>/g;
  let match;
  while ((match = CLIP_COMPONENT_RE.exec(mdx)) !== null) {
    const attrs = match[1];
    const startMatch = attrs.match(/start=(?:"(.*?)"|{(.*?)})/);
    const sessionMatch = attrs.match(/sessionIndex=(?:"(.*?)"|{(.*?)})/);
    
    if (startMatch && sessionMatch) {
      const start = startMatch[1] || startMatch[2];
      const session = sessionMatch[1] || sessionMatch[2];
      filenames.push(`clip-${session}-${start}s.mp4`);
    }
  }

  // From Markdown quotes
  const QUOTE_MD_RE = /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)(.*)/gm;
  while ((match = QUOTE_MD_RE.exec(mdx)) !== null) {
    const startSeconds = match[3];
    const rest = match[4];
    const sessionMatch = rest.match(/session:\s*(\d+)/);
    const sessionIndex = sessionMatch ? sessionMatch[1] : "1";
    filenames.push(`clip-${sessionIndex}-${startSeconds}s.mp4`);
  }

  return [...new Set(filenames)];
}

async function generateReportHtml(project: any, mdx: string): Promise<string> {
  // Pre-process custom components into HTML snippets so they can be passed through the remark/rehype pipeline
  const preprocessed = preprocessCustomComponentsToHtml(mdx);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(preprocessed);

  const content = String(result);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${project.title}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #334155; background: #fff; }
  .container { max-width: 48rem; margin: 0 auto; padding: 2rem 1.5rem; }
  h1 { font-size: 2rem; font-weight: 700; margin: 0 0 1.5rem; color: #0f172a; }
  h2 { font-size: 1.25rem; font-weight: 600; margin: 2rem 0 1rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
  h3 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #1e293b; }
  p { margin: 0 0 1rem; color: #475569; }
  strong { font-weight: 600; color: #1e293b; }
  ul, ol { margin: 0 0 1.5rem; padding-left: 1.5rem; }
  li { margin-bottom: 0.25rem; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
  blockquote { margin: 1.5rem 0; padding: 1rem 1.25rem; border-left: 4px solid #137fec; background: #eff6ff; border-radius: 0 0.5rem 0.5rem 0; color: #1e3a5f; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; padding-bottom: 2rem; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; margin-bottom: 2rem; }
  .clip-card { margin: 1.5rem 0; border-radius: 0.75rem; border-left: 4px solid #137fec; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  .clip-container { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; }
  @media (min-width: 640px) { .clip-container { flex-direction: row; } }
  .clip-video { position: relative; flex-shrink: 0; }
  video { height: auto; width: 100%; max-width: 28rem; border-radius: 0.75rem; background: #000; }
  .timestamp-badge { position: absolute; bottom: 4px; right: 4px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.8); font-size: 10px; font-weight: 700; color: #fff; }
  .clip-content { flex: 1; min-width: 0; }
  .clip-meta { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
  .clip-label { margin: 0; font-size: 1.125rem; font-weight: 500; line-height: 1.5; color: #334155; }
  .clip-link { margin-top: 0.5rem; font-size: 0.75rem; color: #94a3b8; }
  .clip-link a { color: #137fec; text-decoration: none; }
  details { margin-top: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
  summary { padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 600; color: #64748b; cursor: pointer; user-select: none; }
  .transcript { padding: 0.75rem 1rem; font-size: 0.875rem; line-height: 1.5; color: #475569; background: #f8fafc; }
</style>
</head>
<body>
<div class="container">
  <h1>${project.title}</h1>
  <div class="meta">
    <span>Researcher: <strong>${project.researcher}</strong></span>
    <span>Date: <strong>${project.date}</strong></span>
    <span>Persona: <strong>${project.persona}</strong></span>
    ${project.product ? `<span style="background:#eff6ff;color:#137fec;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500">${project.product}</span>` : ""}
  </div>
  ${content}
</div>
</body>
</html>`;
}

function preprocessCustomComponentsToHtml(md: string): string {
  // Replace custom Clip component and Quote format with raw HTML snippets
  // remark-rehype with allowDangerousHtml will pass these through to the final HTML
  
  let processed = md;

  // Detect and replace <Clip /> components
  const CLIP_COMPONENT_RE = /<Clip\s+([\s\S]+?)\s*\/>/g;
  processed = processed.replace(CLIP_COMPONENT_RE, (_, attrs) => {
    const getAttr = (name: string) => {
      const m = attrs.match(new RegExp(`${name}=(?:"(.*?)"|{(.*?)})`));
      return m ? (m[1] || m[2]) : null;
    };
    
    const text = getAttr('label') || getAttr('text') || "Clip";
    const startStr = getAttr('start');
    const startSec = startStr ? parseInt(startStr, 10) : 0;
    const durStr = getAttr('duration') || getAttr('clipDuration');
    const durationSec = durStr ? parseInt(durStr, 10) : 20;
    const sessStr = getAttr('sessionIndex');
    const sessionIndex = sessStr ? parseInt(sessStr, 10) : 1;
    
    const m = Math.floor(startSec / 60).toString().padStart(2, "0");
    const s = (startSec % 60).toString().padStart(2, "0");
    const timestamp = `${m}:${s}`;
    
    return generateClipCardHtml(sessionIndex, startSec, durationSec, text, timestamp);
  });

  // Detect and replace Markdown quotes
  // Format: - **"text"** @ MM:SS (seconds) | duration: 20s | session: X
  const QUOTE_MD_RE = /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)(.*)/gm;
  processed = processed.replace(QUOTE_MD_RE, (_, text, timestamp, startSeconds, rest) => {
    const durationMatch = rest.match(/duration:\s*(\d+)s/);
    const durationSec = durationMatch ? parseInt(durationMatch[1], 10) : 20;
    
    const sessionMatch = rest.match(/session:\s*(\d+)/);
    const sessionIndex = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;
    
    return generateClipCardHtml(sessionIndex, parseInt(startSeconds, 10), durationSec, text, timestamp);
  });

  return processed;
}

function generateClipCardHtml(sessionIndex: number, startSec: number, durationSec: number, text: string, timestamp: string): string {
  const clipFilename = `clip-${sessionIndex}-${startSec}s.mp4`;
  // Relative path for portability
  const clipPath = `./clips/${clipFilename}`;
  const timeRange = `${timestamp} – ${formatTime(startSec + durationSec)}`;
  
  return `
<div class="clip-card">
  <div class="clip-container">
    <div class="clip-video">
      <video src="${clipPath}" controls preload="metadata"></video>
      <span class="timestamp-badge">${timestamp}</span>
    </div>
    <div class="clip-content">
      <div class="clip-meta">Session ${sessionIndex} • ${timestamp}</div>
      <blockquote class="clip-label">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>
      <div class="clip-link">
        <a href="${clipPath}" target="_blank">Watch clip at ${timeRange}</a>
      </div>
    </div>
  </div>
</div>
`;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
