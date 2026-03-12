# CLAUDE.md — Research Repo

## Project Overview

A **local-first UX research repository** for managing transcripts, extracting insights, and publishing MDX reports with embedded video clips. Designed to work with Cursor and local AI workflows.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router, no SSR — static export) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 with custom design tokens |
| Editor | CodeMirror 6 via `@uiw/react-codemirror` |
| Markdown | Unified ecosystem (remark + rehype) |
| Video | FFmpeg via `ffmpeg-static` |
| Testing | Vitest 4 + React Testing Library |
| File watching | chokidar |
| Node | 18+ |

---

## Key Commands

```bash
npm run dev          # Start dev server (also exports HTML before start)
npm run build        # Production static export
npm run test         # Run Vitest test suite
npm run test:watch   # Tests in watch mode
npm run lint         # ESLint (Next.js config)
npm run slice-clips  # Extract video clips from MDX via FFmpeg
npm run update-clip-urls  # Sync clip URLs from OneDrive/SharePoint JSON
```

---

## Directory Structure

```
research-repo/
├── content/
│   └── projects/[slug]/      # Project data (sessions, transcripts, clips, videos)
├── data/
│   ├── transcripts/          # Raw timestamped transcripts
│   ├── analysis/             # AI-generated findings drafts
│   └── research-index.json   # Study metadata (video URLs, report links)
├── public/videos/            # Full videos + sliced clips (gitignored)
├── src/
│   ├── app/                  # Next.js App Router pages + API routes
│   ├── components/
│   │   ├── builder/          # Report-building UI (editors, video, transcript)
│   │   ├── projects/         # Project dashboard components
│   │   ├── publish/          # Publishing UI and adapters
│   │   └── shared/           # Reusable primitives (Callout, Tooltip, etc.)
│   ├── lib/                  # Core utilities (projects, transcript, quote-parser)
│   ├── hooks/                # Custom hooks (useFileContent, useFileWatcher)
│   ├── types/                # TypeScript interfaces
│   └── adapters/             # Pluggable publishing adapters
├── .cursor/skills/           # Cursor skills for AI-guided research workflows
└── docs/                     # Plans and architecture documentation
```

---

## Code Conventions

### Components
- `"use client"` required for all interactive components
- PascalCase filenames: `MarkdownEditor.tsx`, `ProjectCard.tsx`
- Props typed as `{ComponentName}Props` interfaces
- Use `forwardRef` when exposing imperative methods to parents
- Manage transient state and debounce timers via refs, not useState

### Utilities / Lib
- camelCase filenames: `transcript.ts`, `quote-parser.ts`
- Pure functions preferred; side effects isolated to hooks

### Imports
- Path alias `@/*` → `./src/*`
- Group: external packages → `@/lib` → `@/components` → relative

### Styling
- Tailwind utility classes only — no CSS modules or inline styles
- Dark mode via `class` strategy; custom tokens: `primary` (orange), `surface`, `muted`
- Custom border radii: `sm` = 0.25rem → `2xl` = 1rem

---

## Testing

- Test files colocated: `{File}.test.ts` / `{File}.test.tsx`
- Environment: JSDOM (set in `vitest.config.ts`)
- Cleanup: `afterEach(cleanup)` for component tests
- Mocking: `vi.spyOn()`, `vi.fn()` — never `jest.*`
- File I/O tests: create and clean up temp dirs (`__test__` suffix)
- Avoid snapshot tests; prefer explicit assertions

---

## Architecture Notes

1. **Local-first:** All data lives on the filesystem. No database.
2. **Path safety:** Every file operation goes through `resolveProjectPath()` — never bypass it.
3. **Pluggable adapters:** Publishing targets (e.g. local-folder) implement a shared adapter interface in `src/adapters/`.
4. **File watching:** `chokidar` watches project directories; changes trigger UI refresh automatically.
5. **Copy-and-run AI workflow:** Prompts are generated in the UI and executed in the external Cursor/Claude IDE — not via API calls from the app itself.
6. **Video hosting:** Raw videos are gitignored and hosted externally (OneDrive/SharePoint/Google Drive). Only clips produced by FFmpeg are stored locally.
7. **No AI API calls from app routes:** The app does not call LLM APIs. AI analysis runs through `.cursor/skills/` prompts instead.

---

## Cursor Skills

Located in `.cursor/skills/`:

- **research-analysis** — transcript analysis, findings extraction, Groq/Whisper transcription
- **report-publication** — MDX report generation, clip slicing, HTML/PPTX export

When modifying these workflows, update the skill files and test manually with a sample project.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Optional — enables Groq/Whisper transcription in Cursor skill |

---

## Common Gotchas

- **Editor re-renders:** CodeMirror requires a `ResizeObserver` for proper height. Don't set a fixed pixel height directly.
- **Debounce via refs:** Debounce timers must be stored in refs, not state, to avoid stale closure bugs.
- **Duplicate quote drops:** `MarkdownEditor` parses dropped text to deduplicate quotes — don't strip this logic.
- **Slug validation:** All API routes validate slugs via `sanitizeSlug` before any filesystem access.
- **FFmpeg path:** Resolved via `src/lib/ffmpeg-path.ts` — don't hardcode binary paths.
