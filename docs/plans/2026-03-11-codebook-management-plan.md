# Codebook Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add global codebook editing with cascade rename/delete, CSV import on new project creation, and split SKILL.md step 4 into findings vs tags branches.

**Architecture:** Three independent workstreams — (1) two new API routes for global codebook writes and cascade patching, (2) CodebookEditor gains a Global tab using those routes with dry-run confirmation, (3) NewProjectModal becomes multi-step with CSV parse + preview. SKILL.md and prompts.ts get targeted text edits.

**Tech Stack:** Next.js App Router API routes, TypeScript, React, Tailwind CSS, Vitest

---

## Task 1: Add TAG_COLORS palette to color-themes.ts

**Files:**
- Modify: `src/lib/color-themes.ts`
- Test: `src/lib/color-themes.test.ts`

`color-themes.ts` currently only holds report color themes (burnt-orange, deep-purple, etc.). We need a separate fixed palette for tag colors and a utility to auto-assign them.

**Step 1: Write failing tests**

Open `src/lib/color-themes.test.ts` and add:

```typescript
import { describe, it, expect } from "vitest";
import { TAG_COLORS, assignTagColor } from "./color-themes";

describe("TAG_COLORS", () => {
  it("exports exactly 12 hex colors", () => {
    expect(TAG_COLORS).toHaveLength(12);
    TAG_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe("assignTagColor", () => {
  it("returns first color when none are in use", () => {
    expect(assignTagColor([])).toBe(TAG_COLORS[0]);
  });

  it("skips colors already in use", () => {
    const inUse = [TAG_COLORS[0], TAG_COLORS[1]];
    expect(assignTagColor(inUse)).toBe(TAG_COLORS[2]);
  });

  it("wraps around if all colors used", () => {
    expect(assignTagColor(TAG_COLORS)).toBe(TAG_COLORS[0]);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- color-themes
```

Expected: FAIL — `TAG_COLORS` not exported

**Step 3: Add TAG_COLORS and assignTagColor to color-themes.ts**

Append to the bottom of `src/lib/color-themes.ts`:

```typescript
export const TAG_COLORS: string[] = [
  "#f59f0a", "#3b82f6", "#10b981", "#ef4444",
  "#8b5cf6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#f43f5e",
];

/**
 * Returns the first TAG_COLORS entry not already used.
 * Falls back to the first color if all are taken.
 */
export function assignTagColor(inUseColors: string[]): string {
  const used = new Set(inUseColors.map((c) => c.toLowerCase()));
  return (
    TAG_COLORS.find((c) => !used.has(c.toLowerCase())) ?? TAG_COLORS[0]
  );
}
```

**Step 4: Run tests**

```bash
npm run test -- color-themes
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/color-themes.ts src/lib/color-themes.test.ts
git commit -m "feat: add TAG_COLORS palette and assignTagColor utility"
```

---

## Task 2: Add slugify + collision-safe ID generator to codebook lib

**Files:**
- Create: `src/lib/codebook-utils.ts`
- Test: `src/lib/codebook-utils.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { slugifyLabel, generateTagId } from "./codebook-utils";

describe("slugifyLabel", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyLabel("UI Friction")).toBe("ui-friction");
  });

  it("strips special characters", () => {
    expect(slugifyLabel("Pain Point!")).toBe("pain-point");
  });

  it("collapses multiple hyphens", () => {
    expect(slugifyLabel("A  B")).toBe("a-b");
  });
});

describe("generateTagId", () => {
  it("returns slug when no collision", () => {
    expect(generateTagId("UI Friction", [])).toBe("ui-friction");
  });

  it("appends -2 on first collision", () => {
    expect(generateTagId("UI Friction", ["ui-friction"])).toBe("ui-friction-2");
  });

  it("appends -3 on second collision", () => {
    expect(
      generateTagId("UI Friction", ["ui-friction", "ui-friction-2"])
    ).toBe("ui-friction-3");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm run test -- codebook-utils
```

**Step 3: Create codebook-utils.ts**

```typescript
export function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateTagId(label: string, existingIds: string[]): string {
  const base = slugifyLabel(label);
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
```

**Step 4: Run tests**

```bash
npm run test -- codebook-utils
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/codebook-utils.ts src/lib/codebook-utils.test.ts
git commit -m "feat: add slugifyLabel and generateTagId utilities"
```

---

## Task 3: Add PUT handler to /api/codebook/global

**Files:**
- Modify: `src/app/api/codebook/global/route.ts`
- Test: manual curl (no unit test needed for thin route handler)

The existing file at `src/app/api/codebook/global/route.ts` has only a GET handler (~20 lines). We add a PUT handler that validates and writes `data/global-codebook.json`.

**Step 1: Read the existing route**

Open `src/app/api/codebook/global/route.ts`. It reads from `process.cwd() + "/data/global-codebook.json"`.

**Step 2: Add the PUT handler**

Append to the file after the existing GET export:

```typescript
import { writeFile } from "fs/promises";
import path from "path";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (
      !body ||
      !Array.isArray(body.tags) ||
      !Array.isArray(body.categories)
    ) {
      return Response.json(
        { error: "Invalid codebook format" },
        { status: 400 }
      );
    }
    const filePath = path.join(process.cwd(), "data", "global-codebook.json");
    await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save codebook" }, { status: 500 });
  }
}
```

**Step 3: Start dev server and test manually**

```bash
curl -X PUT http://localhost:3000/api/codebook/global \
  -H "Content-Type: application/json" \
  -d '{"tags":[],"categories":[]}'
```

Expected: `{"ok":true}`

**Step 4: Commit**

```bash
git add src/app/api/codebook/global/route.ts
git commit -m "feat: add PUT handler for global codebook"
```

---

## Task 4: Create /api/codebook/cascade route

**Files:**
- Create: `src/app/api/codebook/cascade/route.ts`
- Test: `src/app/api/codebook/cascade/route.test.ts`

This route scans all `content/projects/*/tags.md` and `findings.md`, patches `tags:` lines to rename or remove a tag ID, and returns affected file/quote counts. Supports `dryRun: true` to preview without writing.

**Step 1: Write failing tests**

Create `src/app/api/codebook/cascade/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import path from "path";

const TMP = path.join(process.cwd(), "content", "projects", "__cascade_test__");

function makeProject(name: string, content: string) {
  const dir = path.join(TMP, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "tags.md"), content, "utf-8");
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

async function callRoute(body: object) {
  const req = new Request("http://localhost/api/codebook/cascade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("cascade dry-run rename", () => {
  it("returns count of affected quotes without writing", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    const res = await callRoute({
      dryRun: true,
      action: "rename",
      oldId: "usability",
      newId: "ux-issue",
      projectsRoot: TMP,
    });
    const data = await res.json();
    expect(data.affectedQuoteCount).toBe(1);
    expect(data.affectedFiles).toHaveLength(1);
  });
});

describe("cascade execute rename", () => {
  it("replaces old tag ID in file", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    await callRoute({
      dryRun: false,
      action: "rename",
      oldId: "usability",
      newId: "ux-issue",
      projectsRoot: TMP,
    });

    const { readFileSync } = await import("fs");
    const content = readFileSync(path.join(TMP, "p1", "tags.md"), "utf-8");
    expect(content).toContain("tags: ux-issue, delight");
    expect(content).not.toContain("usability");
  });
});

describe("cascade execute delete", () => {
  it("removes tag ID from file", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    await callRoute({
      dryRun: false,
      action: "delete",
      oldId: "usability",
      projectsRoot: TMP,
    });

    const { readFileSync } = await import("fs");
    const content = readFileSync(path.join(TMP, "p1", "tags.md"), "utf-8");
    expect(content).toContain("tags: delight");
    expect(content).not.toContain("usability");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm run test -- cascade/route
```

**Step 3: Create the route**

Create `src/app/api/codebook/cascade/route.ts`:

```typescript
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

interface CascadeRequest {
  dryRun: boolean;
  action: "rename" | "delete";
  oldId: string;
  newId?: string;
  projectsRoot?: string; // injectable for tests
}

function patchTagsLine(line: string, oldId: string, newId: string | null): string {
  const match = line.match(/(\|\s*tags:\s*)(.+)$/);
  if (!match) return line;
  const tagList = match[2]
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== oldId);
  if (newId) tagList.splice(
    match[2].split(",").findIndex((t) => t.trim() === oldId),
    0,
    newId
  );
  const joined = tagList.join(", ");
  return line.replace(/\|\s*tags:\s*.+$/, `| tags: ${joined}`);
}

export async function POST(request: Request) {
  try {
    const body: CascadeRequest = await request.json();
    const { dryRun, action, oldId, newId } = body;

    if (!oldId || !action) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (action === "rename" && !newId) {
      return Response.json({ error: "newId required for rename" }, { status: 400 });
    }

    const projectsRoot =
      body.projectsRoot ?? path.join(process.cwd(), "content", "projects");

    const projectDirs = await readdir(projectsRoot, { withFileTypes: true });
    const affectedFiles: string[] = [];
    let affectedQuoteCount = 0;

    for (const dirent of projectDirs) {
      if (!dirent.isDirectory()) continue;
      for (const filename of ["tags.md", "findings.md"]) {
        const filePath = path.join(projectsRoot, dirent.name, filename);
        let content: string;
        try {
          content = await readFile(filePath, "utf-8");
        } catch {
          continue;
        }

        const lines = content.split("\n");
        let changed = false;
        const patched = lines.map((line) => {
          const tagMatch = line.match(/\|\s*tags:\s*(.+)$/);
          if (!tagMatch) return line;
          const ids = tagMatch[1].split(",").map((t) => t.trim());
          if (!ids.includes(oldId)) return line;
          affectedQuoteCount++;
          changed = true;
          return patchTagsLine(line, oldId, action === "rename" ? (newId ?? null) : null);
        });

        if (changed) {
          affectedFiles.push(filePath);
          if (!dryRun) {
            await writeFile(filePath, patched.join("\n"), "utf-8");
          }
        }
      }
    }

    return Response.json({ affectedFiles, affectedQuoteCount });
  } catch {
    return Response.json({ error: "Cascade failed" }, { status: 500 });
  }
}
```

**Step 4: Run tests**

```bash
npm run test -- cascade/route
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/codebook/cascade/route.ts src/app/api/codebook/cascade/route.test.ts
git commit -m "feat: add cascade API route for global tag rename/delete"
```

---

## Task 5: Update CodebookEditor — Project/Global tab switcher

**Files:**
- Modify: `src/components/builder/CodebookEditor.tsx`

The CodebookEditor currently only edits project-level tags. We add a `activeTab: "project" | "global"` state, a tab switcher in the header, and a `showProjectTab` prop (hidden when no project context).

**Step 1: Read the file**

Open `src/components/builder/CodebookEditor.tsx`. Key areas:
- Props interface (top of file)
- Lines 147–149: `handlePersistenceSave()` — calls `onSave()`
- Lines 164–170: "Save Codebook" header button
- Lines 275–280: Info callout about global vs custom
- Lines 313–330: Tag card global badge logic

**Step 2: Add props and tab state**

In the `CodebookEditorProps` interface, add:
```typescript
showProjectTab?: boolean;        // default true; false when no project context
globalCodebook?: Codebook;       // for read in Global tab
onSaveGlobal?: (codebook: Codebook) => Promise<void>;
onCascade?: (action: "rename" | "delete", oldId: string, newId?: string) => Promise<{ affectedFiles: string[]; affectedQuoteCount: number }>;
```

Add state inside the component:
```typescript
const [activeTab, setActiveTab] = useState<"project" | "global">(
  props.showProjectTab !== false ? "project" : "global"
);
```

**Step 3: Add tab switcher UI in the modal header**

Replace the existing header title with:
```tsx
<div className="flex items-center gap-4">
  <h2 className="text-lg font-semibold text-white">Codebook</h2>
  {props.showProjectTab !== false && (
    <div className="flex rounded-md overflow-hidden border border-white/20">
      {(["project", "global"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-3 py-1 text-sm capitalize ${
            activeTab === tab
              ? "bg-primary text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )}
</div>
```

**Step 4: Wire Global tab save**

In `handlePersistenceSave()`:
```typescript
async function handlePersistenceSave() {
  if (activeTab === "global") {
    await props.onSaveGlobal?.({ tags: customTags, categories: customCategories });
  } else {
    props.onSave({ tags: customTags, categories: customCategories });
  }
}
```

**Step 5: Remove read-only restriction on Global tab**

In the tag card rendering (around lines 313–330), change the condition so tags are editable when `activeTab === "global"`:

```typescript
const isEditable = !isGlobal || activeTab === "global";
```

Then use `isEditable` instead of `!isGlobal` on the edit/delete button visibility.

**Step 6: Load global tags into state when Global tab is active**

Add a `useEffect`:
```typescript
useEffect(() => {
  if (activeTab === "global" && props.globalCodebook) {
    setCustomTags(props.globalCodebook.tags);
    setCustomCategories(props.globalCodebook.categories);
  } else if (activeTab === "project") {
    // reset to project tags
    setCustomTags(props.initialCodebook?.tags ?? []);
    setCustomCategories(props.initialCodebook?.categories ?? []);
  }
}, [activeTab]);
```

**Step 7: Verify UI renders correctly**

```bash
npm run dev
```

Open a project → click Codebook in header → confirm two tabs appear, Global tab shows all global tags as editable.

**Step 8: Commit**

```bash
git add src/components/builder/CodebookEditor.tsx
git commit -m "feat: add Project/Global tab switcher to CodebookEditor"
```

---

## Task 6: Add cascade confirmation modal to CodebookEditor

**Files:**
- Modify: `src/components/builder/CodebookEditor.tsx`

When a user deletes or renames a tag on the Global tab, we show a confirmation modal with the dry-run count before writing.

**Step 1: Add pending cascade state**

```typescript
const [pendingCascade, setPendingCascade] = useState<{
  action: "rename" | "delete";
  oldId: string;
  newId?: string;
  affectedFiles: string[];
  affectedQuoteCount: number;
} | null>(null);
```

**Step 2: Intercept delete/rename on Global tab**

Wrap the existing delete handler:
```typescript
async function handleGlobalDeleteTag(tagId: string) {
  if (!props.onCascade) return;
  const result = await props.onCascade("delete", tagId);
  setPendingCascade({ action: "delete", oldId: tagId, ...result });
}
```

Wrap the existing rename/update handler (called when a tag label changes on Global tab):
```typescript
async function handleGlobalRenameTag(oldId: string, newId: string) {
  if (!props.onCascade) return;
  const result = await props.onCascade("rename", oldId, newId);
  setPendingCascade({ action: "rename", oldId, newId, ...result });
}
```

**Step 3: Add confirmation modal JSX**

Before the closing `</div>` of the modal:
```tsx
{pendingCascade && (
  <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center">
    <div className="bg-surface border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
      <h3 className="text-white font-semibold mb-2">
        {pendingCascade.action === "rename" ? "Rename tag" : "Delete tag"}
      </h3>
      <p className="text-white/70 text-sm mb-4">
        This will update{" "}
        <span className="text-white font-medium">
          {pendingCascade.affectedQuoteCount} quote
          {pendingCascade.affectedQuoteCount !== 1 ? "s" : ""}
        </span>{" "}
        across{" "}
        <span className="text-white font-medium">
          {pendingCascade.affectedFiles.length} file
          {pendingCascade.affectedFiles.length !== 1 ? "s" : ""}
        </span>
        . Published reports will need to be re-exported to reflect this change.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setPendingCascade(null)}
          className="px-4 py-2 text-sm text-white/60 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            await props.onCascade?.(
              pendingCascade.action,
              pendingCascade.oldId,
              pendingCascade.newId
            );
            await props.onSaveGlobal?.({ tags: customTags, categories: customCategories });
            setPendingCascade(null);
          }}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
)}
```

**Step 4: Verify manually**

Open dev server, go to Global tab, try deleting a tag that has quotes → confirm cascade modal appears with correct counts.

**Step 5: Commit**

```bash
git add src/components/builder/CodebookEditor.tsx
git commit -m "feat: add cascade confirmation modal for global tag edit/delete"
```

---

## Task 7: Add Codebook link to WorkspaceNav; remove from DocumentWorkspace banner

**Files:**
- Modify: `src/components/builder/WorkspaceNav.tsx`
- Modify: `src/components/builder/DocumentWorkspace.tsx`

**Step 1: Read WorkspaceNav.tsx**

The Help link is at lines 89–97. It links to `/help`.

**Step 2: Add Codebook link before Help in WorkspaceNav**

WorkspaceNav needs to accept an `onOpenCodebook` callback prop (so the modal opens at root level, not inside nav):

Add to `WorkspaceNavProps`:
```typescript
onOpenCodebook?: () => void;
```

Add the link before the Help link (around line 89):
```tsx
{props.onOpenCodebook && (
  <button
    onClick={props.onOpenCodebook}
    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
  >
    <TagIcon className="w-4 h-4" />
    Codebook
  </button>
)}
```

Import `TagIcon` from `@heroicons/react/24/outline` (already used elsewhere in the project).

**Step 3: Remove Codebook button from DocumentWorkspace Tags banner**

Open `src/components/builder/DocumentWorkspace.tsx`. Around lines 388–399, there is a block:
```tsx
{activeFile === "tags.md" && (
  <button onClick={() => setShowCodebookModal(true)}>
    Codebook
  </button>
)}
```

Delete this entire conditional block. The `showCodebookModal` state and its modal (lines ~561–591) should now be driven only from the header link.

**Step 4: Wire up header link → modal in DocumentWorkspace**

In DocumentWorkspace, pass `onOpenCodebook={() => setShowCodebookModal(true)}` to WorkspaceNav:

```tsx
<WorkspaceNav
  slug={slug}
  activeFile={activeFile}
  onFileChange={setActiveFile}
  onOpenCodebook={() => setShowCodebookModal(true)}
/>
```

**Step 5: Pass new props to CodebookEditor inside DocumentWorkspace**

In the CodebookEditor modal section (~lines 561–591), add the new props:
```tsx
<CodebookEditor
  // existing props...
  showProjectTab={true}
  globalCodebook={globalCodebook ?? { tags: [], categories: [] }}
  onSaveGlobal={async (codebook) => {
    await fetch("/api/codebook/global", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(codebook),
    });
    // trigger re-fetch of global codebook
    mutateGlobalCodebook?.();
  }}
  onCascade={async (action, oldId, newId) => {
    const res = await fetch("/api/codebook/cascade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true, action, oldId, newId }),
    });
    return res.json();
  }}
/>
```

**Step 6: Verify**

- Visit the Tags page — confirm no Codebook button in the banner
- Click "Codebook" in the header — modal opens
- On a non-project page (dashboard) — confirm modal opens with Global tab only

**Step 7: Commit**

```bash
git add src/components/builder/WorkspaceNav.tsx src/components/builder/DocumentWorkspace.tsx
git commit -m "feat: move Codebook access to header nav, remove from Tags banner"
```

---

## Task 8: CSV parsing utility

**Files:**
- Create: `src/lib/csv-codebook.ts`
- Test: `src/lib/csv-codebook.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { parseCsvCodebook, CsvRow } from "./csv-codebook";

describe("parseCsvCodebook", () => {
  it("parses valid CSV with header row", () => {
    const csv = "label,category\nUI Friction,Pain Point\nDelight Moment,Positive";
    const result = parseCsvCodebook(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ label: "UI Friction", category: "Pain Point" });
  });

  it("returns empty category for missing value", () => {
    const csv = "label,category\nUI Friction,";
    const result = parseCsvCodebook(csv);
    expect(result[0].category).toBe("");
  });

  it("trims whitespace from values", () => {
    const csv = "label,category\n  UI Friction  ,  Pain Point  ";
    const result = parseCsvCodebook(csv);
    expect(result[0]).toMatchObject({ label: "UI Friction", category: "Pain Point" });
  });

  it("skips blank rows", () => {
    const csv = "label,category\nUI Friction,Pain Point\n\n";
    expect(parseCsvCodebook(csv)).toHaveLength(1);
  });

  it("throws if header row is missing required columns", () => {
    expect(() => parseCsvCodebook("name,type\nFoo,Bar")).toThrow();
  });
});
```

**Step 2: Run to verify fail**

```bash
npm run test -- csv-codebook
```

**Step 3: Create csv-codebook.ts**

```typescript
export interface CsvRow {
  label: string;
  category: string;
}

export function parseCsvCodebook(csv: string): CsvRow[] {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const labelIdx = headers.indexOf("label");
  const categoryIdx = headers.indexOf("category");

  if (labelIdx === -1 || categoryIdx === -1) {
    throw new Error('CSV must have "label" and "category" columns');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      label: cols[labelIdx] ?? "",
      category: cols[categoryIdx] ?? "",
    };
  }).filter((row) => row.label.length > 0);
}
```

**Step 4: Run tests**

```bash
npm run test -- csv-codebook
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/csv-codebook.ts src/lib/csv-codebook.test.ts
git commit -m "feat: add CSV codebook parser utility"
```

---

## Task 9: NewProjectModal — multi-step with CSV upload and preview

**Files:**
- Modify: `src/components/projects/NewProjectModal.tsx`

The existing modal is ~244 lines with a single form. We add a `step` state (`"details" | "codebook"`) and render the CSV preview table when step is `"codebook"`.

**Step 1: Read NewProjectModal.tsx**

Key areas:
- Lines 13–20: form state shape
- Lines 22–57: `handleSubmit()` that creates the project
- Lines 177–207: codebook select dropdown (currently has disabled "Upload Custom" option)

**Step 2: Add step state and CSV state**

```typescript
const [step, setStep] = useState<"details" | "codebook">("details");
const [csvRows, setCsvRows] = useState<Array<{ label: string; category: string; id: string; color: string }>>([]);
const [newCategories, setNewCategories] = useState<string[]>([]);
```

**Step 3: Replace the disabled "Upload Custom" select option**

Change the existing codebook `<select>` option from:
```tsx
<option value="custom" disabled>Upload Custom (JSON) — Coming Soon</option>
```
to:
```tsx
<option value="custom">Custom (upload CSV)</option>
```

**Step 4: Update "Next" / "Create Project" button logic**

Replace the submit button with:
```tsx
{step === "details" ? (
  <button
    type="button"
    onClick={() => {
      if (form.codebook === "custom") setStep("codebook");
      else handleSubmit();
    }}
    className="..."
  >
    {form.codebook === "custom" ? "Next: Set Up Codebook" : "Create Project"}
  </button>
) : (
  <button
    type="button"
    onClick={handleSubmitWithCodebook}
    disabled={csvRows.some((r) => !r.category)}
    className="..."
  >
    Create Project
  </button>
)}
```

**Step 5: Add Step 2 — CSV upload + preview table**

When `step === "codebook"`, render:

```tsx
{step === "codebook" && (
  <div className="space-y-4">
    <div>
      <label className="block text-sm text-white/70 mb-1">Upload codebook CSV</label>
      <input
        type="file"
        accept=".csv"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          const parsed = parseCsvCodebook(text);
          const existingIds: string[] = [];
          const rows = parsed.map((row) => {
            const id = generateTagId(row.label, existingIds);
            existingIds.push(id);
            return {
              label: row.label,
              category: row.category,
              id,
              color: assignTagColor(rows?.map((r) => r.color) ?? []),
            };
          });
          setCsvRows(rows);
          const unique = [...new Set(rows.map((r) => r.category).filter(Boolean))];
          setNewCategories(unique);
        }}
        className="block w-full text-sm text-white/60"
      />
    </div>

    {csvRows.length > 0 && (
      <>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 text-left border-b border-white/10">
              <th className="pb-2">Label</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">ID</th>
              <th className="pb-2">Color</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {csvRows.map((row, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-1.5 text-white">{row.label}</td>
                <td className="py-1.5">
                  <CategoryCombobox
                    value={row.category}
                    existingCategories={newCategories}
                    onChange={(val) => {
                      const updated = [...csvRows];
                      updated[i] = { ...updated[i], category: val };
                      setCsvRows(updated);
                      if (val && !newCategories.includes(val)) {
                        setNewCategories([...newCategories, val]);
                      }
                    }}
                  />
                </td>
                <td className="py-1.5 text-white/50 font-mono text-xs">{row.id}</td>
                <td className="py-1.5">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                </td>
                <td className="py-1.5">
                  {row.category ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-yellow-400">⚠ Missing category</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {newCategories.length > 0 && (
          <p className="text-xs text-white/50">
            New categories to be created:{" "}
            {newCategories.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 mr-1">
                <span className="text-white/70">{c}</span>
                <span className="text-xs bg-white/10 px-1 rounded">New</span>
              </span>
            ))}
          </p>
        )}

        <p className="text-xs text-white/40">
          You can update your codebook anytime from the Codebook link in the header.
        </p>
      </>
    )}

    <button
      type="button"
      onClick={() => setStep("details")}
      className="text-sm text-white/50 hover:text-white"
    >
      ← Back
    </button>
  </div>
)}
```

**Step 6: Create a small CategoryCombobox inline component**

Add inside the same file (above the main component):

```typescript
function CategoryCombobox({
  value,
  existingCategories,
  onChange,
}: {
  value: string;
  existingCategories: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);

  const filtered = existingCategories.filter((c) =>
    c.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setTimeout(() => setOpen(false), 150); onChange(input); }}
        placeholder="Select or create..."
        className="w-full bg-transparent text-white text-sm border-b border-white/20 focus:outline-none focus:border-primary"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 bg-surface border border-white/10 rounded-lg shadow-xl w-48">
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setInput(c); onChange(c); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 7: Add handleSubmitWithCodebook**

```typescript
async function handleSubmitWithCodebook() {
  const project = await handleSubmit(); // existing create logic, modified to return slug
  if (!project?.slug) return;
  // write codebook.json for the new project
  const codebook = {
    tags: csvRows.map((r) => ({ id: r.id, label: r.label, category: r.category, color: r.color })),
    categories: [...new Set(csvRows.map((r) => r.category))],
  };
  await fetch(`/api/files?slug=${project.slug}&file=codebook.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(codebook),
  });
}
```

**Step 8: Verify manually**

- Create new project with "Custom (upload CSV)" selected
- Upload a CSV file → preview table appears
- Fix missing categories using combobox → Create Project button enables
- Project is created with codebook.json populated

**Step 9: Commit**

```bash
git add src/components/projects/NewProjectModal.tsx src/lib/csv-codebook.ts src/lib/codebook-utils.ts
git commit -m "feat: add multi-step new project modal with CSV codebook import"
```

---

## Task 10: Update prompts.ts — step references 4a/4b

**Files:**
- Modify: `src/lib/prompts.ts`
- Test: `src/lib/prompts.test.ts`

**Step 1: Read prompts.ts**

Key functions:
- `buildAnalyzeTranscriptsPrompt` (~line 79): references "Steps 1–5" → change to "Steps 1–3, then Step 4a"
- `buildAnalyzeFindingsPrompt` (~line 104): references "Steps 1–5" → change to "Steps 1–3, then Step 4a"
- `buildGenerateTagsPrompt` (~lines 159, 177): references "Steps 1–5" → change to "Steps 1–3, then Step 4b"
- `OUTPUT_FORMAT_PREFIX` (~line 22): references "Steps 1–5" → keep generic or update to "Steps 1–3, then the appropriate Step 4"

**Step 2: Check existing prompts tests**

```bash
npm run test -- prompts.test
```

Understand what's already tested.

**Step 3: Add tests for the new step references**

In `src/lib/prompts.test.ts`, add:

```typescript
it("buildAnalyzeTranscriptsPrompt references Step 4a not Steps 1-5", () => {
  const prompt = buildAnalyzeTranscriptsPrompt(mockProject, mockCodebook);
  expect(prompt).toContain("Step 4a");
  expect(prompt).not.toContain("Steps 1–5");
});

it("buildGenerateTagsPrompt references Step 4b not Steps 1-5", () => {
  const prompt = buildGenerateTagsPrompt(mockProject, mockCodebook, "findings");
  expect(prompt).toContain("Step 4b");
  expect(prompt).not.toContain("Steps 1–5");
});
```

**Step 4: Run to verify fail**

```bash
npm run test -- prompts.test
```

**Step 5: Update the step references in prompts.ts**

Search for every occurrence of `Steps 1–5` (or `Steps 1-5`) in the file and update:

- In `buildAnalyzeTranscriptsPrompt` and `buildAnalyzeFindingsPrompt`: replace with `Steps 1–3, then Step 4a`
- In `buildGenerateTagsPrompt` (both source branches): replace with `Steps 1–3, then Step 4b`
- In `OUTPUT_FORMAT_PREFIX`: replace with `Steps 1–3, then the appropriate Step 4 (4a for findings.md, 4b for tags.md)`

**Step 6: Run tests**

```bash
npm run test -- prompts.test
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/lib/prompts.ts src/lib/prompts.test.ts
git commit -m "feat: update prompts to reference Step 4a (findings) and Step 4b (tags)"
```

---

## Task 11: Update SKILL.md — codebook locations + split Step 4

**Files:**
- Modify: `.cursor/skills/research-analysis/SKILL.md`

**Step 1: Read SKILL.md**

Steps 1–5 are at lines 16–42. Step 4 is at lines 33–38 and currently says:
> Write `findings.md` or `tags.md` in plain markdown.

**Step 2: Add Codebook locations section**

Insert after the existing intro (before Step 1, around line 14):

```markdown
## Codebook locations

When discovering available tags, read from:
- **Global tags:** `data/global-codebook.json`
- **Project tags:** `content/projects/[slug]/codebook.json`

If a prompt already inlines the codebook tag list, use that. Otherwise read the files directly before tagging.
```

**Step 3: Split Step 4 into 4a and 4b**

Replace the existing Step 4 block:
```markdown
### Step 4: Write findings.md or tags.md
Write the output file in plain markdown. No MDX components, no YAML frontmatter.
```

With:
```markdown
### Step 4a: Write findings.md (thematic synthesis)
Write `findings.md` in the project directory. Structure:
- One `## Theme Name` H2 section per major theme
- Under each theme, 2–5 supporting quotes in standard quote format
- A 1–2 sentence synthesis after the quotes explaining the pattern
- No MDX components, no YAML frontmatter

### Step 4b: Write tags.md (evidence per tag)
Write `tags.md` in the project directory. Structure:
- One `## Tag Label` H2 section per tag in the codebook
- Under each tag, 3–5 high-quality quotes that exemplify that concept, in standard quote format
- Only include tags that have evidence; omit tags with no matching quotes
- No MDX components, no YAML frontmatter
```

**Step 4: Update Step 5 to reference both branches**

Step 5 currently says "Tell the researcher where findings are saved." Update to:
```markdown
### Step 5: Report back
Tell the researcher:
- Which file was written (findings.md or tags.md)
- How many themes/tags were covered
- Any tags with no evidence (for tags.md)
- Suggested next step (e.g. "Open tags.md in the TagBoard to review evidence")
```

**Step 5: Verify SKILL.md reads cleanly**

Read the file and confirm no broken formatting.

**Step 6: Commit**

```bash
git add .cursor/skills/research-analysis/SKILL.md
git commit -m "docs: split SKILL.md Step 4 into 4a/4b and add codebook locations"
```

---

## Task 12: Full integration check

**Step 1: Run full test suite**

```bash
npm run test
```

Expected: all existing + new tests pass.

**Step 2: Lint**

```bash
npm run lint
```

Fix any TypeScript errors.

**Step 3: Manual smoke test checklist**

- [ ] Header "Codebook" link opens modal
- [ ] Project tab saves to project codebook
- [ ] Global tab shows all global tags as editable
- [ ] Deleting a global tag shows cascade confirmation with file/quote count
- [ ] Confirming cascade updates markdown files and global-codebook.json
- [ ] Tags page has no Codebook button in the banner
- [ ] New project with "Default" codebook creates normally
- [ ] New project with "Custom CSV" proceeds to Step 2
- [ ] CSV upload shows preview table
- [ ] Missing category row blocks Create Project
- [ ] Category combobox allows creating new categories
- [ ] Create Project writes codebook.json to project folder
- [ ] AI Analysis prompts on findings page reference Step 4a
- [ ] AI Analysis prompts on tags page reference Step 4b

**Step 4: Final commit**

```bash
git commit --allow-empty -m "chore: codebook management feature complete"
```
