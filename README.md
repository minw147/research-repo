# Research Repository

Local-first UX research repo built with Next.js. Researchers use Cursor and local AI to analyze transcripts and publish MDX reports with embedded video clips.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (runs HTML export on predev) |
| `npm run slice-clips` | Slice video clips from reports via FFmpeg |
| `npm run build` | Build static export |

## Project skills (Cursor)

- **research-analysis** — Analyze transcripts, extract findings, transcribe videos
- **report-publication** — Publish MDX reports from findings, slice clips, export HTML

## Video setup

Videos are gitignored. Place full videos in `public/videos/` for local dev. Run `npm run slice-clips` to extract clips. See [public/videos/README.md](public/videos/README.md).
