# Report Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-first UX research Report Builder — a Next.js workspace with split-pane transcript/findings editor, AI IDE integration, tag board, export, and pluggable publishing.

**Architecture:** Next.js App Router in server mode (not static export). API routes handle file I/O, ffmpeg, and Claude CLI bridging. File watcher (chokidar + SSE) syncs UI with external IDE changes. Pluggable publish adapters for extensibility.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, react-resizable-panels, react-markdown, CodeMirror, chokidar, ffmpeg-static, vitest

**PRD:** `docs/plans/2026-03-07-report-builder-prd.md` — read this for full product spec, data models, and UI descriptions.

**Execution approach:** Subagent-driven — dispatch a fresh subagent per task, code review between tasks, stay in the same session.

---

## Phase 1: Foundation & Project Scaffolding

### Task 1.1: Clean Up Config and Dependencies

**Files:**
- Modify: `package.json`
- Modify: `next.config.mjs`
- Modify: `tsconfig.json`

**Step 1: Remove static export from Next.js config**

In `next.config.mjs`, remove `output: "export"` and the `basePath` for GitHub Actions. Keep `images: { unoptimized: true }` and the `transpilePackages` entry.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
};
export default nextConfig;
```

**Step 2: Update dependencies**

Run:
```bash
npm install react-resizable-panels react-markdown remark-gfm @uiw/react-codemirror @codemirror/lang-markdown chokidar
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 3: Remove unused dependencies**

```bash
npm uninstall next-mdx-remote remark remark-html pptxgenjs
```

**Step 4: Add vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 5: Add test script to package.json**

Add to scripts: `"test": "vitest run"`, `"test:watch": "vitest"`

**Step 6: Verify setup**

Run: `npx vitest run`
Expected: "No test files found" (not an error — confirms vitest works)

**Step 7: Commit**

```bash
git add -A && git commit -m "chore: update config for server mode, add new deps, remove unused"
```

---

### Task 1.2: Define Core Types

**Files:**
- Create: `src/types/index.ts` (overwrite existing)
- Test: `src/types/index.test.ts`

**Step 1: Write type definitions**

```typescript
// src/types/index.ts

export interface Session {
  id: string;
  participant: string;
  videoFile: string;
  transcriptFile: string;
}

export interface Project {
  id: string;
  title: string;
  date: string;
  researcher: string;
  persona: string;
  product?: string;
  status: ProjectStatus;
  researchPlan?: string;
  codebook: string | null;
  sessions: Session[];
  publishedUrl: string | null;
}

export type ProjectStatus =
  | "setup"
  | "findings"
  | "tagged"
  | "report"
  | "exported"
  | "published";

export interface CodebookTag {
  id: string;
  label: string;
  color: string;
  category: string;
}

export interface Codebook {
  tags: CodebookTag[];
  categories: string[];
}

export interface ParsedQuote {
  text: string;
  timestampDisplay: string;
  startSeconds: number;
  durationSeconds: number;
  sessionIndex: number;
  tags: string[];
  rawLine: string;
}

export interface TranscriptLine {
  sec: number;
  text: string;
}

export interface AppConfig {
  aiMode: "auto" | "claude-cli" | "copy-paste";
  adapters: Record<string, Record<string, unknown>>;
}

export interface PublishPayload {
  projectDir: string;
  project: Project;
  htmlPath: string;
  clipsDir: string;
  tagsHtmlPath?: string;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  message: string;
}

export interface AdapterConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "path" | "select";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface PublishAdapter {
  id: string;
  name: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload): Promise<PublishResult>;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: define core types for project, quotes, codebook, adapters"
```

---

### Task 1.3: Quote Parser

**Files:**
- Create: `src/lib/quote-parser.ts`
- Test: `src/lib/quote-parser.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/quote-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseQuote, parseQuotesFromMarkdown } from "./quote-parser";

describe("parseQuote", () => {
  it("parses full format with all fields", () => {
    const line = '- **"I kept looking for the Visa logo"** @ 01:30 (90s) | duration: 15s | session: 2 | tags: checkout, friction';
    const result = parseQuote(line);
    expect(result).toEqual({
      text: "I kept looking for the Visa logo",
      timestampDisplay: "01:30",
      startSeconds: 90,
      durationSeconds: 15,
      sessionIndex: 2,
      tags: ["checkout", "friction"],
      rawLine: line,
    });
  });

  it("parses minimal format (backwards-compatible)", () => {
    const line = '- **"The button was too small"** @ 03:45 (225s)';
    const result = parseQuote(line);
    expect(result).toEqual({
      text: "The button was too small",
      timestampDisplay: "03:45",
      startSeconds: 225,
      durationSeconds: 20,
      sessionIndex: 1,
      tags: [],
      rawLine: line,
    });
  });

  it("parses old format with seconds in parentheses as words", () => {
    const line = '- **"Old format quote"** @ 02:08 (128 seconds)';
    const result = parseQuote(line);
    expect(result?.startSeconds).toBe(128);
  });

  it("returns null for non-quote lines", () => {
    expect(parseQuote("## Theme 1: Payment")).toBeNull();
    expect(parseQuote("Some paragraph text")).toBeNull();
    expect(parseQuote("")).toBeNull();
  });
});

describe("parseQuotesFromMarkdown", () => {
  it("extracts all quotes from markdown content", () => {
    const md = `# Findings

## Theme 1: Payment Issues

Some context paragraph.

### Key quotes

- **"I kept looking for the Visa logo"** @ 01:30 (90s) | duration: 15s | session: 1 | tags: checkout
- **"The button was too small"** @ 03:45 (225s) | duration: 10s | session: 2

## Theme 2: Navigation

- **"I got lost in the menu"** @ 05:00 (300s)
`;
    const quotes = parseQuotesFromMarkdown(md);
    expect(quotes).toHaveLength(3);
    expect(quotes[0].text).toBe("I kept looking for the Visa logo");
    expect(quotes[1].text).toBe("The button was too small");
    expect(quotes[2].text).toBe("I got lost in the menu");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/quote-parser.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement**

```typescript
// src/lib/quote-parser.ts
import type { ParsedQuote } from "@/types";

const QUOTE_REGEX = /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)/;

export function parseQuote(line: string): ParsedQuote | null {
  const match = line.match(QUOTE_REGEX);
  if (!match) return null;

  const text = match[1];
  const timestampDisplay = match[2];
  const startSeconds = parseInt(match[3], 10);

  const durationMatch = line.match(/duration:\s*(\d+)s/);
  const durationSeconds = durationMatch ? parseInt(durationMatch[1], 10) : 20;

  const sessionMatch = line.match(/session:\s*(\d+)/);
  const sessionIndex = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;

  const tagsMatch = line.match(/tags:\s*(.+?)$/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    text,
    timestampDisplay,
    startSeconds,
    durationSeconds,
    sessionIndex,
    tags,
    rawLine: line,
  };
}

export function parseQuotesFromMarkdown(markdown: string): ParsedQuote[] {
  return markdown
    .split("\n")
    .map(parseQuote)
    .filter((q): q is ParsedQuote => q !== null);
}

export function formatQuoteAsMarkdown(
  text: string,
  startSeconds: number,
  durationSeconds: number,
  sessionIndex: number,
  tags: string[]
): string {
  const min = Math.floor(startSeconds / 60).toString().padStart(2, "0");
  const sec = (startSeconds % 60).toString().padStart(2, "0");
  let line = `- **"${text}"** @ ${min}:${sec} (${startSeconds}s) | duration: ${durationSeconds}s | session: ${sessionIndex}`;
  if (tags.length > 0) {
    line += ` | tags: ${tags.join(", ")}`;
  }
  return line;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/quote-parser.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add quote parser for findings/tags markdown format"
```

---

### Task 1.4: Transcript Parser (Update Existing)

**Files:**
- Modify: `src/lib/transcript.ts`
- Test: `src/lib/transcript.test.ts`

**Step 1: Write tests for existing + new functionality**

```typescript
// src/lib/transcript.test.ts
import { describe, it, expect } from "vitest";
import { parseTranscript, getTranscriptExcerpt } from "./transcript";

describe("parseTranscript", () => {
  it("parses [MM:SS] format", () => {
    const raw = "[00:15] Hello there\n[00:30] How are you";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ sec: 15, text: "Hello there" });
    expect(lines[1]).toEqual({ sec: 30, text: "How are you" });
  });

  it("merges continuation lines", () => {
    const raw = "[00:15] Hello there\ncontinuation text\n[00:30] Next";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0].text).toBe("Hello there continuation text");
  });

  it("handles empty input", () => {
    expect(parseTranscript("")).toEqual([]);
  });
});

describe("getTranscriptExcerpt", () => {
  it("extracts lines within range", () => {
    const lines = [
      { sec: 10, text: "A" },
      { sec: 20, text: "B" },
      { sec: 30, text: "C" },
      { sec: 40, text: "D" },
    ];
    expect(getTranscriptExcerpt(lines, 15, 35)).toBe("B C");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/transcript.test.ts`
Expected: PASS (existing code should pass these tests)

**Step 3: Commit**

```bash
git add -A && git commit -m "test: add tests for transcript parser"
```

---

### Task 1.5: Project Manager (CRUD)

**Files:**
- Create: `src/lib/projects.ts`
- Test: `src/lib/projects.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  getProjectsDir,
  listProjects,
  getProject,
  createProject,
  updateProject,
  slugify,
} from "./projects";

const TEST_DIR = path.join(process.cwd(), "content/projects/__test__");

describe("slugify", () => {
  it("converts title to kebab-case slug", () => {
    expect(slugify("Checkout Flow Usability")).toBe("checkout-flow-usability");
    expect(slugify("AI Chip War: GPU vs TPU")).toBe("ai-chip-war-gpu-vs-tpu");
    expect(slugify("  Spaces  Everywhere  ")).toBe("spaces-everywhere");
  });
});

describe("project CRUD", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("createProject creates folder structure and project.json", () => {
    const project = createProject(
      {
        title: "Test Study",
        researcher: "Jane",
        persona: "Customer",
        product: "Web App",
      },
      TEST_DIR
    );

    expect(project.id).toBe("test-study");
    expect(project.status).toBe("setup");

    const jsonPath = path.join(TEST_DIR, "test-study", "project.json");
    expect(fs.existsSync(jsonPath)).toBe(true);

    const dirs = ["transcripts", "videos", "clips"];
    for (const dir of dirs) {
      expect(fs.existsSync(path.join(TEST_DIR, "test-study", dir))).toBe(true);
    }
  });

  it("getProject reads project.json", () => {
    createProject(
      { title: "Read Test", researcher: "Jane", persona: "User" },
      TEST_DIR
    );
    const project = getProject("read-test", TEST_DIR);
    expect(project?.title).toBe("Read Test");
  });

  it("listProjects returns all projects sorted by date desc", () => {
    createProject(
      { title: "Older", researcher: "A", persona: "X", date: "2026-01-01" },
      TEST_DIR
    );
    createProject(
      { title: "Newer", researcher: "B", persona: "Y", date: "2026-03-01" },
      TEST_DIR
    );
    const projects = listProjects(TEST_DIR);
    expect(projects).toHaveLength(2);
    expect(projects[0].title).toBe("Newer");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/projects.test.ts`
Expected: FAIL

**Step 3: Implement**

```typescript
// src/lib/projects.ts
import fs from "fs";
import path from "path";
import type { Project } from "@/types";

const DEFAULT_PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export function getProjectsDir(): string {
  return DEFAULT_PROJECTS_DIR;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createProject(
  input: {
    title: string;
    researcher: string;
    persona: string;
    product?: string;
    researchPlan?: string;
    date?: string;
  },
  baseDir = DEFAULT_PROJECTS_DIR
): Project {
  const id = slugify(input.title);
  const projectDir = path.join(baseDir, id);

  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(projectDir, "transcripts"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "videos"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "clips"), { recursive: true });

  const project: Project = {
    id,
    title: input.title,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    researcher: input.researcher,
    persona: input.persona,
    product: input.product,
    status: "setup",
    researchPlan: input.researchPlan,
    codebook: null,
    sessions: [],
    publishedUrl: null,
  };

  fs.writeFileSync(
    path.join(projectDir, "project.json"),
    JSON.stringify(project, null, 2)
  );

  return project;
}

export function getProject(
  slug: string,
  baseDir = DEFAULT_PROJECTS_DIR
): Project | null {
  const jsonPath = path.join(baseDir, slug, "project.json");
  if (!fs.existsSync(jsonPath)) return null;
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

export function updateProject(
  slug: string,
  updates: Partial<Project>,
  baseDir = DEFAULT_PROJECTS_DIR
): Project | null {
  const project = getProject(slug, baseDir);
  if (!project) return null;
  const updated = { ...project, ...updates };
  const jsonPath = path.join(baseDir, slug, "project.json");
  fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2));
  return updated;
}

export function listProjects(baseDir = DEFAULT_PROJECTS_DIR): Project[] {
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const projects: Project[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const project = getProject(entry.name, baseDir);
    if (project) projects.push(project);
  }
  return projects.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/projects.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add project CRUD (create, read, update, list)"
```

---

### Task 1.6: Global Codebook

**Files:**
- Create: `data/global-codebook.json`
- Create: `src/lib/codebook.ts`
- Test: `src/lib/codebook.test.ts`

**Step 1: Create default global codebook**

```json
{
  "tags": [
    { "id": "usability", "label": "Usability Issue", "color": "#EF4444", "category": "Pain Point" },
    { "id": "delight", "label": "Delight Moment", "color": "#10B981", "category": "Positive" },
    { "id": "confusion", "label": "Confusion", "color": "#F59E0B", "category": "Pain Point" },
    { "id": "feature-req", "label": "Feature Request", "color": "#3B82F6", "category": "Feedback" },
    { "id": "workflow", "label": "Workflow Pattern", "color": "#8B5CF6", "category": "Behavior" },
    { "id": "onboarding", "label": "Onboarding", "color": "#06B6D4", "category": "Experience" },
    { "id": "friction", "label": "Friction Point", "color": "#F97316", "category": "Pain Point" },
    { "id": "mental-model", "label": "Mental Model", "color": "#EC4899", "category": "Behavior" }
  ],
  "categories": ["Pain Point", "Positive", "Feedback", "Behavior", "Experience"]
}
```

**Step 2: Write codebook merge logic with tests**

```typescript
// src/lib/codebook.test.ts
import { describe, it, expect } from "vitest";
import { mergeCodebooks, getTagById } from "./codebook";
import type { Codebook } from "@/types";

describe("mergeCodebooks", () => {
  const global: Codebook = {
    tags: [
      { id: "usability", label: "Usability Issue", color: "#EF4444", category: "Pain Point" },
    ],
    categories: ["Pain Point"],
  };

  it("returns global when no custom", () => {
    expect(mergeCodebooks(global, null)).toEqual(global);
  });

  it("merges custom tags, custom wins on conflict", () => {
    const custom: Codebook = {
      tags: [
        { id: "usability", label: "UX Problem", color: "#FF0000", category: "Pain Point" },
        { id: "custom-tag", label: "Custom", color: "#000", category: "Custom" },
      ],
      categories: ["Custom"],
    };
    const merged = mergeCodebooks(global, custom);
    expect(merged.tags).toHaveLength(2);
    expect(merged.tags.find((t) => t.id === "usability")?.label).toBe("UX Problem");
    expect(merged.categories).toContain("Custom");
    expect(merged.categories).toContain("Pain Point");
  });
});

describe("getTagById", () => {
  it("finds tag by id", () => {
    const codebook: Codebook = {
      tags: [{ id: "usability", label: "Usability", color: "#F00", category: "X" }],
      categories: ["X"],
    };
    expect(getTagById(codebook, "usability")?.label).toBe("Usability");
    expect(getTagById(codebook, "missing")).toBeNull();
  });
});
```

**Step 3: Implement**

```typescript
// src/lib/codebook.ts
import type { Codebook, CodebookTag } from "@/types";

export function mergeCodebooks(
  global: Codebook,
  custom: Codebook | null
): Codebook {
  if (!custom) return global;

  const tagMap = new Map<string, CodebookTag>();
  for (const tag of global.tags) tagMap.set(tag.id, tag);
  for (const tag of custom.tags) tagMap.set(tag.id, tag);

  const categories = [
    ...new Set([...global.categories, ...custom.categories]),
  ];

  return { tags: Array.from(tagMap.values()), categories };
}

export function getTagById(
  codebook: Codebook,
  id: string
): CodebookTag | null {
  return codebook.tags.find((t) => t.id === id) ?? null;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/codebook.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add global codebook and merge logic"
```

---

### Task 1.7: API Route — File Operations

**Files:**
- Create: `src/app/api/files/route.ts`
- Create: `src/app/api/files/watch/route.ts`
- Create: `src/lib/file-watcher.ts`

**Step 1: Implement file read/write API**

```typescript
// src/app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

function resolveProjectPath(slug: string, filePath: string): string | null {
  const resolved = path.resolve(PROJECTS_DIR, slug, filePath);
  if (!resolved.startsWith(path.resolve(PROJECTS_DIR, slug))) return null;
  return resolved;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const file = req.nextUrl.searchParams.get("file");
  if (!slug || !file) {
    return NextResponse.json({ error: "slug and file required" }, { status: 400 });
  }
  const filePath = resolveProjectPath(slug, file);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: null });
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, file, content } = body;
  if (!slug || !file || content === undefined) {
    return NextResponse.json({ error: "slug, file, and content required" }, { status: 400 });
  }
  const filePath = resolveProjectPath(slug, file);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return NextResponse.json({ success: true });
}
```

**Step 2: Implement file watcher with SSE**

```typescript
// src/lib/file-watcher.ts
import chokidar from "chokidar";
import path from "path";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

type FileChangeCallback = (data: { slug: string; file: string; event: string }) => void;

const listeners = new Set<FileChangeCallback>();
let watcher: chokidar.FSWatcher | null = null;

export function startWatcher() {
  if (watcher) return;
  watcher = chokidar.watch(PROJECTS_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("change", (filePath) => {
    const rel = path.relative(PROJECTS_DIR, filePath);
    const parts = rel.split(path.sep);
    if (parts.length < 2) return;
    const slug = parts[0];
    const file = parts.slice(1).join("/");
    if (!/\.(md|mdx|json)$/.test(file)) return;
    for (const cb of listeners) {
      cb({ slug, file, event: "change" });
    }
  });
}

export function addListener(cb: FileChangeCallback) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
```

```typescript
// src/app/api/files/watch/route.ts
import { startWatcher, addListener } from "@/lib/file-watcher";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return new Response("slug required", { status: 400 });
  }

  startWatcher();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const remove = addListener((data) => {
        if (data.slug !== slug) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      });

      req.signal.addEventListener("abort", () => {
        remove();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add file read/write API and SSE file watcher"
```

---

### Task 1.8: Project Selector Page

**Files:**
- Create: `src/app/page.tsx` (overwrite)
- Create: `src/components/projects/ProjectCard.tsx`
- Create: `src/components/projects/NewProjectModal.tsx`
- Create: `src/app/api/projects/route.ts`

**Step 1: Build the API route for projects**

```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/projects";

export async function GET() {
  const projects = listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = createProject(body);
  return NextResponse.json(project);
}
```

**Step 2: Build ProjectCard component**

The card displays project title, date, persona, product, status badge, researcher, and session count. Clicking navigates to `/builder/{slug}/findings`. See PRD Section 6.1 for field layout.

**Step 3: Build NewProjectModal component**

Modal form with fields: Title, Researcher, Persona, Product (optional), Research Plan (optional), Codebook selector. On submit, POST to `/api/projects`, then navigate to the new project.

**Step 4: Build the home page**

The page fetches projects from `/api/projects`, renders a grid of `ProjectCard` components with a `NewProjectModal` trigger card at the start.

**Step 5: Verify**

Run: `npm run dev`
Open: `http://localhost:3000`
Expected: Project selector page with "+ New Project" card. Creating a project should create the folder structure and redirect.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add project selector home page with create flow"
```

---

### Task 1.9: Clean Up Old Pages and Components

**Files:**
- Delete: `src/app/library/` (entire directory)
- Delete: `src/app/reports/` (entire directory)
- Delete: `src/app/(dashboard)/` (entire directory)
- Delete: `src/components/Layout.tsx`
- Delete: `src/components/ShareReport.tsx`
- Delete: `src/components/Slide.tsx`
- Delete: `src/context/TranscriptContext.tsx`
- Delete: `src/lib/db.ts`
- Delete: `data/research-index.json`
- Move: `src/components/Callout.tsx` → `src/components/shared/Callout.tsx`
- Move: `src/components/Divider.tsx` → `src/components/shared/Divider.tsx`
- Move: `src/components/Tooltip.tsx` → `src/components/shared/Tooltip.tsx`
- Move: `src/components/Clip.tsx` → `src/components/clips/Clip.tsx`
- Modify: `src/app/layout.tsx` (simplify — remove old Layout wrapper)

**Step 1: Remove old files, move reusable components**

Remove all files listed above. Move Callout, Divider, Tooltip to `src/components/shared/`. Move Clip to `src/components/clips/`. Update the Clip component to remove the `useTranscript()` context hook — accept `transcriptLines` and `vttUrl` as props instead.

**Step 2: Simplify root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Report Builder",
  description: "Local-first UX research analysis and reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: remove old viewer pages, reorganize components"
```

---

## Phase 2: Core Workspace — Findings Editor

### Task 2.1: Builder Layout Shell

**Files:**
- Create: `src/app/builder/[slug]/layout.tsx`
- Create: `src/components/builder/WorkspaceNav.tsx`

**Step 1: Create workspace layout**

The layout has a top nav bar and renders children below it. The nav shows:
- Logo + "Report Builder" (links to `/`)
- Project name (from `project.json`, loaded via API)
- Tab links: Findings | Tags | Report | Export
- Active tab highlighted based on current route

```typescript
// src/app/builder/[slug]/layout.tsx
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";

export default function BuilderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="flex h-screen flex-col">
      <WorkspaceNav slug={params.slug} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
```

**Step 2: Create WorkspaceNav**

Client component with tab links using `next/link`. Active tab detected via `usePathname()`. Tabs: `findings`, `tags`, `report`, `export`.

**Step 3: Redirect default route**

```typescript
// src/app/builder/[slug]/page.tsx
import { redirect } from "next/navigation";
export default function BuilderPage({ params }: { params: { slug: string } }) {
  redirect(`/builder/${params.slug}/findings`);
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add builder workspace layout with tab navigation"
```

---

### Task 2.2: Video Player Component

**Files:**
- Create: `src/components/builder/VideoPlayer.tsx`

**Step 1: Build video player**

Client component wrapping `<video>`:
- Props: `sessions: Session[]`, `activeSessionIndex: number`, `onSessionChange: (index) => void`
- Session selector dropdown above the video
- `ref` exposed for external seek control (via `useImperativeHandle` or callback ref)
- `seekTo(seconds)` method
- `playRange(start, end)` method — plays from `start`, pauses at `end`
- Sticky positioning (parent handles this via CSS)
- `preload="metadata"`

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add VideoPlayer component with session switching and seek"
```

---

### Task 2.3: Transcript Viewer Component

**Files:**
- Create: `src/components/builder/TranscriptViewer.tsx`
- Create: `src/components/builder/TranscriptLine.tsx`
- Create: `src/components/builder/QuoteCard.tsx`

**Step 1: Build QuoteCard**

Props: `quote: ParsedQuote`, `codebook: Codebook`, `onClick`, `onDoubleClick`
- Renders quote text, tag dots (colored circles from codebook)
- Single click calls `onClick` (parent handles video playback)
- Double click calls `onDoubleClick` (parent opens edit modal)
- Hover expands tag dots to labeled pills
- Draggable (`draggable="true"`, sets `dataTransfer` with formatted markdown string from `formatQuoteAsMarkdown`)
- Visual styling: slightly raised card with left border accent

**Step 2: Build TranscriptLine**

Props: `line: TranscriptLine`, `isActive: boolean`, `onClick`
- Renders `[MM:SS] text`
- `isActive` highlights the line (current playback position)
- Click calls `onClick` (parent seeks video)

**Step 3: Build TranscriptViewer**

Props: `lines: TranscriptLine[]`, `quotes: ParsedQuote[]`, `codebook: Codebook`, `activeSecond: number`, `onTimestampClick`, `onQuoteClick`, `onQuoteDoubleClick`, `onTextSelect`

- Renders transcript lines with quote cards interspersed at their timestamp positions
- Quote cards replace the transcript lines they cover (from `startSeconds` to `startSeconds + durationSeconds`)
- Handles text selection: when user selects text across lines, calculates start/end timestamps and calls `onTextSelect({ text, startSec, endSec })`
- Hidden quotes (from double-click → hide) are tracked in local state

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add TranscriptViewer with QuoteCard and text selection"
```

---

### Task 2.4: Clip Creation Flow

**Files:**
- Create: `src/components/builder/ClipCreator.tsx`

**Step 1: Build clip creation UI**

When `onTextSelect` fires from TranscriptViewer:
- Show a floating "+ Clip" button near the selection (absolute positioned)
- Clicking it creates a new `ParsedQuote` from the selection data
- New quote appears as a QuoteCard in the transcript
- The QuoteCard is draggable — user drags it to the right pane

The component manages pending clips (created but not yet in findings.md) in local state. Once dragged to the editor and dropped, the clip is inserted into the markdown.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add clip creation flow with floating button"
```

---

### Task 2.5: Markdown Editor (Raw View)

**Files:**
- Create: `src/components/builder/MarkdownEditor.tsx`

**Step 1: Build CodeMirror-based editor**

Props: `content: string`, `onChange: (content: string) => void`, `onSave: () => void`

- Uses `@uiw/react-codemirror` with `@codemirror/lang-markdown`
- Line numbers enabled
- Ctrl+S / Cmd+S triggers `onSave`
- Auto-save: debounced `onChange` with 2-second delay after last keystroke
- Drop target: accepts dragged QuoteCards, inserts formatted markdown at drop position
  - `onDrop` handler reads `dataTransfer.getData("text/plain")` (the formatted quote markdown)
  - Inserts at the line closest to the drop Y position

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add CodeMirror markdown editor with drag-and-drop"
```

---

### Task 2.6: Markdown Renderer (Formatted View)

**Files:**
- Create: `src/components/builder/MarkdownRenderer.tsx`

**Step 1: Build rendered markdown view**

Props: `content: string`, `codebook: Codebook`, `onQuoteClick`, `onQuoteDoubleClick`

- Uses `react-markdown` with `remark-gfm` for rendering
- Custom renderer for list items: detects quote format via regex, renders as `QuoteCard` instead of plain `<li>`
- Non-quote content renders with Tailwind typography classes
- Read-only view (no editing)

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add markdown renderer with inline QuoteCard rendering"
```

---

### Task 2.7: Findings Page — Assemble the Workspace

**Files:**
- Create: `src/app/builder/[slug]/findings/page.tsx`
- Create: `src/hooks/useFileContent.ts`
- Create: `src/hooks/useFileWatcher.ts`

**Step 1: Build file content hook**

```typescript
// src/hooks/useFileContent.ts
import { useState, useCallback, useEffect } from "react";

export function useFileContent(slug: string, file: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    const res = await fetch(`/api/files?slug=${slug}&file=${file}`);
    const data = await res.json();
    setContent(data.content);
    setLoading(false);
  }, [slug, file]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const saveContent = useCallback(async (newContent: string) => {
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, file, content: newContent }),
    });
    setContent(newContent);
  }, [slug, file]);

  return { content, loading, refetch: fetchContent, saveContent };
}
```

**Step 2: Build file watcher hook**

```typescript
// src/hooks/useFileWatcher.ts
import { useEffect } from "react";

export function useFileWatcher(
  slug: string,
  onFileChange: (file: string) => void
) {
  useEffect(() => {
    const eventSource = new EventSource(`/api/files/watch?slug=${slug}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onFileChange(data.file);
    };
    return () => eventSource.close();
  }, [slug, onFileChange]);
}
```

**Step 3: Build findings page**

The findings page assembles all components:

```
┌─ ResizablePanelGroup ──────────────────────────────────────┐
│  ┌─ Panel (left) ────────┐  ┌─ Panel (right) ───────────┐ │
│  │  VideoPlayer (sticky) │  │  Toggle: Formatted | Raw   │ │
│  │  TranscriptViewer     │  │  MarkdownRenderer (if fmt) │ │
│  │  + ClipCreator        │  │  MarkdownEditor (if raw)   │ │
│  └───────────────────────┘  └────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Fetches `findings.md` and transcript files via `useFileContent`
- Uses `useFileWatcher` to auto-refetch when files change
- Parses quotes from markdown content via `parseQuotesFromMarkdown`
- Passes quotes to TranscriptViewer for inline rendering
- Video player controlled by quote clicks and transcript timestamp clicks
- Manual refresh button in the right pane header as fallback

**Step 4: Verify**

Run: `npm run dev`
Create a test project, drop a transcript and video file in, create a `findings.md` with some quotes.
Expected: Split-pane workspace, video plays on timestamp click, quotes render as cards, drag-and-drop works.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: assemble findings editor workspace with split pane"
```

---

### Task 2.8: Quote Edit Modal

**Files:**
- Create: `src/components/builder/QuoteEditModal.tsx`

**Step 1: Build edit modal**

Triggered by double-clicking a QuoteCard. Shows:
- Tag editor: up to 3 tags, autocomplete from codebook
- Duration editor: number input in seconds
- "Hide from transcript" button with explanation text
- "Close" button

Changes update the quote in the markdown file (find the matching rawLine, replace with updated version).

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add quote edit modal for tags, duration, and hide"
```

---

## Phase 3: AI Integration

### Task 3.1: Claude CLI Detection

**Files:**
- Create: `src/lib/ai-bridge.ts`
- Create: `src/app/api/ai/route.ts`
- Create: `src/app/api/ai/detect/route.ts`

**Step 1: Implement AI bridge**

```typescript
// src/lib/ai-bridge.ts
import { execSync, spawn } from "child_process";

export function detectClaudeCli(): boolean {
  try {
    execSync("claude --version", { timeout: 5000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function runClaudePrompt(
  prompt: string,
  workingDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", prompt, "--output-format", "text"], {
      cwd: workingDir,
      shell: true,
    });
    let output = "";
    let error = "";
    child.stdout.on("data", (data) => { output += data.toString(); });
    child.stderr.on("data", (data) => { error += data.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(error || `Exit code ${code}`));
    });
  });
}
```

**Step 2: API routes**

`GET /api/ai/detect` → returns `{ available: boolean }`
`POST /api/ai/run` → accepts `{ prompt, projectSlug }`, runs Claude CLI, returns `{ output }`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Claude CLI detection and prompt execution bridge"
```

---

### Task 3.2: Prompt Modal Component

**Files:**
- Create: `src/components/builder/PromptModal.tsx`

**Step 1: Build prompt modal**

Props: `prompt: string`, `claudeAvailable: boolean`, `projectSlug: string`, `onClose`

- If Claude CLI available: "Run with AI" primary button + "Copy Prompt" secondary
- If not available: "Copy Prompt" primary button only
- Shows the prompt text in a scrollable code block
- "Run with AI" calls `/api/ai/run`, shows a spinner, then closes on completion
- "Copy Prompt" copies to clipboard, shows toast "Prompt copied! Paste into Cursor and run."

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add PromptModal with Run/Copy AI prompt actions"
```

---

### Task 3.3: Prompt Templates

**Files:**
- Create: `src/lib/prompts.ts`

**Step 1: Implement prompt generators**

Functions that build context-aware prompts:
- `buildAnalyzeTranscriptsPrompt(project, codebook)` — for initial findings generation
- `buildAddThemePrompt(project, themeName)` — for adding a specific theme
- `buildGenerateTagsPrompt(project, codebook, source: "findings" | "transcripts")` — for tag board
- `buildGenerateReportPrompt(project, style: "blog" | "slides")` — for report generation

Each function returns a string that includes file paths, format instructions, and codebook context.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add AI prompt templates for analysis, tagging, and report generation"
```

---

## Phase 4: Tag Board

### Task 4.1: Tags Page

**Files:**
- Create: `src/app/builder/[slug]/tags/page.tsx`

**Step 1: Build tags page**

Same split-pane layout as findings, but reads/writes `tags.md` instead of `findings.md`.

On first visit (tags.md doesn't exist): show the tag generation modal with two prompt options (parse findings → tags, or re-read transcripts → tags). See PRD Section 9.2.

Tag-specific interactions on QuoteCards (colored dots, hover expansion) work the same as in findings view.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add tag board view with tag generation modal"
```

---

### Task 4.2: Codebook Editor

**Files:**
- Create: `src/components/builder/CodebookEditor.tsx`
- Create: `src/app/api/codebook/route.ts`

**Step 1: Build codebook editor**

Accessible from a gear icon in the tags view header. Shows:
- List of all tags (global + custom) with color swatches
- Add tag: label, color picker, category dropdown
- Edit tag: inline editing
- Delete tag (custom only, can't delete global)
- Save updates to the codebook file

**Step 2: API route for codebook CRUD**

`GET /api/codebook?project=slug` — returns merged codebook
`POST /api/codebook` — saves to global or project codebook

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add codebook editor with tag CRUD"
```

---

## Phase 5: Report Generation & Preview

### Task 5.1: Report Page

**Files:**
- Create: `src/app/builder/[slug]/report/page.tsx`
- Create: `src/components/builder/ReportPreview.tsx`

**Step 1: Build report page**

If `report.mdx` doesn't exist:
- Show "Generate Report" button with style selector (Blog / Slides)
- Button opens PromptModal with `buildGenerateReportPrompt`

If `report.mdx` exists:
- Render the MDX content with full component support
- Use `react-markdown` with custom component mapping for Clip, Callout, Divider, Tooltip
- "Regenerate" button to re-run generation
- Raw/Formatted toggle for editing

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add report generation and preview page"
```

---

## Phase 6: Export

### Task 6.1: Export Page

**Files:**
- Create: `src/app/builder/[slug]/export/page.tsx`
- Create: `src/app/api/slice/route.ts`
- Create: `src/app/api/export-html/route.ts`

**Step 1: Build slice API route**

Adapts existing `slice-clips.js` logic:
- Reads `report.mdx` from the project folder
- Extracts Clip components with start/duration
- Runs ffmpeg to slice each clip from the session video
- Saves to `content/projects/{slug}/clips/`
- Returns progress updates via SSE or polling

**Step 2: Build HTML export API route**

- Reads `report.mdx`, renders to HTML with embedded component styles
- Replaces Clip video sources with relative paths to sliced clips
- Generates a self-contained HTML file
- Returns the file path for download

**Step 3: Build export page**

Three download options as described in PRD Section 11.1:
1. "Download HTML (with clips)" — triggers slice → export → zip download
2. "Download HTML (timestamps only)" — instant HTML generation
3. "Download Raw Markdown" — direct download of findings.md

Progress bar for slicing. Download button when ready.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add export page with clip slicing and HTML export"
```

---

## Phase 7: Publishing — Pluggable Adapters

### Task 7.1: Adapter System

**Files:**
- Create: `adapters/types.ts`
- Create: `adapters/local-folder/index.ts`
- Create: `src/lib/adapters.ts`
- Create: `src/app/api/publish/route.ts`

**Step 1: Define adapter interface**

Copy the `PublishAdapter` interface from PRD Section 12.1 into `adapters/types.ts`.

**Step 2: Implement local-folder adapter**

```typescript
// adapters/local-folder/index.ts
import type { PublishAdapter, PublishPayload, PublishResult } from "../types";
import fs from "fs";
import path from "path";

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

const adapter: PublishAdapter = {
  id: "local-folder",
  name: "Local Folder",
  icon: "folder",
  configSchema: [
    {
      key: "outputPath",
      label: "Output folder path",
      type: "path",
      required: true,
      placeholder: "/path/to/shared/folder",
    },
  ],
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const config = payload.project as unknown as Record<string, unknown>;
    const outputPath = config.outputPath as string;
    if (!outputPath) {
      return { success: false, message: "Output path not configured" };
    }
    const destDir = path.join(outputPath, payload.project.id);
    fs.mkdirSync(destDir, { recursive: true });

    if (fs.existsSync(payload.htmlPath)) {
      fs.copyFileSync(payload.htmlPath, path.join(destDir, "report.html"));
    }
    if (fs.existsSync(payload.clipsDir)) {
      copyDirSync(payload.clipsDir, path.join(destDir, "clips"));
    }
    if (payload.tagsHtmlPath && fs.existsSync(payload.tagsHtmlPath)) {
      fs.copyFileSync(payload.tagsHtmlPath, path.join(destDir, "tags.html"));
    }

    return { success: true, url: destDir, message: `Published to ${destDir}` };
  },
};

export default adapter;
```

**Step 3: Implement adapter discovery**

```typescript
// src/lib/adapters.ts
import path from "path";
import fs from "fs";
import type { PublishAdapter } from "../../adapters/types";

const ADAPTERS_DIR = path.join(process.cwd(), "adapters");

export async function discoverAdapters(): Promise<PublishAdapter[]> {
  const adapters: PublishAdapter[] = [];
  if (!fs.existsSync(ADAPTERS_DIR)) return adapters;

  for (const entry of fs.readdirSync(ADAPTERS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(ADAPTERS_DIR, entry.name, "index.ts");
    if (!fs.existsSync(indexPath)) continue;
    try {
      const mod = await import(indexPath);
      if (mod.default?.id) adapters.push(mod.default);
    } catch {
      // skip invalid adapters
    }
  }
  return adapters;
}
```

**Step 4: Publish API route and UI in export page**

Add "Publish" section below download options in the export page. Shows discovered adapters as cards. Each card expands to show config form (from `configSchema`). "Publish" button triggers `/api/publish`.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add pluggable publish adapter system with local-folder adapter"
```

---

### Task 7.2: Repo Index Update

**Files:**
- Modify: `adapters/local-folder/index.ts`

**Step 1: Update local-folder adapter to maintain repo-index.json**

After publishing, the adapter appends/updates an entry in `repo-index.json` at the output folder root. See PRD Section 13.2 for the schema.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: local-folder adapter maintains repo-index.json"
```

---

## Phase 8: Report Repo Viewer (Standalone)

### Task 8.1: Standalone Viewer

**Files:**
- Create: `repo-viewer/index.html`
- Create: `repo-viewer/viewer.js`
- Create: `repo-viewer/viewer.css`

**Step 1: Build self-contained HTML viewer**

A single HTML file (or HTML + JS + CSS) that:
- Reads `repo-index.json` from the same directory via `fetch("./repo-index.json")`
- Renders project cards in a grid
- Left sidebar with filters: Product, Persona, Researcher (checkboxes, dynamically populated from data)
- Search bar filters by title
- Each card shows: title, date, researcher, persona, product badges
- Three link buttons: [Findings HTML] [Tag Board HTML] [Published Report]
- Clean, modern design with vanilla CSS (no framework)
- Works when opened from file:// or served via HTTP

**Step 2: Test locally**

Create a sample `repo-index.json` in `repo-viewer/`, open `index.html` in a browser (serve via `npx serve repo-viewer`).

Expected: Dashboard renders with sample projects, search and filters work.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add standalone Report Repo Viewer HTML dashboard"
```

---

### Task 8.2: Auto-Copy Viewer on Publish

**Files:**
- Modify: `adapters/local-folder/index.ts`

**Step 1: Copy viewer files on first publish**

When the local-folder adapter publishes and `repo-viewer/index.html` exists in the project root, copy `index.html`, `viewer.js`, and `viewer.css` to the output folder root (if they don't already exist there). This way the viewer is always available alongside published reports.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: auto-copy repo viewer on first local-folder publish"
```

---

## Phase 9: Cursor Skills Update

### Task 9.1: Update research-analysis Skill

**Files:**
- Modify: `.cursor/skills/research-analysis/SKILL.md`

**Step 1: Update file paths and quote format**

Update the skill to:
- Read transcripts from `content/projects/{slug}/transcripts/`
- Write findings to `content/projects/{slug}/findings.md`
- Use extended quote format: `| duration: | session: | tags:`
- Read/write `project.json` instead of `research-index.json`
- Update file locations table

**Step 2: Commit**

```bash
git add -A && git commit -m "docs: update research-analysis skill for new project structure"
```

---

### Task 9.2: Update report-publication Skill

**Files:**
- Modify: `.cursor/skills/report-publication/SKILL.md`

**Step 1: Update file paths and workflow**

Update the skill to:
- Read findings from `content/projects/{slug}/findings.md`
- Write report to `content/projects/{slug}/report.mdx`
- Slice clips to `content/projects/{slug}/clips/`
- Video sources from `content/projects/{slug}/videos/`
- Update script paths and commands
- Remove references to `research-index.json`

**Step 2: Commit**

```bash
git add -A && git commit -m "docs: update report-publication skill for new project structure"
```

---

## Milestone Checklist

After completing all phases, verify:

- [ ] `npm run dev` starts without errors
- [ ] Home page lists projects, creating a new project works
- [ ] Builder workspace opens with split-pane layout
- [ ] Video plays on transcript timestamp click
- [ ] Quote cards render inline in transcript from findings.md
- [ ] Text selection → "+ Clip" → drag to raw editor → inserts markdown
- [ ] File watcher auto-updates UI when findings.md is modified externally
- [ ] Claude CLI detection works (if CLI is installed)
- [ ] Copy Prompt fallback works
- [ ] Tag board generates and displays tags.md
- [ ] Report preview renders MDX with Clip/Callout/Divider components
- [ ] HTML export slices clips via ffmpeg and downloads zip
- [ ] Local-folder adapter publishes to configured path
- [ ] Repo viewer HTML loads repo-index.json and displays projects
- [ ] All tests pass: `npx vitest run`
