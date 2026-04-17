import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { getProject, getProjectsDir, sanitizeSlug } from "@/lib/projects";

type Root = import("mdast").Root;
type Plugin = import("unified").Plugin;

const remarkCalloutDirectives: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node: any) => {
    if (
      node.type === "containerDirective" ||
      node.type === "leafDirective" ||
      node.type === "textDirective"
    ) {
      const name = String(node.name ?? "").toLowerCase();
      node.data = node.data ?? {};
      node.data.hName = "div";
      node.data.hProperties = {
        "data-callout-type": name,
        className: "callout-directive",
      };
    }
  });
};

function preprocessQuotesToClipCards(md: string): string {
  // Convert quote lines into stable HTML "clip cards". This keeps the report deterministic without any AI.
  // Matches the same quote-line regex used elsewhere in the repo.
  const QUOTE_MD_RE =
    /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)(.*)/gm;

  return md.replace(QUOTE_MD_RE, (_full, text, timestamp, startSeconds, rest) => {
    const durationMatch = rest.match(/duration:\s*(\d+)s/);
    const durationSec = durationMatch ? parseInt(durationMatch[1], 10) : 20;

    const sessionMatch = rest.match(/session:\s*(\d+)/);
    const sessionIndex = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;

    const startSec = parseInt(startSeconds, 10);
    const endSec = startSec + durationSec;

    // NOTE: video embedding is handled in `preprocessQuotesToClipCardsWithVideo` which has access to project sessions.
    return [
      `<div class="clip-card" data-session-index="${sessionIndex}" data-start="${startSec}" data-duration="${durationSec}">`,
      `  <div class="clip-container">`,
      `    <div class="clip-content">`,
      `      <div class="clip-meta">SESSION ${sessionIndex} • ${timestamp} • ${durationSec}s</div>`,
      `      <p class="clip-label">${escapeHtml(String(text))}</p>`,
      `    </div>`,
      `  </div>`,
      `</div>`,
    ].join("\n");
  });
}

function preprocessQuotesToClipCardsWithVideo(opts: {
  markdown: string;
  slug: string;
  sessions: Array<{ videoFile?: string }> | undefined;
}): string {
  const { markdown, slug, sessions } = opts;
  const QUOTE_MD_RE =
    /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)(.*)/gm;

  return markdown.replace(QUOTE_MD_RE, (_full, text, timestamp, startSeconds, rest) => {
    const durationMatch = rest.match(/duration:\s*(\d+)s/);
    const durationSec = durationMatch ? parseInt(durationMatch[1], 10) : 20;

    const sessionMatch = rest.match(/session:\s*(\d+)/);
    const sessionIndex = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;

    const startSec = parseInt(startSeconds, 10);
    const endSec = startSec + durationSec;

    const videoFile = sessions?.[sessionIndex - 1]?.videoFile;
    const videoSrc = videoFile
      ? `/api/projects/${encodeURIComponent(slug)}/files/videos/${encodeURIComponent(videoFile)}#t=${startSec},${endSec}`
      : null;

    const videoHtml = videoSrc
      ? [
          `    <div class="clip-video">`,
          `      <video controls preload="metadata" src="${videoSrc}"></video>`,
          `      <div class="timestamp-badge">${escapeHtml(String(timestamp))}</div>`,
          `    </div>`,
        ].join("\n")
      : `    <div class="timestamp-only-badge">${escapeHtml(String(timestamp))} • ${durationSec}s</div>`;

    return [
      `<div class="clip-card" data-session-index="${sessionIndex}" data-start="${startSec}" data-duration="${durationSec}">`,
      `  <div class="clip-container">`,
      videoHtml,
      `    <div class="clip-content">`,
      `      <div class="clip-meta">SESSION ${sessionIndex} • ${durationSec}s</div>`,
      `      <p class="clip-label">${escapeHtml(String(text))}</p>`,
      `    </div>`,
      `  </div>`,
      `</div>`,
    ].join("\n");
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function markdownToHtmlBody(markdown: string, opts: { slug: string; sessions: Array<{ videoFile?: string }> | undefined }): Promise<string> {
  const preprocessed = preprocessQuotesToClipCardsWithVideo({ markdown, slug: opts.slug, sessions: opts.sessions });

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCalloutDirectives)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(preprocessed);

  return String(file);
}

function wrapHtmlDocument(title: string, meta: { researcher?: string; date?: string; persona?: string; product?: string }, body: string): string {
  const pill = meta.product
    ? `<span class="pill">${escapeHtml(meta.product)}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #334155; background: #fff; }
  .container { max-width: 56rem; margin: 0 auto; padding: 2.25rem 1.5rem 4rem; }
  h1 { font-size: 2.25rem; font-weight: 800; margin: 0 0 0.75rem; color: #0f172a; letter-spacing: -0.03em; }
  h2 { font-size: 1.25rem; font-weight: 700; margin: 2.25rem 0 1rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
  p { margin: 0 0 1rem; color: #475569; }
  strong { font-weight: 650; color: #1e293b; }
  a { color: #f59f0a; text-decoration: underline; text-underline-offset: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0 1.5rem; }
  th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; vertical-align: top; }
  th { background: #f8fafc; text-align: left; font-weight: 650; color: #0f172a; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  .pill { background:#0f172a; color:#fff; padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }

  /* Callouts: match app variants (info=primary/orange, tip=emerald, warning=amber, insight=violet) */
  .callout-directive {
    margin: 1.25rem 0;
    padding: 1rem 1.1rem;
    border-radius: 0 0.75rem 0.75rem 0;
    border-left: 4px solid #e2e8f0;
    background: #f8fafc;
  }
  .callout-directive[data-callout-type="info"] { border-left-color: #d97706; background: rgba(245, 159, 10, 0.10); }
  .callout-directive[data-callout-type="tip"] { border-left-color: #10b981; background: rgba(16, 185, 129, 0.10); }
  .callout-directive[data-callout-type="warning"] { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.12); }
  .callout-directive[data-callout-type="insight"] { border-left-color: #8b5cf6; background: rgba(139, 92, 246, 0.10); }
  .callout-directive p:last-child { margin-bottom: 0; }

  .clip-card { margin: 1rem 0 1.25rem; border-radius: 0.9rem; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); overflow: hidden; }
  .clip-container { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.9rem 1rem; }
  @media (min-width: 720px) { .clip-container { flex-direction: row; align-items: flex-start; } }
  .clip-video { position: relative; flex-shrink: 0; width: 100%; max-width: 28rem; }
  video { width: 100%; height: auto; border-radius: 0.75rem; background: #000; }
  .timestamp-badge { position: absolute; bottom: 6px; right: 6px; padding: 2px 6px; border-radius: 6px; background: rgba(0,0,0,0.78); font-size: 11px; font-weight: 800; color: #fff; }
  .timestamp-only-badge { display: inline-block; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #e2e8f0; }
  .clip-meta { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: #64748b; }
  .clip-label { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
</style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      ${meta.researcher ? `<span>Researcher: <strong>${escapeHtml(meta.researcher)}</strong></span>` : ""}
      ${meta.date ? `<span>Date: <strong>${escapeHtml(meta.date)}</strong></span>` : ""}
      ${meta.persona ? `<span>Persona: <strong>${escapeHtml(meta.persona)}</strong></span>` : ""}
      ${pill}
    </div>
    ${body}
  </div>
</body>
</html>`;
}

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = sanitizeSlug(params.slug);
  if (!slug) return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });

  const project = getProject(slug);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const projectDir = path.join(getProjectsDir(), slug);
  const findingsMdPath = path.join(projectDir, "findings.md");
  const findingsHtmlPath = path.join(projectDir, "findings.html");

  if (!fs.existsSync(findingsMdPath)) {
    return NextResponse.json({ error: "findings.md not found" }, { status: 404 });
  }

  const md = fs.readFileSync(findingsMdPath, "utf-8");
  const body = await markdownToHtmlBody(md, { slug, sessions: project.sessions });
  const html = wrapHtmlDocument(project.title ?? slug, project, body);

  fs.writeFileSync(findingsHtmlPath, html);

  return NextResponse.json({ ok: true, file: "findings.html" });
}

