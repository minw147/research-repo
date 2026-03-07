# Report Builder PRD — Open-Source Local-First Research Hub

> **For AI agents:** This is the product requirements document. Read this fully before building. The companion implementation plan is at `docs/plans/2026-03-07-report-builder-plan.md`.

**Goal:** A local-first UX research analysis and report-building tool that pairs a Next.js workspace UI with the user's AI IDE (Cursor/Claude Code) — zero API fees, zero SaaS dependencies.

---

## 1. Product Philosophy

**"Zero SaaS. Zero API Fees. 100% Local AI."**

The tool has two halves that work together via the local filesystem:

1. **Report Builder UI** (Next.js) — handles complex UX: video playback, transcript highlighting, drag-and-drop clip creation, markdown editing, export, and publishing.
2. **AI IDE** (Cursor or Claude Code) — handles AI computation: thematic analysis, tagging, report formatting. The user's existing IDE subscription powers the AI; no additional API keys or costs.

The bridge between them is the filesystem. The UI reads/writes markdown files. The IDE reads/writes the same files. A file watcher keeps them in sync in real-time.

---

## 2. Goals & Non-Goals

### Goals
- Researchers can analyze interview transcripts and build findings reports with AI assistance
- Interactive clip creation from video transcripts (highlight → quote card → drag to markdown)
- Real-time sync between UI and AI IDE via filesystem watching
- Tag board for organizing quotes by codebook tags
- HTML export with physically sliced video clips for portable sharing
- Pluggable publish adapter system (local folder, Google Drive, etc.)
- Standalone Report Repo Viewer for stakeholders
- Clear phase markers so this can be built incrementally

### Non-Goals
- Built-in LLM or AI chat interface (the IDE is the AI)
- User authentication or multi-user collaboration
- Cloud-hosted SaaS version
- Real-time multiplayer editing
- Mobile support

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14+ (App Router, **server mode**) | Needs API routes, file watching, ffmpeg spawning |
| Styling | Tailwind CSS 3.4 + `@tailwindcss/typography` | Already in codebase, fast iteration |
| Split Pane | `react-resizable-panels` | Lightweight, accessible, well-maintained |
| MD Rendering | `react-markdown` + `remark-gfm` | Render formatted view of findings/tags |
| Raw Editor | `@uiw/react-codemirror` with markdown language | Syntax highlighting, line numbers for raw editing |
| Video | Native HTML5 `<video>` | No external player dependency |
| Clip Slicing | `ffmpeg-static` (already installed) | Local ffmpeg for slicing clips |
| File Watching | `chokidar` + Server-Sent Events | Real-time sync when IDE modifies files |
| AI Bridge | Node.js `child_process` (Claude CLI) | Auto-send prompts to Claude Code |
| Icons | `lucide-react` (already installed) | Consistent icon set |
| Testing | `vitest` + `@testing-library/react` | Fast, modern test runner |

### Dependencies to Add
```
react-resizable-panels
react-markdown
remark-gfm
@uiw/react-codemirror
@codemirror/lang-markdown
chokidar
vitest
@testing-library/react
@testing-library/jest-dom
```

### Dependencies to Remove
```
next-mdx-remote (replaced by react-markdown for the builder; MDX compilation happens via AI)
remark-html (no longer needed)
pptxgenjs (defer to later; not in v1 scope)
```

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Server                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ API: /files  │  │ API: /slice  │  │ API: /ai        │  │
│  │ read/write   │  │ ffmpeg clips │  │ claude CLI      │  │
│  │ watch (SSE)  │  │              │  │ bridge          │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│         ▼                ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Local Filesystem                       │ │
│  │  content/projects/{slug}/                           │ │
│  │    ├── project.json                                 │ │
│  │    ├── transcripts/    videos/                      │ │
│  │    ├── findings.md     tags.md                      │ │
│  │    ├── report.mdx      clips/                       │ │
│  └─────────────────────────────────────────────────────┘ │
│         ▲                                                │
│         │  (same files)                                  │
│  ┌──────┴──────┐                                         │
│  │  Cursor /   │                                         │
│  │  Claude Code│  ← User's AI IDE, modifies .md files   │
│  └─────────────┘                                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Report Repo Viewer  │  ← Separate standalone HTML
│  (index.html)        │    Lives in shared folder
└──────────────────────┘
```

**Data flow:**
1. Transcripts + videos go into a project folder
2. AI IDE generates `findings.md` (via research-analysis skill)
3. Report Builder UI displays findings, enables clip creation and editing
4. AI IDE can modify findings/tags when prompted (file watcher syncs UI)
5. User generates report → `report.mdx`
6. Export slices clips via ffmpeg → downloadable HTML
7. Publish adapter pushes to external target

---

## 5. Data Model

### 5.1 Project Folder Structure

Each research project lives in its own folder under `content/projects/`:

```
content/projects/{project-slug}/
├── project.json          # Metadata, sessions, codebook ref, status
├── transcripts/
│   ├── session-1.txt     # Format: [MM:SS] text per line
│   └── session-2.txt
├── videos/
│   ├── session-1.mp4
│   └── session-2.mp4
├── findings.md           # Thematic findings with quote cards
├── tags.md               # Quotes reorganized by codebook tags
├── report.mdx            # Generated report for preview
└── clips/                # Sliced video clips (generated by ffmpeg)
    ├── clip-001-45s.mp4
    └── clip-002-128s.mp4
```

### 5.2 project.json Schema

```json
{
  "id": "checkout-flow-usability",
  "title": "Checkout Flow Usability Study",
  "date": "2026-03-07",
  "researcher": "Jane Smith",
  "persona": "New Customer",
  "product": "E-commerce",
  "status": "findings",
  "researchPlan": "What are the main friction points in the checkout flow?",
  "codebook": null,
  "sessions": [
    {
      "id": "session-1",
      "participant": "Participant 1",
      "videoFile": "session-1.mp4",
      "transcriptFile": "session-1.txt"
    },
    {
      "id": "session-2",
      "participant": "Participant 2",
      "videoFile": "session-2.mp4",
      "transcriptFile": "session-2.txt"
    }
  ],
  "publishedUrl": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Kebab-case slug, matches folder name |
| `title` | string | Human-readable project title |
| `date` | string | ISO date (YYYY-MM-DD) |
| `researcher` | string | Researcher name |
| `persona` | string | Target participant persona |
| `product` | string (optional) | Product area |
| `status` | enum | `"setup"` \| `"findings"` \| `"tagged"` \| `"report"` \| `"exported"` \| `"published"` |
| `researchPlan` | string (optional) | Research questions / study goals |
| `codebook` | string \| null | Filename of custom codebook JSON, or null for global only |
| `sessions` | array | List of session objects (participant + files) |
| `publishedUrl` | string \| null | URL after publishing via adapter |

### 5.3 Quote Format in Markdown

Quotes in `findings.md` and `tags.md` use this extended format:

```markdown
- **"I kept looking for the Visa logo but it was hidden under the fold."** @ 01:30 (90s) | duration: 15s | session: 1 | tags: checkout, friction
```

**Parsing rules:**
- Quote text: between `**"` and `"**`
- Timestamp display: after `@ `, format `MM:SS`
- Start seconds: in parentheses, e.g. `(90s)` → 90
- Duration: after `duration: `, in seconds, e.g. `15s` → 15. Default 20s if omitted
- Session: after `session: `, integer matching session index. Default 1 if omitted
- Tags: after `tags: `, comma-separated. Optional

Minimal valid format (backwards-compatible with existing findings):
```markdown
- **"quote text"** @ 01:30 (90s)
```

### 5.4 Global Codebook (`data/global-codebook.json`)

```json
{
  "tags": [
    { "id": "usability", "label": "Usability Issue", "color": "#EF4444", "category": "Pain Point" },
    { "id": "delight", "label": "Delight Moment", "color": "#10B981", "category": "Positive" },
    { "id": "confusion", "label": "Confusion", "color": "#F59E0B", "category": "Pain Point" },
    { "id": "feature-req", "label": "Feature Request", "color": "#3B82F6", "category": "Feedback" },
    { "id": "workflow", "label": "Workflow Pattern", "color": "#8B5CF6", "category": "Behavior" },
    { "id": "onboarding", "label": "Onboarding", "color": "#06B6D4", "category": "Experience" }
  ],
  "categories": ["Pain Point", "Positive", "Feedback", "Behavior", "Experience"]
}
```

Custom project codebooks follow the same schema. When both exist, they are merged (custom tags added to global tags; duplicates resolved by custom winning).

### 5.5 App Config (`data/config.json`, gitignored)

```json
{
  "aiMode": "auto",
  "adapters": {
    "local-folder": {
      "enabled": true,
      "outputPath": ""
    },
    "google-drive": {
      "enabled": false,
      "folderId": "",
      "credentialsPath": ""
    }
  }
}
```

`aiMode`: `"auto"` (detect Claude CLI, fall back to copy-paste), `"claude-cli"`, or `"copy-paste"`.

---

## 6. Phase 1: Foundation & Project Management

### 6.1 Home Page — Project Selector (`/`)

The landing page shows all research projects with the ability to create new ones.

**Layout:**
- Header: App logo + name ("Report Builder")
- Grid of project cards sorted by date (newest first)
- "+ New Project" card at the start of the grid

**Project Card shows:**
- Title
- Date
- Persona + Product badges
- Status badge (color-coded: setup=gray, findings=blue, tagged=purple, report=green, exported=emerald, published=teal)
- Researcher name
- Number of sessions
- Click → navigates to `/builder/{slug}/findings`

### 6.2 New Project Flow

Clicking "+ New Project" opens a modal/page with a form:

1. **Project Title** (required) — auto-generates slug
2. **Researcher Name** (required)
3. **Persona** (required)
4. **Product** (optional)
5. **Research Plan** (optional, textarea)
6. **Codebook** — dropdown: "Global only" or "Upload custom" (JSON file)

On submit:
- Creates `content/projects/{slug}/` folder structure
- Writes `project.json` with status `"setup"`
- Redirects to `/builder/{slug}/findings`

The user then manually drops video (.mp4) and transcript (.txt/.vtt) files into the project's `videos/` and `transcripts/` folders. The UI detects them via file watching and prompts to configure sessions.

### 6.3 Session Configuration

When the builder detects new video/transcript files in the project folder, it shows a configuration panel:

- Lists detected files
- User maps video ↔ transcript pairs to sessions
- Sets participant names
- Saves to `project.json` sessions array
- Updates status to `"findings"` once at least one session is configured

---

## 7. Phase 2: Core Workspace — Findings Editor

This is the primary workspace. Route: `/builder/{slug}/findings`

### 7.1 Workspace Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ◉ Report Builder   [Project Name ▾]   Findings │ Tags │ Report │ Export  │
├────────────────────────────┬────────────────────────────────┤
│         LEFT PANE          │          RIGHT PANE            │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐  │
│  │   VIDEO PLAYER       │  │  │  ○ Formatted  ● Raw      │  │
│  │   (sticky top)       │  │  ├──────────────────────────┤  │
│  │    advancement bar    │  │  │                          │  │
│  │   [session dropdown] │  │  │  # Study: Checkout Flow  │  │
│  └──────────────────────┘  │  │                          │  │
│  ┌──────────────────────┐  │  │  ## Theme 1: Payment...  │  │
│  │   TRANSCRIPT         │  │  │                          │  │
│  │   (scrollable)       │  │  │  ### Key quotes          │  │
│  │                      │  │  │  - **"I kept looking..." │  │
│  │   [00:15] Hello...   │  │  │    @ 01:30 (90s)         │  │
│  │   [00:30] Well I..   │  │  │                          │  │
│  │   ┌── QUOTE CARD ──┐ │  │  │  ## Theme 2: ...         │  │
│  │   │ "I kept look.." │ │  │  │                          │  │
│  │   │ ● ● (tag dots)  │ │  │  │                          │  │
│  │   └─────────────────┘ │  │  │                          │  │
│  │   [01:45] And then..  │  │  │                          │  │
│  │                      │  │  │                          │  │
│  └──────────────────────┘  │  └──────────────────────────┘  │
└────────────────────────────┴────────────────────────────────┘
```

**Top Navigation Bar:**
- Logo + app name (left)
- Project name with dropdown to switch projects (center-left)
- View tabs: **Findings** | **Tags** | **Report** | **Export** (center-right)
- The active tab is highlighted

**Split Pane:**
- Resizable via `react-resizable-panels`
- Default split: 45% left, 55% right
- Minimum pane width: 300px

### 7.2 Left Pane: Video + Transcript

**Video Player (sticky top):**
- HTML5 `<video>` with native controls
- Session selector dropdown above the video (for multi-session projects)
- Switching sessions loads the corresponding video and transcript
- Video preloads metadata only (not full video)

**Transcript Viewer (scrollable, below video):**
- Each transcript line rendered as a row: `[MM:SS] text`
- Clicking a timestamp seeks the video to that time
- The currently-playing line is highlighted (scroll-into-view optional)
- Existing quote cards (parsed from findings.md) are rendered inline at their timestamp positions
- Quote cards in transcript show: quote text, colored tag dots (small circles)
- Non-quote transcript lines are plain text

**Clip Creation Flow:**
1. User selects/highlights text across one or more transcript lines
2. A floating "+ Clip" button appears near the selection
3. Clicking "+ Clip" creates a quote card:
   - Extracts the selected text as the quote
   - Calculates `start` from the first selected line's timestamp
   - Calculates `duration` from first to last selected line
   - Sets `session` from current session dropdown
   - Tags default to empty
4. The new quote card appears in the transcript view (visually distinct from plain text)
5. User drags the quote card to the right pane (raw view) to insert it into `findings.md`
6. On drop, the quote is formatted as the standard quote markdown and inserted at the cursor position in the editor

**Quote Card Interactions (in transcript view):**
- **Single click** → plays the video from the quote's start timestamp, auto-stops at end (start + duration)
- **Hover** → tag dots expand into labeled tag bubbles above the card
- **Double click** → opens edit modal:
  - Edit tags (up to 3, autocomplete from codebook)
  - Edit duration
  - "Hide from transcript" button (does NOT delete from .md file; just visually hides)
  - Explanation text: "Hiding removes this quote from the transcript view only. To remove it from findings, edit the markdown file."

### 7.3 Right Pane: Formatted/Raw Markdown Editor

**View Toggle** at the top: `Formatted` | `Raw`

**Formatted View:**
- Renders `findings.md` as styled HTML via `react-markdown`
- Quote cards are rendered as interactive cards (same design as transcript view cards)
- Clicking a quote card timestamp plays the video and auto-stops
- Headings, paragraphs, lists render with Tailwind typography
- Read-only in this view

**Raw View:**
- CodeMirror editor with markdown syntax highlighting
- Line numbers enabled
- Accepts drag-and-drop of quote cards from the left pane
- On drop: inserts the quote markdown string at the drop position
- Edits are saved to `findings.md` on:
  - Ctrl+S / Cmd+S (explicit save)
  - Debounced auto-save (2 second delay after last keystroke)
- After saving, the formatted view updates on next toggle

**Refresh Button:**
- Small refresh icon button in the right pane header
- Re-reads `findings.md` from disk and updates both views
- Useful when the AI IDE has modified the file externally
- File watcher (SSE) handles this automatically, but manual refresh is the fallback

### 7.4 File Watching & Real-Time Sync

When the AI IDE (Cursor/Claude Code) modifies `findings.md`, `tags.md`, or `report.mdx`, the UI should update automatically:

1. **Server-side:** API route at `/api/files/watch` opens a Server-Sent Events stream
2. **Watcher:** `chokidar` monitors `content/projects/{slug}/` for changes to `.md` and `.mdx` files
3. **On change:** Server sends SSE event: `{ file: "findings.md", event: "change" }`
4. **Client-side:** React hook listens to SSE stream, triggers re-fetch of the changed file
5. **UI updates:** Right pane re-renders with new content; left pane re-parses quotes and updates transcript highlighting

Debounce file change events by 500ms to avoid rapid-fire updates during AI writes.

---

## 8. Phase 3: AI Integration

### 8.1 Claude CLI Bridge

On app startup, detect if `claude` CLI is available:

```typescript
import { execSync } from "child_process";
function detectClaudeCli(): boolean {
  try {
    execSync("claude --version", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
```

API route at `/api/ai/run`:
- Accepts `{ prompt: string, workingDir: string }`
- Spawns `claude -p "{prompt}" --output-format text` in the project directory
- Streams output back to client (or returns on completion)
- The prompt tells Claude to modify specific files in the project folder

### 8.2 Copy-Paste Fallback

When Claude CLI is not available (Cursor users):
- Instead of "Run with AI" button, show "Copy Prompt" button
- Clicking copies the prompt text to clipboard
- Toast notification: "Prompt copied! Paste into Cursor and run."

### 8.3 AI Prompt Locations

AI prompts appear at specific transition points, not as a general chat interface:

| Context | Trigger | Prompt Purpose |
|---------|---------|---------------|
| Findings Editor | "Analyze transcripts" button (when findings.md is empty) | Generate initial findings from transcripts |
| Findings Editor | "Add theme" button | Review transcripts for a specific theme and add quotes |
| Tag Board | "Generate Tags" modal | Parse findings.md → tags.md by codebook |
| Tag Board | "Re-tag from transcripts" modal | Re-read transcripts → tags.md by codebook |
| Report view | "Generate Report" button | Convert findings.md → report.mdx |
| Export view | (no AI — ffmpeg only) | N/A |
| Publish | Adapter-specific | Adapter may generate prompts for setup |

### 8.4 Prompt Templates

Prompts are stored as template strings in the codebase. They include project context (file paths, codebook, research plan) and specific instructions. Example:

```
Review all transcripts in {projectDir}/transcripts/ and generate a thematic analysis.
Write findings to {projectDir}/findings.md using this format:

## Theme N: [Theme Name]
[Description]
### Key quotes
- **"exact quote"** @ MM:SS (SECONDs) | duration: Ns | session: N

Research plan: {researchPlan}
Codebook tags to look for: {codebookTags}
```

---

## 9. Phase 4: Tag Board

Route: `/builder/{slug}/tags`

### 9.1 Tag Board View

The tag board uses the **same split-pane layout** as findings, but displays `tags.md` instead of `findings.md`.

**`tags.md` format** — quotes grouped by tag:

```markdown
# Tag Board: Checkout Flow Usability

## Usability Issue [color: #EF4444]

- **"I kept looking for the Visa logo..."** @ 01:30 (90s) | duration: 15s | session: 1
- **"The button was too small to tap"** @ 03:45 (225s) | duration: 10s | session: 2

## Confusion [color: #F59E0B]

- **"I wasn't sure if my order went through"** @ 05:10 (310s) | duration: 20s | session: 1
```

### 9.2 Tag Generation Modal

When user switches to Tags view for the first time (or tags.md doesn't exist), a modal appears with two options:

**Option A: "Parse findings into tags"**
- Prompt: reads `findings.md`, reorganizes quotes by codebook tags into `tags.md`
- Best when findings are already well-tagged

**Option B: "Re-read transcripts and tag"**
- Prompt: reads all transcripts fresh, applies codebook tags, writes `tags.md`
- Best for a fresh tagging pass independent of findings

Each option shows the prompt text with a "Run with AI" or "Copy Prompt" button.

### 9.3 Tag Interactions on Quote Cards

Quote cards in both transcript and markdown views show tags:

- **Default state:** Small colored dots (8px circles) at the bottom-right of the card, one per tag, colored per codebook
- **Hover:** Dots expand into labeled pills/bubbles above the card border (e.g., `🔴 Usability Issue` `🟡 Confusion`)
- **Double-click card:** Opens edit modal (same as findings view) — edit tags, duration, or hide

### 9.4 Codebook Editor

Accessible from project settings or a gear icon in the tag board header:
- Shows global tags + any custom project tags
- Add/edit/remove tags (label, color, category)
- Changes save to `data/global-codebook.json` or the project's custom codebook file

---

## 10. Phase 5: Report Generation & Preview

Route: `/builder/{slug}/report`

### 10.1 Report Generation

If `report.mdx` doesn't exist:
- Show a "Generate Report" button with style options:
  - **Blog** (scrollable article) — default
  - **Slides** (vertical slide deck with `<Slide>` components)
- Button triggers AI prompt that converts `findings.md` → `report.mdx`
- Prompt includes the MDX component API (Clip, Callout, Divider, Tooltip, Slide)

If `report.mdx` exists:
- Show the rendered preview with a "Regenerate" option

### 10.2 Rendered Preview

The report view renders `report.mdx` with full component support:
- `<Clip>` renders video player cards with play/pause at timestamps
- `<Callout>` renders highlight boxes (info, tip, warning, insight)
- `<Divider>` renders horizontal rules with optional labels
- `<Tooltip>` renders hover tooltips
- `<Slide>` renders slide cards (when layout is "slides")

Clips in preview do NOT auto-load video. Video loads only when the play button is clicked (lazy loading to avoid performance issues).

The user can switch to raw view to edit the MDX directly, or ask Cursor to modify it.

---

## 11. Phase 6: Export

Route: `/builder/{slug}/export`

### 11.1 Export View

Shows export options:

**1. Download HTML (with sliced clips)**
- Button: "Download HTML"
- Process:
  1. API route `/api/slice` reads `report.mdx`, extracts all Clip components
  2. For each clip: runs `ffmpeg` to slice the source video → `clips/clip-NNN-STARTs.mp4`
  3. Generates a self-contained HTML file with clips embedded via `<video>` tags pointing to relative paths
  4. Bundles HTML + clips folder into a downloadable zip
- Progress indicator shows slicing status

**2. Download HTML (no clips, timestamps only)**
- Lighter option: generates HTML where clips link to full video with `#t=start`
- No ffmpeg, instant generation

**3. Download Raw Markdown**
- Downloads `findings.md` as-is

### 11.2 Slicing Implementation

Reuse existing `slice-clips.js` logic, adapted to the new project structure:

```javascript
// For each Clip in report.mdx:
// ffmpeg -i {videoPath} -ss {start} -t {duration} -c copy {outputPath}
```

Output goes to `content/projects/{slug}/clips/`.

---

## 12. Phase 7: Publishing — Pluggable Adapters

Accessible from the Export view as a "Publish" section below download options.

### 12.1 Adapter Interface

```typescript
// adapters/types.ts
export interface PublishAdapter {
  id: string;
  name: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload): Promise<PublishResult>;
}

export interface AdapterConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "path" | "select";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface PublishPayload {
  projectDir: string;
  project: ProjectJSON;
  htmlPath: string;
  clipsDir: string;
  tagsHtmlPath?: string;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  message: string;
}
```

### 12.2 Built-in Adapters

**Local Folder Adapter:**
- Copies HTML + clips to a user-specified local path
- Config: `outputPath` (folder path)
- Simplest adapter, works everywhere

**Google Drive Adapter (stretch):**
- Uploads HTML + clips to a Google Drive folder
- Config: `folderId`, `credentialsPath`
- Uses Google Drive API

### 12.3 Adapter Discovery

Adapters are discovered at startup by scanning the `adapters/` directory. Each subfolder with an `index.ts` exporting a `PublishAdapter` is registered. The UI renders adapter options dynamically.

### 12.4 Settings UI

Each adapter's `configSchema` drives a form rendered in the export view:
- Text fields, password fields, file path pickers
- Settings saved to `data/config.json` (gitignored)
- "Test Connection" button where applicable

---

## 13. Phase 8: Report Repo Viewer (Standalone)

A **separate, self-contained HTML file** that lives in the shared folder alongside published reports. Not part of the Next.js app.

### 13.1 Concept

The Repo Viewer is an `index.html` + `viewer.js` + `viewer.css` bundle that:
- Reads a `repo-index.json` in the same folder
- Renders a dashboard of all published research projects
- Works when opened from a file share (SharePoint, Google Drive, or local)

### 13.2 repo-index.json

When a report is published via an adapter, the adapter appends an entry to `repo-index.json` in the target folder:

```json
[
  {
    "id": "checkout-flow-usability",
    "title": "Checkout Flow Usability Study",
    "date": "2026-03-07",
    "researcher": "Jane Smith",
    "persona": "New Customer",
    "product": "E-commerce",
    "findingsHtml": "checkout-flow-usability/report.html",
    "tagBoardHtml": "checkout-flow-usability/tags.html",
    "publishedUrl": "https://notion.so/..."
  }
]
```

### 13.3 Dashboard UI

Simple, clean HTML/CSS/JS (no framework dependency):

- **Header:** "Research Repository" + search bar
- **Left Sidebar:** Filters — Product (checkboxes), Persona (checkboxes), Researcher (checkboxes), Date range
- **Main Area:** Grid of project cards
  - Title, date, researcher
  - Persona + product badges
  - Three links: [Findings] [Tag Board] [Published Report]
- **Search:** Filters cards by title match

This is a static file. No build step, no server. Just HTML that reads the JSON and renders.

---

## 14. Cursor Skills (Updated)

The existing skills (`research-analysis` and `report-publication`) need updates to work with the new project folder structure.

### 14.1 research-analysis (Updated)

Changes:
- Read transcripts from `content/projects/{slug}/transcripts/` instead of `data/transcripts/`
- Write findings to `content/projects/{slug}/findings.md` instead of `data/analysis/`
- Read/write `project.json` instead of `research-index.json`
- Quote format includes `| duration: | session: | tags:` extensions

### 14.2 report-publication (Updated)

Changes:
- Read findings from `content/projects/{slug}/findings.md`
- Write report to `content/projects/{slug}/report.mdx`
- Slice clips to `content/projects/{slug}/clips/`
- Video sources from `content/projects/{slug}/videos/`
- No more global `research-index.json` — each project is self-contained

---

## 15. Reusable Components (Carried Over)

These components from the current codebase are carried forward with minimal changes:

| Component | File | Changes Needed |
|-----------|------|---------------|
| `Clip` | `src/components/clips/Clip.tsx` | Remove `TranscriptContext` dependency; accept transcript lines as props instead. Add `onClick` prop for builder interactions. |
| `Callout` | `src/components/shared/Callout.tsx` | No changes. Move to `shared/`. |
| `Divider` | `src/components/shared/Divider.tsx` | No changes. Move to `shared/`. |
| `Tooltip` | `src/components/shared/Tooltip.tsx` | No changes. Move to `shared/`. |

New components to build:
- `QuoteCard` — the interactive quote card used in transcript and markdown views
- `TranscriptViewer` — scrollable transcript with inline quote cards
- `VideoPlayer` — wrapper around `<video>` with session switching and timestamp seeking
- `MarkdownEditor` — CodeMirror wrapper with drag-and-drop support
- `MarkdownRenderer` — react-markdown with quote card rendering
- `SplitPane` — workspace layout wrapper
- `PromptModal` — AI prompt display with Run/Copy buttons
- `AdapterSettings` — dynamic form from adapter config schema
- `ProjectCard` — card for project selector grid
- `TagDots` — colored tag indicator with hover expansion

---

## 16. UI/UX Principles

1. **File-first:** Every piece of data is a readable file on disk. No opaque databases.
2. **AI-IDE-native:** The UI complements the IDE, not replaces it. Complex analysis happens in Cursor/Claude.
3. **Refresh, don't rebuild:** Changes sync via file watching. The user never waits for a build.
4. **Progressive disclosure:** Simple by default, powerful on demand. Quote cards show dots; hover shows tags; double-click shows editor.
5. **Portable output:** HTML export works offline, from a USB stick, from email. No viewer login required.
6. **YAGNI:** Start with findings editor. Add tags, report, export, publish incrementally. Each phase is independently useful.

---

## 17. Phase Summary

| Phase | What it delivers | Independently useful? |
|-------|-----------------|----------------------|
| 1. Foundation | Project management, folder structure, config | Yes — organizes research projects |
| 2. Findings Editor | Split-pane workspace, clip creation, MD editing | Yes — core research workflow |
| 3. AI Integration | Claude CLI bridge, prompt templates | Yes — accelerates analysis |
| 4. Tag Board | Tag-based organization, codebook | Yes — adds structure to findings |
| 5. Report Preview | MDX generation and rendered preview | Yes — visual report drafting |
| 6. Export | HTML download with sliced clips | Yes — portable sharing |
| 7. Publishing | Pluggable adapters, external targets | Yes — team distribution |
| 8. Repo Viewer | Standalone dashboard for stakeholders | Yes — research discovery |

Each phase builds on the previous but delivers standalone value. An AI agent should build and test each phase completely before moving to the next.
