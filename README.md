# Research Hub

A local-first UX research repository for managing interview transcripts, extracting insights, and publishing reports with embedded video clips. Built for researchers using [Cursor](https://cursor.com) and local AI — no LLM API calls from the app.

## What it does

- **Project-based workflow** — Create projects, add sessions (video + transcript), edit findings and tags in the Report Builder
- **Codebook** — Define tags and categories (project-level or global) for thematic analysis
- **Transcript analysis** — Use Cursor skills to extract themes, pain points, and verbatim quotes with timestamps
- **Report Builder** — Edit findings.md, tags.md, and report.mdx with live preview; AI analysis via copy-and-run prompts
- **Video clips** — Slice clips from full videos via FFmpeg based on quote timestamps
- **Export** — Generate portable HTML reports (self-contained, with clips) or publish to local folder, Google Drive
- **Cursor skills** — Built-in skills in `.cursor/skills/` guide AI to analyze transcripts and publish reports

## Quick start

```bash
git clone https://github.com/minw147/research-repo.git
cd research-repo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard lists projects; create one or open an existing project to start.

## Project structure

```
research-repo/
├── content/projects/[slug]/   # Per-project data
│   ├── project.json           # Metadata (title, researcher, sessions)
│   ├── codebook.json          # Project-specific tags & categories
│   ├── findings.md            # Thematic findings & quotes
│   ├── tags.md                # Tag board (quotes by tag)
│   ├── report.mdx             # Published report (MDX with clips)
│   ├── export/                # Portable HTML export (index.html + clips/)
│   ├── transcripts/           # Session transcripts (.vtt, .txt)
│   └── videos/                # Session videos (gitignored)
├── data/
│   ├── global-codebook.json   # Shared tags across all projects
│   └── research-index.json   # Legacy study metadata
├── .cursor/skills/            # Cursor skills (research-analysis, report-publication)
├── repo-viewer-template/     # Static viewer template (index.html, viewer.js, viewer.css)
├── docs/                      # Plans, setup guides
└── src/                       # Next.js app (App Router)
```

## Workflow

1. **Create a project** — From the dashboard, click **New Project**. Add title, researcher, persona, product.
2. **Add sessions** — In the Report Builder, add sessions with video and transcript files (or auto-generated VTT from Teams/Zoom).
3. **Manage codebook** — Open **Codebook** to define tags and categories. Project tags are per-project; global tags are shared.
4. **Analyze** — In Findings or Tags, click **AI Analyze**, copy the prompt, run it in Cursor. The AI creates/updates `findings.md` or `tags.md`. Refresh the app to see changes.
5. **Generate report** — On the Report tab, use **AI Synthesis** to produce `findings.html` from `findings.md`. Export HTML for a portable bundle.
6. **Publish** — On the Storage tab, publish the export to a local folder, Google Drive, or other destinations.

See [docs/report-builder-cli.md](docs/report-builder-cli.md) for the AI copy-and-run workflow.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production static export |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run slice-clips` | Extract video clips from MDX via FFmpeg |
| `npm run update-clip-urls` | Sync clip URLs from OneDrive/SharePoint JSON |
| `npm run refresh-viewer` | Rebuild `repo-viewer-template` viewer index |

## Report Builder

The Report Builder (`/builder/[slug]`) has four tabs:

| Tab | Purpose |
|-----|---------|
| **Findings** | Edit `findings.md` — thematic findings with timestamped quotes |
| **Tags** | Edit `tags.md` — tag board grouping quotes by codebook tags |
| **Report** | Preview and export HTML; run AI Synthesis to generate `findings.html` |
| **Storage** | Publish exported reports to local folder or Google Drive |

The app uses **file watching** — changes to markdown files on disk refresh the UI automatically. AI analysis runs externally in Cursor; prompts are copied and executed there.

## Cursor skills

Two skills in `.cursor/skills/`:

| Skill | Purpose |
|-------|---------|
| **research-analysis** | Analyze transcripts, extract findings, transcribe videos (Groq/Whisper) |
| **report-publication** | Convert findings to MDX, slice clips, export HTML/PPTX |

Use them when asking the AI to analyze transcripts or publish reports. The app does not call LLM APIs; all AI runs in Cursor via copy-paste prompts.

## Publishing & sharing

- **Local folder** — Export a portable `/export` folder; zip and upload to SharePoint, OneDrive, or Google Drive. Stakeholders can view HTML and watch clips in the browser.
- **Google Drive** — Publish directly to a Drive folder. Optionally host a Research Hub viewer on Vercel that reads from the same folder.

See [docs/setup-hub-server.md](docs/setup-hub-server.md) for Google Drive and viewer setup.

## Requirements

- Node.js 18+
- FFmpeg (for `slice-clips`; [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static) is bundled)
- Optional: `GROQ_API_KEY` in `.env` for Groq/Whisper transcription in Cursor skill

## License

MIT — see [LICENSE](LICENSE).
