# Remote Publishing & Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the standalone `repo-viewer/` app, consolidate the viewer into a TypeScript template that matches the design system, add a SharePoint-via-OneDrive-sync adapter (no OAuth needed — treat the synced folder as local), and add a Google Drive adapter with user OAuth for uploading reports to a shared Drive folder.

**Architecture:** The viewer HTML (currently 3 separate files in `repo-viewer/`) is replaced by a single TypeScript function `generateViewerHtml()` in `src/lib/viewer-template.ts` that produces a self-contained HTML file with inlined CSS and JS, styled to match the report builder app (burnt orange `#f59f0a`, warm `#f8f7f5` background, Inter font, slate text scale). SharePoint publishing works by syncing a SharePoint library to a local OneDrive folder — the adapter writes to that local path, then OneDrive syncs it to the cloud automatically. Google Drive publishing uses OAuth 2.0 to upload files directly via the Drive API. For Drive, the viewer and `repo-index.json` are in the same folder so the viewer's `fetch('repo-index.json')` works without CORS issues (a fully hosted viewer with Drive-as-DB requires a server-side proxy and is out of scope for this plan).

**Tech Stack:** Next.js 14 App Router · TypeScript 5 · `googleapis` (Google Drive) · Vitest 4 · Node.js `fs`

> **Design system reference:** `design-system/MASTER.md`. All viewer UI uses these resolved token values:
> - Primary: `#f59f0a` / hover: `#d97706`
> - Page background: `#f8f7f5`
> - Surface (cards): `#ffffff`
> - Text: `#0f172a` (body) / `#475569` (secondary) / `#64748b` (muted)
> - Border: `#e2e8f0`
> - Border radius: `0.5rem` (buttons/cards), `0.75rem` (large cards)
> - Font: Inter via Google Fonts + system-ui fallback

---

## Phase 1 — Viewer Template Consolidation

### Task 1: Create `src/lib/viewer-template.ts`

**Files:**
- Create: `src/lib/viewer-template.ts`
- Create: `src/lib/viewer-template.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/viewer-template.test.ts
import { describe, it, expect } from "vitest";
import { generateViewerHtml } from "./viewer-template";

describe("generateViewerHtml", () => {
  it("returns a complete HTML document", () => {
    const html = generateViewerHtml();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("inlines CSS (no external stylesheet link)", () => {
    const html = generateViewerHtml();
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain("<style>");
  });

  it("inlines JavaScript (no external script src)", () => {
    const html = generateViewerHtml();
    expect(html).not.toContain('<script src=');
    expect(html).toContain("fetch('repo-index.json')");
  });

  it("includes a search input", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="search"');
  });

  it("includes the project-grid element", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="project-grid"');
  });

  it("includes filter selects for researcher, persona, product, sort", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="f-researcher"');
    expect(html).toContain('id="f-persona"');
    expect(html).toContain('id="f-product"');
    expect(html).toContain('id="f-sort"');
  });

  it("includes a clear filters button", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="btn-clear"');
  });

  it("includes a report count display", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="count"');
  });

  it("accepts an optional title override", () => {
    const html = generateViewerHtml({ title: "ACME Research Hub" });
    expect(html).toContain("ACME Research Hub");
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm run test -- viewer-template
```

Expected: FAIL — `Cannot find module './viewer-template'`

**Step 3: Implement `viewer-template.ts`**

The function takes an optional config object and returns a single HTML string with inlined CSS and JS. Design tokens match `design-system/MASTER.md`: burnt orange primary, warm `#f8f7f5` background, Inter font, slate text scale, `0.5rem` border-radius for cards.

```typescript
// src/lib/viewer-template.ts

interface ViewerConfig {
  title?: string;
  subtitle?: string;
}

export function generateViewerHtml(config: ViewerConfig = {}): string {
  const title = config.title ?? "Research Repository";
  const subtitle = config.subtitle ?? "Browse insights from our latest UX research sessions.";

  // Design system tokens (from design-system/MASTER.md):
  // primary: #f59f0a, primary-dark: #d97706, bg: #f8f7f5
  // text-slate-900: #0f172a, text-slate-600: #475569, text-slate-500: #64748b
  // border-slate-200: #e2e8f0, surface: #ffffff
  // rounded-lg = 0.5rem, rounded-xl = 0.75rem
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');
:root{--primary:#f59f0a;--primary-dark:#d97706;--bg:#f8f7f5;--surface:#ffffff;--text-main:#0f172a;--text-secondary:#475569;--text-muted:#64748b;--border:#e2e8f0}
*{box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;margin:0;padding:0;background:var(--bg);color:var(--text-main)}
#app{max-width:1280px;margin:0 auto;padding:1rem 1.5rem 3rem}
@media(min-width:640px){#app{padding:1.5rem 2rem 3rem}}
header{margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1.5rem;padding-top:1.5rem}
@media(min-width:768px){header{flex-direction:row;justify-content:space-between;align-items:flex-end}}
.title-section h1{font-size:1.875rem;font-weight:800;margin:0;color:var(--text-main);letter-spacing:-0.025em}
@media(min-width:768px){.title-section h1{font-size:2.25rem}}
.title-section p{color:var(--text-muted);margin:.375rem 0 0;font-size:.875rem}
#search{padding:.625rem 1rem;border:1px solid var(--border);border-radius:.5rem;width:100%;max-width:380px;font-size:.875rem;outline:none;font-family:inherit;background:var(--surface);color:var(--text-main);transition:border-color .2s,box-shadow .2s}
#search:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(245,159,10,.12)}
#filters{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-bottom:1.5rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)}
.filter-select{padding:.375rem .75rem;border:1px solid var(--border);border-radius:.5rem;font-size:.8125rem;font-family:inherit;background:var(--surface);color:var(--text-secondary);outline:none;cursor:pointer;transition:border-color .2s}
.filter-select:focus{border-color:var(--primary)}
.filter-select:hover{border-color:#cbd5e1}
#count{font-size:.8125rem;color:var(--text-muted);margin-left:auto}
.btn-clear{padding:.375rem .75rem;border-radius:.5rem;font-size:.8125rem;font-weight:500;background:transparent;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-family:inherit;transition:all .2s;display:none}
.btn-clear:hover{border-color:#cbd5e1;color:var(--text-secondary)}
.btn-clear.visible{display:inline-flex}
#project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
.project-card{background:var(--surface);border:1px solid var(--border);border-radius:.5rem;padding:1.5rem;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s,border-color .2s;display:flex;flex-direction:column}
.project-card:hover{transform:translateY(-2px);box-shadow:0 8px 16px -4px rgba(0,0,0,.08);border-color:rgba(245,159,10,.3)}
.project-card h2{margin:0 0 .75rem;font-size:1.125rem;font-weight:600;line-height:1.3;color:var(--text-main);letter-spacing:-0.01em}
.project-card .meta{font-size:.8125rem;color:var(--text-secondary);margin-bottom:1.25rem;flex-grow:1}
.meta-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.375rem;gap:.5rem}
.meta-label{font-weight:500;color:var(--text-muted);white-space:nowrap}
.meta-value{color:var(--text-secondary);text-align:right}
.project-card .links{display:flex;gap:.75rem;margin-top:auto}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:.5rem 1rem;border-radius:.5rem;font-weight:700;font-size:.875rem;text-decoration:none;transition:background-color .2s,color .2s;min-height:40px}
.btn-primary{background-color:var(--primary);color:#fff}
.btn-primary:hover{background-color:var(--primary-dark)}
.empty-state{grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-muted)}
.empty-state p{margin:.5rem 0}
`;

  const js = `
let allProjects=[];
let filters={researcher:'',persona:'',product:'',sort:'date-desc'};

function unique(key){return[...new Set(allProjects.map(p=>p[key]).filter(Boolean))].sort()}

function populateSelects(){
  ['researcher','persona','product'].forEach(key=>{
    const sel=document.getElementById('f-'+key);
    unique(key).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);});
  });
}

function applyFilters(){
  let res=[...allProjects];
  if(filters.researcher)res=res.filter(p=>p.researcher===filters.researcher);
  if(filters.persona)res=res.filter(p=>p.persona===filters.persona);
  if(filters.product)res=res.filter(p=>p.product===filters.product);
  const q=document.getElementById('search').value.toLowerCase().trim();
  if(q)res=res.filter(p=>[p.title,p.persona,p.product,p.researcher].some(v=>v&&v.toLowerCase().includes(q)));
  if(filters.sort==='date-asc')res.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if(filters.sort==='title-asc')res.sort((a,b)=>a.title.localeCompare(b.title));
  else res.sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('count').textContent=res.length+' of '+allProjects.length+' reports';
  const anyActive=filters.researcher||filters.persona||filters.product||filters.sort!=='date-desc'||q;
  document.getElementById('btn-clear').classList.toggle('visible',!!anyActive);
  renderProjects(res);
}

function renderProjects(projects){
  const grid=document.getElementById('project-grid');
  grid.innerHTML='';
  if(!projects.length){grid.innerHTML='<div class="empty-state"><p>No reports match your filters.</p></div>';return;}
  projects.forEach(p=>{
    const card=document.createElement('div');
    card.className='project-card';
    card.innerHTML=\`<h2>\${p.title}</h2><div class="meta"><div class="meta-row"><span class="meta-label">Researcher</span><span class="meta-value">\${p.researcher||'—'}</span></div><div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">\${new Date(p.date).toLocaleDateString()}</span></div><div class="meta-row"><span class="meta-label">Persona</span><span class="meta-value">\${p.persona||'—'}</span></div><div class="meta-row"><span class="meta-label">Product</span><span class="meta-value">\${p.product||'—'}</span></div></div><div class="links"><a href="\${p.findingsHtml}" class="btn btn-primary">View Report</a></div>\`;
    grid.appendChild(card);
  });
}

function onFilterChange(key,val){filters[key]=val;applyFilters();}

function clearFilters(){
  filters={researcher:'',persona:'',product:'',sort:'date-desc'};
  ['researcher','persona','product','sort'].forEach(k=>document.getElementById('f-'+k).value=k==='sort'?'date-desc':'');
  document.getElementById('search').value='';
  applyFilters();
}

async function loadProjects(){
  try{
    const r=await fetch('repo-index.json');
    if(!r.ok)throw new Error('Failed to load repo-index.json');
    allProjects=await r.json();
    populateSelects();
    applyFilters();
  }catch(e){
    document.getElementById('project-grid').innerHTML='<div class="empty-state"><p>No projects found or repo-index.json is missing.</p><p style="font-size:.875rem">Publish your first report to see it here.</p></div>';
  }
}

document.getElementById('search').addEventListener('input',()=>applyFilters());
['researcher','persona','product','sort'].forEach(k=>{
  document.getElementById('f-'+k).addEventListener('change',e=>onFilterChange(k,e.target.value));
});
document.getElementById('btn-clear').addEventListener('click',clearFilters);
loadProjects();
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
<div id="app">
  <header>
    <div class="title-section">
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    <input type="text" id="search" placeholder="Search by title, persona, product...">
  </header>
  <div id="filters">
    <select id="f-researcher" class="filter-select"><option value="">All researchers</option></select>
    <select id="f-persona" class="filter-select"><option value="">All personas</option></select>
    <select id="f-product" class="filter-select"><option value="">All products</option></select>
    <select id="f-sort" class="filter-select">
      <option value="date-desc">Newest first</option>
      <option value="date-asc">Oldest first</option>
      <option value="title-asc">Title A–Z</option>
    </select>
    <button id="btn-clear" class="btn-clear">Clear filters</button>
    <span id="count"></span>
  </div>
  <main id="project-grid">
    <div class="empty-state">Loading projects...</div>
  </main>
</div>
<script>${js}</script>
</body>
</html>`;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test -- viewer-template
```

Expected: PASS — 9 tests pass

**Step 5: Commit**

```bash
git add src/lib/viewer-template.ts src/lib/viewer-template.test.ts
git commit -m "feat: add generateViewerHtml() to replace standalone repo-viewer assets"
```

---

### Task 2: Update local-folder adapter to use the new template

**Files:**
- Modify: `src/adapters/local-folder/index.ts` (lines 76–87)
- Modify: `src/adapters/local-folder/index.test.ts`

**Context:** The adapter currently reads from `repo-viewer/` directory (lines 76–87). Replace that block with a call to `generateViewerHtml()` and write it directly.

Also fix the existing test — the test currently checks `tempTargetDir/index.html` and `tempTargetDir/clips/clip1.mp4`, but the adapter copies project files to `tempTargetDir/{project.id}/`. The test assertions need to match the project subdirectory. Add a new assertion for the viewer at `tempTargetDir/index.html`.

**Step 1: Update the adapter**

In `src/adapters/local-folder/index.ts`, replace the import at the top:

```typescript
// ADD to top imports
import { generateViewerHtml } from "@/lib/viewer-template";
```

Replace the viewer-copy block (lines 75–87):

```typescript
// OLD (delete this):
const repoViewerDir = path.join(process.cwd(), "repo-viewer");
if (fs.existsSync(repoViewerDir)) {
  const assets = ["index.html", "viewer.js", "viewer.css"];
  for (const asset of assets) {
    const srcPath = path.join(repoViewerDir, asset);
    const destPath = path.join(targetPath, asset);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// NEW (replace with):
const viewerPath = path.join(targetPath, "index.html");
fs.writeFileSync(viewerPath, generateViewerHtml(), "utf-8");
```

**Step 2: Fix and extend the test**

```typescript
// In the "should successfully publish" test, update assertions:
it("should successfully publish to a local folder", async () => {
  const payload = {
    projectDir: tempProjectDir,
    project: { id: "test-project", title: "Test Project", date: "2026-01-01", researcher: "Alice", persona: "Admin", product: "App" } as any,
    htmlPath: path.join(tempExportDir, "index.html"),
    clipsDir: path.join(tempExportDir, "clips"),
  };
  const config = { targetPath: tempTargetDir };
  const result = await LocalFolderAdapter.publish(payload, config);

  expect(result.success).toBe(true);
  // Project files go to project subdirectory
  expect(fs.existsSync(path.join(tempTargetDir, "test-project", "index.html"))).toBe(true);
  expect(fs.existsSync(path.join(tempTargetDir, "test-project", "clips", "clip1.mp4"))).toBe(true);
  // Viewer is at root
  const viewerHtml = fs.readFileSync(path.join(tempTargetDir, "index.html"), "utf-8");
  expect(viewerHtml).toContain("<!DOCTYPE html>");
  expect(viewerHtml).toContain("repo-index.json");
  // Index is updated
  const index = JSON.parse(fs.readFileSync(path.join(tempTargetDir, "repo-index.json"), "utf-8"));
  expect(index).toHaveLength(1);
  expect(index[0].id).toBe("test-project");
});
```

**Step 3: Run tests**

```bash
npm run test -- local-folder
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/adapters/local-folder/index.ts src/adapters/local-folder/index.test.ts
git commit -m "fix: replace repo-viewer file copy with generateViewerHtml() in local-folder adapter"
```

---

### Task 3: Delete `repo-viewer/`

**Step 1: Delete the directory**

```bash
rm -rf repo-viewer/
```

**Step 2: Run all tests to confirm nothing breaks**

```bash
npm run test
```

Expected: All tests pass (no references to `repo-viewer/` in test suite)

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove repo-viewer/ — replaced by src/lib/viewer-template.ts"
```

---

### Task 4: Create `scripts/refresh-viewer.ts` — change-detection sync script

A standalone CLI script that syncs the viewer and changed project exports to a remote folder (OneDrive or any local path) without re-running the full publish flow. Run this after publishing new reports, or on a schedule, to keep the remote folder up to date.

**Files:**
- Create: `scripts/refresh-viewer.ts`
- Modify: `package.json` (add `refresh-viewer` script)
- Create: `scripts/refresh-viewer.test.ts`

**How it works:**
1. Reads config from CLI args (`--path`) or `.refresh-viewer.json` at repo root
2. Scans `content/projects/*/project.json` to build an up-to-date `repo-index.json`
3. For each project that has been exported (`export/` folder exists): compares files in `{targetPath}/{project.id}/` against local `export/` using MD5 hashes — copies only changed/new files
4. Writes updated `repo-index.json` only if content changed
5. Regenerates viewer `index.html` and writes it only if the output changed
6. Prints a summary: `X projects checked, Y files updated, Z unchanged`

**Step 1: Write failing tests**

```typescript
// scripts/refresh-viewer.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { hashFile, syncProject, buildRepoIndex } from "./refresh-viewer";

describe("refresh-viewer helpers", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rv-test-")); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("hashFile returns a consistent MD5 hex string", () => {
    const file = path.join(tmpDir, "a.txt");
    fs.writeFileSync(file, "hello");
    const h1 = hashFile(file);
    const h2 = hashFile(file);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{32}$/);
  });

  it("hashFile returns different hashes for different content", () => {
    const a = path.join(tmpDir, "a.txt");
    const b = path.join(tmpDir, "b.txt");
    fs.writeFileSync(a, "hello");
    fs.writeFileSync(b, "world");
    expect(hashFile(a)).not.toBe(hashFile(b));
  });

  it("syncProject copies new files and returns changed count", () => {
    const srcDir = path.join(tmpDir, "src");
    const dstDir = path.join(tmpDir, "dst");
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, "index.html"), "<html>v1</html>");
    const result = syncProject(srcDir, dstDir);
    expect(result.copied).toBe(1);
    expect(result.unchanged).toBe(0);
    expect(fs.existsSync(path.join(dstDir, "index.html"))).toBe(true);
  });

  it("syncProject skips unchanged files", () => {
    const srcDir = path.join(tmpDir, "src");
    const dstDir = path.join(tmpDir, "dst");
    fs.mkdirSync(srcDir);
    fs.mkdirSync(dstDir);
    fs.writeFileSync(path.join(srcDir, "index.html"), "<html>v1</html>");
    fs.writeFileSync(path.join(dstDir, "index.html"), "<html>v1</html>");
    const result = syncProject(srcDir, dstDir);
    expect(result.copied).toBe(0);
    expect(result.unchanged).toBe(1);
  });

  it("syncProject copies changed files", () => {
    const srcDir = path.join(tmpDir, "src");
    const dstDir = path.join(tmpDir, "dst");
    fs.mkdirSync(srcDir);
    fs.mkdirSync(dstDir);
    fs.writeFileSync(path.join(srcDir, "index.html"), "<html>v2</html>");
    fs.writeFileSync(path.join(dstDir, "index.html"), "<html>v1</html>");
    const result = syncProject(srcDir, dstDir);
    expect(result.copied).toBe(1);
    expect(fs.readFileSync(path.join(dstDir, "index.html"), "utf-8")).toBe("<html>v2</html>");
  });

  it("buildRepoIndex reads project.json files from a content dir", () => {
    const contentDir = path.join(tmpDir, "projects");
    const projDir = path.join(contentDir, "test-proj");
    fs.mkdirSync(projDir, { recursive: true });
    fs.mkdirSync(path.join(projDir, "export"), { recursive: true });
    fs.writeFileSync(path.join(projDir, "project.json"), JSON.stringify({
      id: "test-proj", title: "Test", date: "2026-01-01",
      researcher: "Alice", persona: "Admin", product: "App", status: "exported"
    }));
    const index = buildRepoIndex(contentDir);
    expect(index).toHaveLength(1);
    expect(index[0].id).toBe("test-proj");
    expect(index[0].findingsHtml).toBe("test-proj/index.html");
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm run test -- scripts/refresh-viewer
```

**Step 3: Implement the script**

```typescript
// scripts/refresh-viewer.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generateViewerHtml } from "../src/lib/viewer-template";

// ── Helpers (exported for tests) ──────────────────────────────────────────────

export function hashFile(filePath: string): string {
  return crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

export interface SyncResult { copied: number; unchanged: number }

/** Recursively sync srcDir → dstDir, copying only changed/new files. */
export function syncProject(srcDir: string, dstDir: string): SyncResult {
  let copied = 0, unchanged = 0;
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      const sub = syncProject(srcPath, dstPath);
      copied += sub.copied;
      unchanged += sub.unchanged;
    } else {
      const needsCopy = !fs.existsSync(dstPath) || hashFile(srcPath) !== hashFile(dstPath);
      if (needsCopy) {
        fs.copyFileSync(srcPath, dstPath);
        copied++;
      } else {
        unchanged++;
      }
    }
  }
  return { copied, unchanged };
}

export interface RepoIndexEntry {
  id: string; title: string; date: string;
  researcher: string; persona: string; product?: string; findingsHtml: string;
}

/** Scan content/projects/*/project.json and build a repo-index array. Only includes exported projects. */
export function buildRepoIndex(contentProjectsDir: string): RepoIndexEntry[] {
  if (!fs.existsSync(contentProjectsDir)) return [];
  const entries: RepoIndexEntry[] = [];
  for (const slug of fs.readdirSync(contentProjectsDir)) {
    const projectJsonPath = path.join(contentProjectsDir, slug, "project.json");
    const exportDir = path.join(contentProjectsDir, slug, "export");
    if (!fs.existsSync(projectJsonPath) || !fs.existsSync(exportDir)) continue;
    try {
      const p = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
      if (!["exported", "published"].includes(p.status)) continue;
      entries.push({
        id: p.id, title: p.title, date: p.date,
        researcher: p.researcher, persona: p.persona, product: p.product,
        findingsHtml: `${p.id}/index.html`,
      });
    } catch {}
  }
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Main ──────────────────────────────────────────────────────────────────────

function writeIfChanged(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf-8");
    if (existing === content) return false;
  }
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

async function main() {
  // Parse --path arg or fall back to .refresh-viewer.json
  const argIdx = process.argv.indexOf("--path");
  let targetPath = argIdx >= 0 ? process.argv[argIdx + 1] : null;

  if (!targetPath) {
    const configPath = path.join(process.cwd(), ".refresh-viewer.json");
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      targetPath = cfg.path;
    }
  }

  if (!targetPath) {
    console.error("Error: provide --path or create .refresh-viewer.json with { \"path\": \"...\" }");
    process.exit(1);
  }

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: target path does not exist: ${targetPath}`);
    process.exit(1);
  }

  const contentDir = path.join(process.cwd(), "content", "projects");
  const repoIndex = buildRepoIndex(contentDir);

  let totalCopied = 0, totalUnchanged = 0, projectsChecked = 0;

  // Sync each project's export folder
  for (const entry of repoIndex) {
    const srcExport = path.join(contentDir, entry.id, "export");
    const dstProject = path.join(targetPath, entry.id);
    const result = syncProject(srcExport, dstProject);
    totalCopied += result.copied;
    totalUnchanged += result.unchanged;
    projectsChecked++;
    if (result.copied > 0) {
      console.log(`  ✓ ${entry.id}: ${result.copied} file(s) updated`);
    } else {
      console.log(`  · ${entry.id}: up to date`);
    }
  }

  // Update repo-index.json
  const indexJson = JSON.stringify(repoIndex, null, 2);
  const indexChanged = writeIfChanged(path.join(targetPath, "repo-index.json"), indexJson);
  if (indexChanged) { console.log("  ✓ repo-index.json updated"); totalCopied++; }
  else { console.log("  · repo-index.json: up to date"); }

  // Update viewer HTML
  const viewerHtml = generateViewerHtml();
  const viewerChanged = writeIfChanged(path.join(targetPath, "index.html"), viewerHtml);
  if (viewerChanged) { console.log("  ✓ index.html (viewer) updated"); totalCopied++; }
  else { console.log("  · index.html: up to date"); }

  console.log(`\nDone: ${projectsChecked} projects, ${totalCopied} file(s) updated, ${totalUnchanged} unchanged.`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

**Step 4: Add to `package.json` scripts**

In `package.json`, add to the `"scripts"` block:

```json
"refresh-viewer": "tsx scripts/refresh-viewer.ts"
```

If `tsx` is not already a dependency, install it:

```bash
npm install --save-dev tsx
```

**Step 5: Add `.refresh-viewer.json` to `.gitignore`**

This file holds each developer's local OneDrive path and should not be committed.

```bash
echo ".refresh-viewer.json" >> .gitignore
```

**Step 6: Run tests**

```bash
npm run test -- scripts/refresh-viewer
```

Expected: PASS

**Step 7: Test the script manually**

```bash
# Using --path arg:
npm run refresh-viewer -- --path "C:\Users\Alice\Contoso\Research Reports"

# Or create .refresh-viewer.json first:
echo '{"path":"C:\\Users\\Alice\\Contoso\\Research Reports"}' > .refresh-viewer.json
npm run refresh-viewer
```

Expected output:
```
  · my-project-slug: up to date
  ✓ repo-index.json updated
  ✓ index.html (viewer) updated

Done: 1 projects, 2 file(s) updated, 5 unchanged.
```

**Step 8: Commit**

```bash
git add scripts/refresh-viewer.ts scripts/refresh-viewer.test.ts package.json .gitignore
git commit -m "feat: add refresh-viewer script with file-hash change detection"
```

---

## Phase 2 — OAuth Infrastructure

### Task 4: Create `src/lib/token-store.ts`

Cloud adapters need a place to store OAuth tokens between the callback redirect and the publish call. This is a simple in-memory singleton.

**Files:**
- Create: `src/lib/token-store.ts`
- Create: `src/lib/token-store.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/token-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { tokenStore } from "./token-store";

describe("tokenStore", () => {
  beforeEach(() => tokenStore.clear());

  it("stores and retrieves a token by provider", () => {
    tokenStore.set("sharepoint", { accessToken: "abc", expiresAt: Date.now() + 3600_000 });
    const t = tokenStore.get("sharepoint");
    expect(t?.accessToken).toBe("abc");
  });

  it("returns null for unknown provider", () => {
    expect(tokenStore.get("unknown")).toBeNull();
  });

  it("returns null for expired token", () => {
    tokenStore.set("sharepoint", { accessToken: "old", expiresAt: Date.now() - 1000 });
    expect(tokenStore.get("sharepoint")).toBeNull();
  });

  it("clears all tokens", () => {
    tokenStore.set("sharepoint", { accessToken: "abc", expiresAt: Date.now() + 3600_000 });
    tokenStore.clear();
    expect(tokenStore.get("sharepoint")).toBeNull();
  });

  it("reports connected status", () => {
    expect(tokenStore.isConnected("sharepoint")).toBe(false);
    tokenStore.set("sharepoint", { accessToken: "abc", expiresAt: Date.now() + 3600_000 });
    expect(tokenStore.isConnected("sharepoint")).toBe(true);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm run test -- token-store
```

**Step 3: Implement**

```typescript
// src/lib/token-store.ts

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix ms
}

class TokenStore {
  private store = new Map<string, StoredToken>();

  set(provider: string, token: StoredToken): void {
    this.store.set(provider, token);
  }

  get(provider: string): StoredToken | null {
    const token = this.store.get(provider);
    if (!token) return null;
    if (Date.now() > token.expiresAt) {
      this.store.delete(provider);
      return null;
    }
    return token;
  }

  isConnected(provider: string): boolean {
    return this.get(provider) !== null;
  }

  clear(provider?: string): void {
    if (provider) {
      this.store.delete(provider);
    } else {
      this.store.clear();
    }
  }
}

// Singleton — persists for the lifetime of the Next.js dev server process
export const tokenStore = new TokenStore();
```

**Step 4: Run tests**

```bash
npm run test -- token-store
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/token-store.ts src/lib/token-store.test.ts
git commit -m "feat: add in-memory OAuth token store"
```

---

### Task 5: OAuth API routes

Two routes per provider: one to start the OAuth flow (returns auth URL), one for the callback (exchanges code for token).

**Files:**
- Create: `src/app/api/auth/[provider]/route.ts`
- Create: `src/app/api/auth/[provider]/callback/route.ts`
- Create: `src/app/api/auth/[provider]/status/route.ts`

#### `GET /api/auth/[provider]` — Initiate OAuth

This route returns `{ authUrl }`. The client opens this URL in a new browser tab.

For SharePoint it requires query params: `clientId`, `tenantId`, `redirectUri` (always `http://localhost:3000/api/auth/sharepoint/callback`).
For Google Drive it requires: `clientId`, `clientSecret`.

```typescript
// src/app/api/auth/[provider]/route.ts
import { NextRequest, NextResponse } from "next/server";

const REDIRECT_BASE = "http://localhost:3000/api/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const sp = req.nextUrl.searchParams;

  if (provider === "sharepoint") {
    const clientId = sp.get("clientId");
    const tenantId = sp.get("tenantId");
    if (!clientId || !tenantId) {
      return NextResponse.json({ error: "clientId and tenantId required" }, { status: 400 });
    }
    const redirectUri = encodeURIComponent(`${REDIRECT_BASE}/sharepoint/callback`);
    const scope = encodeURIComponent("https://graph.microsoft.com/Files.ReadWrite.All offline_access");
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;
    return NextResponse.json({ authUrl });
  }

  if (provider === "google") {
    const clientId = sp.get("clientId");
    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }
    const redirectUri = encodeURIComponent(`${REDIRECT_BASE}/google/callback`);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&access_type=offline&prompt=consent`;
    return NextResponse.json({ authUrl });
  }

  return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 404 });
}
```

#### `GET /api/auth/[provider]/callback` — Exchange code for token

This receives the OAuth callback and stores the token.

```typescript
// src/app/api/auth/[provider]/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenStore } from "@/lib/token-store";

const REDIRECT_BASE = "http://localhost:3000/api/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return new NextResponse("<h2>Auth failed — no code received</h2>", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  try {
    if (provider === "sharepoint") {
      // clientId and tenantId are passed as state or stored temporarily
      // For simplicity, store them in the session via a state param
      const state = req.nextUrl.searchParams.get("state") ?? "{}";
      let clientId = "", tenantId = "", clientSecret = "";
      try { ({ clientId, tenantId, clientSecret } = JSON.parse(decodeURIComponent(state))); } catch {}

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${REDIRECT_BASE}/sharepoint/callback`,
        scope: "https://graph.microsoft.com/Files.ReadWrite.All offline_access",
      });

      const resp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error_description ?? "Token exchange failed");

      tokenStore.set("sharepoint", {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      });
    }

    if (provider === "google") {
      const state = req.nextUrl.searchParams.get("state") ?? "{}";
      let clientId = "", clientSecret = "";
      try { ({ clientId, clientSecret } = JSON.parse(decodeURIComponent(state))); } catch {}

      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${REDIRECT_BASE}/google/callback`,
        grant_type: "authorization_code",
      });

      const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error_description ?? "Token exchange failed");

      tokenStore.set("google", {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      });
    }

    return new NextResponse(
      `<html><body><h2 style="font-family:system-ui;text-align:center;margin-top:4rem">Connected successfully. You can close this tab.</h2><script>window.close()</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return new NextResponse(`<h2>Auth error: ${err.message}</h2>`, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}
```

#### `GET /api/auth/[provider]/status` — Poll connection status

```typescript
// src/app/api/auth/[provider]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenStore } from "@/lib/token-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { provider: string } }
) {
  return NextResponse.json({ connected: tokenStore.isConnected(params.provider) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { provider: string } }
) {
  tokenStore.clear(params.provider);
  return NextResponse.json({ connected: false });
}
```

**Step 1: Create all three files** with the code above.

**Step 2: Manually test** (after implementing adapters in later tasks):
- Start dev server: `npm run dev`
- Navigate to a project's export page
- Click Publish → select SharePoint → fill in clientId and tenantId → click Connect
- A new tab opens Microsoft login
- After login, tab closes with "Connected successfully"
- Status button shows "Connected ✓"

**Step 3: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add OAuth initiation, callback, and status routes for SharePoint and Google"
```

---

### Task 6: Add `"oauth"` field type to `AdapterConfigField`

**Files:**
- Modify: `src/adapters/types.ts`

Add `"oauth"` to the union:

```typescript
// In AdapterConfigField:
type: "text" | "password" | "path" | "select" | "oauth";
```

No test needed — TypeScript enforces this at compile time.

**Commit:**

```bash
git add src/adapters/types.ts
git commit -m "feat: add oauth field type to AdapterConfigField"
```

---

### Task 7: Update `PublishModal` to handle OAuth fields

**Files:**
- Modify: `src/components/publish/PublishModal.tsx`

**Context:** The modal renders config fields from `adapter.configSchema`. Add a new branch for `type === "oauth"` that renders a Connect button.

**Behaviour:**
1. The Connect button calls `GET /api/auth/{provider}?{config params}` to get the auth URL.
2. Opens the auth URL in a new tab via `window.open(authUrl, '_blank')`.
3. Polls `GET /api/auth/{provider}/status` every 2 seconds for up to 2 minutes.
4. On success, shows "Connected ✓" and stops polling.
5. A "Disconnect" link calls `DELETE /api/auth/{provider}/status`.

**Step 1: Add connection state to the modal**

At the top of `PublishModal`, add state:

```typescript
const [oauthStatus, setOauthStatus] = useState<Record<string, boolean>>({});
```

**Step 2: Add helper to start OAuth**

```typescript
async function startOAuth(provider: string) {
  // Collect current config values to pass as state to the auth URL
  const params = new URLSearchParams(config);
  params.set("provider", provider);
  const res = await fetch(`/api/auth/${provider}?${params.toString()}`);
  const { authUrl } = await res.json();
  window.open(authUrl, "_blank");

  // Poll for status
  const interval = setInterval(async () => {
    const statusRes = await fetch(`/api/auth/${provider}/status`);
    const { connected } = await statusRes.json();
    if (connected) {
      setOauthStatus(prev => ({ ...prev, [provider]: true }));
      clearInterval(interval);
    }
  }, 2000);

  // Stop polling after 2 min
  setTimeout(() => clearInterval(interval), 120_000);
}
```

**Step 3: Add OAuth field renderer** in the config fields map:

```tsx
{field.type === "oauth" && (
  <div key={field.key} className="flex items-center gap-3">
    {oauthStatus[adapter.id] ? (
      <>
        <span className="text-sm text-green-600 font-medium">Connected ✓</span>
        <button
          type="button"
          className="text-xs text-muted underline"
          onClick={async () => {
            await fetch(`/api/auth/${adapter.id}/status`, { method: "DELETE" });
            setOauthStatus(prev => ({ ...prev, [adapter.id]: false }));
          }}
        >
          Disconnect
        </button>
      </>
    ) : (
      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        onClick={() => startOAuth(adapter.id)}
      >
        {field.label}
      </button>
    )}
  </div>
)}
```

**Step 4: Disable the Publish button** if any `oauth` field is not connected:

```typescript
const oauthFields = adapter.configSchema.filter(f => f.type === "oauth");
const allOauthConnected = oauthFields.every(f => oauthStatus[adapter.id]);
// Disable submit if not all OAuth fields are connected
```

**Step 5: Commit**

```bash
git add src/components/publish/PublishModal.tsx
git commit -m "feat: add OAuth connect button and polling to PublishModal"
```

---

## Phase 3 — SharePoint via OneDrive Sync Adapter

No Azure app registration. No OAuth. No Graph API. Users sync a SharePoint document library to their PC via the OneDrive client — the adapter writes files to that local synced folder and OneDrive uploads them to SharePoint automatically.

**Why this is better than Graph API:** Zero setup for the developer, zero OAuth complexity, works with any SharePoint plan, and the sync is handled by Microsoft's own client which is already installed on most corporate machines.

### Task 8: Create SharePoint-via-OneDrive adapter

**Files:**
- Create: `src/adapters/sharepoint-onedrive/index.ts`
- Create: `src/adapters/sharepoint-onedrive/index.test.ts`

**Step 1: Write failing tests**

The adapter is almost identical to LocalFolderAdapter. Tests mirror `local-folder/index.test.ts`.

```typescript
// src/adapters/sharepoint-onedrive/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SharePointOneDriveAdapter } from "./index";
import fs from "fs";
import path from "path";
import os from "os";

describe("SharePointOneDriveAdapter", () => {
  let tempProjectDir: string;
  let tempExportDir: string;
  let tempSyncDir: string;

  beforeEach(() => {
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-"));
    tempExportDir = path.join(tempProjectDir, "export");
    tempSyncDir = fs.mkdtempSync(path.join(os.tmpdir(), "sharepoint-"));
    fs.mkdirSync(tempExportDir, { recursive: true });
    fs.mkdirSync(path.join(tempExportDir, "clips"), { recursive: true });
    fs.writeFileSync(path.join(tempExportDir, "index.html"), "<html>Test</html>");
    fs.writeFileSync(path.join(tempExportDir, "clips", "clip1.mp4"), "fake-video");
  });

  afterEach(() => {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
    fs.rmSync(tempSyncDir, { recursive: true, force: true });
  });

  it("has correct metadata", () => {
    expect(SharePointOneDriveAdapter.id).toBe("sharepoint-onedrive");
    expect(SharePointOneDriveAdapter.name).toContain("SharePoint");
    expect(SharePointOneDriveAdapter.configSchema.some(f => f.key === "syncedPath")).toBe(true);
  });

  it("fails if syncedPath is not provided", async () => {
    const result = await SharePointOneDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      {}
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("synced folder path");
  });

  it("fails if export directory does not exist", async () => {
    fs.rmSync(tempExportDir, { recursive: true, force: true });
    const result = await SharePointOneDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      { syncedPath: tempSyncDir }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Export directory not found");
  });

  it("publishes files to the synced folder and writes viewer + index", async () => {
    const result = await SharePointOneDriveAdapter.publish(
      {
        projectDir: tempProjectDir,
        project: { id: "test-proj", title: "Test", date: "2026-01-01", researcher: "Alice", persona: "Admin", product: "App" } as any,
        htmlPath: "",
        clipsDir: "",
      },
      { syncedPath: tempSyncDir }
    );
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tempSyncDir, "test-proj", "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tempSyncDir, "test-proj", "clips", "clip1.mp4"))).toBe(true);
    const viewer = fs.readFileSync(path.join(tempSyncDir, "index.html"), "utf-8");
    expect(viewer).toContain("<!DOCTYPE html>");
    const index = JSON.parse(fs.readFileSync(path.join(tempSyncDir, "repo-index.json"), "utf-8"));
    expect(index[0].id).toBe("test-proj");
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm run test -- src/adapters/sharepoint-onedrive
```

**Step 3: Implement the adapter**

The logic is identical to LocalFolderAdapter. The adapter difference is in `id`, `name`, `description`, `configSchema` (the field is called `syncedPath` with a helpful placeholder), and the help text explaining the OneDrive sync setup.

```typescript
// src/adapters/sharepoint-onedrive/index.ts
import fs from "fs";
import path from "path";
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import { generateViewerHtml } from "@/lib/viewer-template";

export const SharePointOneDriveAdapter: PublishAdapter = {
  id: "sharepoint-onedrive",
  name: "SharePoint (via OneDrive sync)",
  description:
    "Publish to a SharePoint document library by writing to its locally-synced OneDrive folder. " +
    "To set up: open the SharePoint library in your browser → click Sync → OneDrive will create a local folder automatically.",
  icon: "FolderSync",
  configSchema: [
    {
      key: "syncedPath",
      label: "Path to your synced SharePoint folder",
      type: "path",
      required: true,
      placeholder: "e.g. C:\\Users\\Alice\\Contoso\\Research Reports",
    },
  ],

  async publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult> {
    const { syncedPath } = config;
    if (!syncedPath) {
      return { success: false, message: "Please provide the synced folder path. Open the SharePoint library → click Sync to get it." };
    }

    const { projectDir, project } = payload;

    try {
      if (!fs.existsSync(syncedPath)) {
        fs.mkdirSync(syncedPath, { recursive: true });
      }

      const destDir = path.join(syncedPath, project.id);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const exportDir = path.join(projectDir, "export");
      if (!fs.existsSync(exportDir)) {
        return { success: false, message: `Export directory not found: ${exportDir}. Run export first.` };
      }

      // Copy project export to project subfolder
      fs.cpSync(exportDir, destDir, { recursive: true, force: true });

      // Update repo-index.json at root of synced folder
      const indexPath = path.join(syncedPath, "repo-index.json");
      let repoIndex: any[] = [];
      if (fs.existsSync(indexPath)) {
        try { repoIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8")); } catch {}
      }
      const entry = {
        id: project.id, title: project.title, date: project.date,
        researcher: project.researcher, persona: project.persona, product: project.product,
        findingsHtml: `${project.id}/index.html`, publishedUrl: null,
      };
      const idx = repoIndex.findIndex((p: any) => p.id === project.id);
      if (idx >= 0) repoIndex[idx] = entry; else repoIndex.push(entry);
      fs.writeFileSync(indexPath, JSON.stringify(repoIndex, null, 2));

      // Write viewer at root of synced folder (always overwrite with latest)
      fs.writeFileSync(path.join(syncedPath, "index.html"), generateViewerHtml(), "utf-8");

      return {
        success: true,
        message: `Published to SharePoint synced folder: ${destDir}. OneDrive will sync automatically.`,
        url: syncedPath,
      };
    } catch (err: any) {
      return { success: false, message: `Publish failed: ${err.message}` };
    }
  },
};
```

**Step 4: Run tests**

```bash
npm run test -- src/adapters/sharepoint-onedrive
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/sharepoint-onedrive/
git commit -m "feat: add SharePoint-via-OneDrive-sync adapter (no OAuth required)"
```

---

## Phase 4 — Google Drive Adapter

### Task 10: Install Google Drive dependency

```bash
npm install googleapis
```

**Commit:**

```bash
git add package.json package-lock.json
git commit -m "chore: add googleapis dependency"
```

---

### Task 11: Create Google Drive adapter

**Files:**
- Create: `src/adapters/google-drive/index.ts`
- Create: `src/adapters/google-drive/index.test.ts`

**Note on Google Drive viewer:** Google Drive no longer serves HTML files as web pages. The uploaded `index.html` will be downloadable but not directly browsable in a browser from Drive. For a browsable viewer, users would need Google Sites. This adapter is primarily a file archival/sync target. The `url` returned is the Drive folder URL.

**Step 1: Write failing tests**

```typescript
// src/adapters/google-drive/index.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleDriveAdapter } from "./index";
import { tokenStore } from "@/lib/token-store";

vi.mock("googleapis", () => ({
  google: {
    auth: { OAuth2: vi.fn(() => ({ setCredentials: vi.fn() })) },
    drive: vi.fn(() => ({
      files: {
        list: vi.fn().mockResolvedValue({ data: { files: [] } }),
        create: vi.fn().mockResolvedValue({ data: { id: "new-file-id" } }),
        update: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockResolvedValue({ data: "[]" }),
      },
    })),
  },
}));

describe("GoogleDriveAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  it("has correct metadata", () => {
    expect(GoogleDriveAdapter.id).toBe("google-drive");
    expect(GoogleDriveAdapter.configSchema.some(f => f.key === "folderId")).toBe(true);
    expect(GoogleDriveAdapter.configSchema.some(f => f.type === "oauth")).toBe(true);
  });

  it("fails if not connected", async () => {
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "/tmp/p", project: {} as any, htmlPath: "", clipsDir: "" },
      { folderId: "abc123" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Not connected");
  });

  it("fails if folderId is missing", async () => {
    tokenStore.set("google", { accessToken: "token", expiresAt: Date.now() + 3600_000 });
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "/tmp/p", project: {} as any, htmlPath: "", clipsDir: "" },
      {}
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("folderId");
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm run test -- src/adapters/google-drive
```

**Step 3: Implement the adapter**

```typescript
// src/adapters/google-drive/index.ts
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import { tokenStore } from "@/lib/token-store";
import { generateViewerHtml } from "@/lib/viewer-template";

function bufferToStream(buffer: Buffer): Readable {
  const r = new Readable();
  r.push(buffer);
  r.push(null);
  return r;
}

async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
  });
  if (res.data.files.length > 0) return res.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return created.data.id;
}

async function uploadOrUpdateFile(drive: any, name: string, parentId: string, content: Buffer, mimeType = "application/octet-stream"): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: "files(id)",
  });
  const media = { mimeType, body: bufferToStream(content) };
  if (res.data.files.length > 0) {
    const fileId = res.data.files[0].id;
    await drive.files.update({ fileId, media });
    return fileId;
  }
  const created = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media,
    fields: "id",
  });
  return created.data.id;
}

export const GoogleDriveAdapter: PublishAdapter = {
  id: "google-drive",
  name: "Google Drive",
  description: "Upload reports to a shared Google Drive folder. Team members can download and open HTML reports locally.",
  icon: "Cloud",
  configSchema: [
    { key: "clientId", label: "Google OAuth client ID", type: "text", required: true, placeholder: "xxxxx.apps.googleusercontent.com" },
    { key: "clientSecret", label: "Google OAuth client secret", type: "password", required: true },
    { key: "folderId", label: "Drive folder ID", type: "text", required: true, placeholder: "Paste from the folder URL: /folders/{this-part}" },
    { key: "_oauth", label: "Sign in to Google Drive", type: "oauth", required: true },
  ],

  async publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult> {
    const stored = tokenStore.get("google");
    if (!stored) return { success: false, message: "Not connected to Google Drive. Click 'Sign in to Google Drive' first." };
    if (!config.folderId) return { success: false, message: "folderId is required" };

    const { project, projectDir } = payload;

    try {
      const { google } = await import("googleapis");
      const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);
      auth.setCredentials({ access_token: stored.accessToken, refresh_token: stored.refreshToken });
      const drive = google.drive({ version: "v3", auth });

      const exportDir = path.join(projectDir, "export");
      if (!fs.existsSync(exportDir)) {
        return { success: false, message: `Export directory not found: ${exportDir}. Run export first.` };
      }

      // 1. Create or get project subfolder
      const projectFolderId = await getOrCreateFolder(drive, project.id, config.folderId);

      // 2. Upload index.html
      const htmlContent = fs.readFileSync(path.join(exportDir, "index.html"));
      await uploadOrUpdateFile(drive, "index.html", projectFolderId, htmlContent, "text/html");

      // 3. Upload clips
      const clipsDir = path.join(exportDir, "clips");
      if (fs.existsSync(clipsDir)) {
        const clipsFolderId = await getOrCreateFolder(drive, "clips", projectFolderId);
        for (const clip of fs.readdirSync(clipsDir)) {
          const clipContent = fs.readFileSync(path.join(clipsDir, clip));
          await uploadOrUpdateFile(drive, clip, clipsFolderId, clipContent, "video/mp4");
        }
      }

      // 4. Update repo-index.json in root folder
      let repoIndex: any[] = [];
      const existing = await drive.files.list({
        q: `name='repo-index.json' and '${config.folderId}' in parents and trashed=false`,
        fields: "files(id)",
      });
      if (existing.data.files.length > 0) {
        const fileId = existing.data.files[0].id;
        const content = await drive.files.get({ fileId, alt: "media" } as any);
        try { repoIndex = JSON.parse(content.data as string); } catch {}
      }
      const entry = {
        id: project.id, title: project.title, date: project.date,
        researcher: project.researcher, persona: project.persona, product: project.product,
        findingsHtml: `${project.id}/index.html`, publishedUrl: null,
      };
      const idx = repoIndex.findIndex(p => p.id === project.id);
      if (idx >= 0) repoIndex[idx] = entry; else repoIndex.push(entry);
      await uploadOrUpdateFile(drive, "repo-index.json", config.folderId, Buffer.from(JSON.stringify(repoIndex, null, 2)), "application/json");

      // 5. Upload viewer index.html to root folder
      await uploadOrUpdateFile(drive, "index.html", config.folderId, Buffer.from(generateViewerHtml()), "text/html");

      const folderUrl = `https://drive.google.com/drive/folders/${config.folderId}`;
      return { success: true, message: `Published to Google Drive folder`, url: folderUrl };
    } catch (err: any) {
      return { success: false, message: `Google Drive publish failed: ${err.message}` };
    }
  },
};
```

**Step 4: Run tests**

```bash
npm run test -- src/adapters/google-drive
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/google-drive/
git commit -m "feat: add Google Drive publishing adapter"
```

---

## Phase 5 — Register Adapters & Final Wiring

### Task 12: Register all adapters

**Files:**
- Modify: `src/lib/adapters.ts`

```typescript
// src/lib/adapters.ts
import { LocalFolderAdapter } from "@/adapters/local-folder";
import { SharePointOneDriveAdapter } from "@/adapters/sharepoint-onedrive";
import { GoogleDriveAdapter } from "@/adapters/google-drive";
import { PublishAdapter } from "@/adapters/types";

const ADAPTERS: Record<string, PublishAdapter> = {
  "local-folder": LocalFolderAdapter,
  "sharepoint-onedrive": SharePointOneDriveAdapter,
  "google-drive": GoogleDriveAdapter,
};

export function getAdapter(id: string): PublishAdapter | null {
  return ADAPTERS[id] || null;
}

export function listAdapters(): PublishAdapter[] {
  return Object.values(ADAPTERS);
}
```

**Commit:**

```bash
git add src/lib/adapters.ts
git commit -m "feat: register SharePoint-OneDrive and Google Drive adapters"
```

---

### Task 13: Run full test suite and fix any issues

```bash
npm run test
```

Expected: All tests pass. Fix any type errors or import issues before proceeding.

```bash
npm run lint
```

Fix any lint errors.

**Commit:**

```bash
git add -A
git commit -m "fix: resolve any test failures or lint errors after adapter integration"
```

---

## Setup Guides (include in PublishModal help text)

### SharePoint — How to get the synced folder path

1. Go to your SharePoint site → open the document library you want to publish to
2. Click **Sync** in the top toolbar (requires OneDrive client installed)
3. OneDrive opens a dialog and syncs the library to a local folder
4. The local path is typically `C:\Users\{you}\{Org Name}\{Library Name}` on Windows or `/Users/{you}/Library/CloudStorage/{Org}-{Library}` on Mac
5. Paste that path into the "Path to your synced SharePoint folder" field

### Google Drive — How to get OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Application type: **Web application**
3. Authorized redirect URIs: add `http://localhost:3000/api/auth/google/callback`
4. Copy **Client ID** and **Client Secret** into the adapter config
5. Enable the **Google Drive API** in the API library

> **Google Drive as a data source (future):** The current adapter uploads files to Drive. A future evolution could host the viewer on Vercel/GitHub Pages and have it fetch `repo-index.json` from a public Drive share link — effectively using Drive as a JSON database. This requires a server-side proxy (CORS) and is out of scope for this plan.

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/lib/viewer-template.ts` | Generates design-system-compliant viewer HTML |
| `src/lib/viewer-template.test.ts` | Tests for viewer template |
| `src/lib/token-store.ts` | In-memory OAuth token storage (Google only) |
| `src/lib/token-store.test.ts` | Tests for token store |
| `src/app/api/auth/[provider]/route.ts` | OAuth initiation endpoint (Google) |
| `src/app/api/auth/[provider]/callback/route.ts` | OAuth callback handler |
| `src/app/api/auth/[provider]/status/route.ts` | Token status + disconnect |
| `src/adapters/sharepoint-onedrive/index.ts` | SharePoint via OneDrive sync adapter |
| `src/adapters/sharepoint-onedrive/index.test.ts` | SharePoint adapter tests |
| `src/adapters/google-drive/index.ts` | Google Drive adapter |
| `src/adapters/google-drive/index.test.ts` | Google Drive adapter tests |

## Files Modified

| File | Change |
|------|--------|
| `src/lib/adapters.ts` | Register SharePoint-OneDrive + Google Drive |
| `src/adapters/types.ts` | Add `"oauth"` field type |
| `src/adapters/local-folder/index.ts` | Use `generateViewerHtml()` instead of copying `repo-viewer/` |
| `src/adapters/local-folder/index.test.ts` | Fix assertions for project subdirectory layout |
| `src/components/publish/PublishModal.tsx` | Add OAuth connect button for Google Drive |

## Files Deleted

| File | Reason |
|------|--------|
| `repo-viewer/index.html` | Replaced by `generateViewerHtml()` |
| `repo-viewer/viewer.js` | Inlined into template function |
| `repo-viewer/viewer.css` | Inlined into template function |
