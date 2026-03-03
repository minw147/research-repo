# Research Repository

A local-first UX research repository built with Next.js. Analyze interview transcripts, publish MDX reports with embedded video clips, and share findings as standalone HTML or PowerPoint. Designed for researchers using [Cursor](https://cursor.com) and local AI.

## What it does

- **Transcript analysis** — Place transcripts in `data/transcripts`, use Cursor to extract themes, pain points, and verbatim quotes with timestamps. *Requires an API key (e.g. Groq) for AI transcription; if you don't have one, use auto-generated transcripts from Teams, Zoom, or other services.*
- **MDX reports** — Publish findings to `content/reports` as MDX with embedded `<Clip />` components for video evidence
- **Video clips** — Slice clips from full videos via FFmpeg based on report timestamps
- **Export** — Generate standalone HTML (portable, with videos) or PowerPoint with embedded clips
- **Cursor skills** — Built-in skills guide AI to analyze transcripts and publish reports the right way

## Quick start

```bash
git clone https://github.com/minw147/research-repo.git
cd research-repo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard shows sample studies; click through to view reports.

## Project structure

```
research-repo/
├── data/
│   ├── transcripts/       # Raw transcript files (.txt, timestamped)
│   ├── analysis/          # Findings drafts (research-analysis output)
│   ├── drafts/            # Work-in-progress
│   └── research-index.json   # Study metadata (video URLs, report links)
├── content/reports/      # Published MDX reports
├── public/videos/        # Full videos + sliced clips (gitignored)
├── .cursor/skills/      # Cursor skills (research-analysis, report-publication)
└── src/                 # Next.js app (dashboard, report view, Clip component)
```

## Adding your own research

1. **Add a transcript** — Place a timestamped `.txt` file in `data/transcripts` (format: `[MM:SS] text` per line).
2. **Register the study** — Add an entry to `data/research-index.json` with `videoUrl`, `transcriptFile`, and `reportFile`.
3. **Analyze** — In Cursor, ask to analyze the transcript. The **research-analysis** skill writes findings to `data/analysis/[slug]-findings.md`.
4. **Publish** — When ready, ask Cursor to publish the report. The **report-publication** skill converts findings to MDX with `<Clip />` components.
5. **Slice clips** — Run `npm run slice-clips` to extract clips from your full video (place it in `public/videos/`). See [public/videos/README.md](public/videos/README.md).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (exports HTML on predev) |
| `npm run build` | Build static export |
| `npm run slice-clips` | Slice video clips from MDX reports via FFmpeg |
| `npm run export-portable` | Bundle HTML + videos + captions for offline sharing |
| `npm run export-pptx` | Export report to PowerPoint with embedded clips |
| `npm run update-clip-urls` | Update Clip URLs from JSON (OneDrive/SharePoint mapping) |

## Cursor skills

Two skills live in `.cursor/skills/`:

| Skill | Purpose |
|-------|---------|
| **research-analysis** | Analyze transcripts, extract findings, transcribe videos (Groq/Whisper) |
| **report-publication** | Convert findings to MDX, slice clips, export HTML/PPTX |

Open this repo in Cursor; the skills are auto-discovered. Use them when asking the AI to analyze transcripts or publish reports.

## Video setup

Videos are **gitignored** (raw files and clips). For local development:

- Place full videos in `public/videos/`
- Run `npm run slice-clips` to extract clips for report timestamps
- For production sharing, host clips on OneDrive, SharePoint, or Google Drive and use `data/clip-urls-[report].json` + `npm run update-clip-urls`

See [public/videos/README.md](public/videos/README.md) for details.

## Requirements

- Node.js 18+
- FFmpeg (for `slice-clips`; [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static) is bundled)
- Optional: [Groq](https://groq.com) API key in `.env` for transcription (`GROQ_API_KEY`)

## License

MIT — see [LICENSE](LICENSE).
