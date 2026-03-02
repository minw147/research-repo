---
name: report-publication
description: Publish MDX research reports from findings in data/analysis. Use when the researcher says the report is ready—convert findings to MDX, write to content/reports, embed Clip components.
---

# Report Publication

Publish MDX reports to `content/reports/`. The researcher edits findings in `data/analysis/[slug]-findings.md` (created by **research-analysis**). Only when the researcher says the report is ready (e.g., "publish the report"), use this skill to convert the findings to MDX and publish.

## Workflow (manual step)

1. **Input**: Researcher has edited `data/analysis/[slug]-findings.md` and says they are ready to publish.
2. **Read** the findings file. Parse themes, quotes with timestamps (e.g., `@ 01:10 (70 seconds)`), and actionable insights.
3. **Convert** to MDX: map themes → sections, quotes → `<Clip />` components. Fetch `videoUrl` from `research-index.json` for the study.
4. **Write** to `content/reports/[slug].mdx`.
5. **Index**: Ensure `reportFile` in `data/research-index.json` points to `[slug].mdx`.
6. **Slice clips**: Run `npm run slice-clips` (or `npm run slice-clips -- --report [slug]`) to extract video clips via FFmpeg. Requires the full video in `public/videos/` (local path from `src`, e.g. `/videos/Study_Title.mp4` → `public/videos/Study_Title.mp4`). Output goes to `public/videos/clips/`. Preview at `/videos/clips/` when dev server is running.

7. **Cloud storage (optional)**: After clips are generated, ask: *"Do you want to store these clips in OneDrive, Google Drive, or SharePoint?"*

   - **If yes**: Ask for the folder path/URL where they will put the clips. Then:
     - Tell the user to **copy or move** the clip files from `public/videos/clips/` to that folder.
     - **Do not rename the clips.** Keep original filenames (e.g. `ai-chip-war-gpu-tpu_01_70s.mp4`) when uploading—move them as-is so links match.
     - Once uploaded, the user should share the folder or provide direct links to each clip. Update each `<Clip src="..." />` in the MDX report to use the cloud-hosted URL (direct video link if the service supports it).
     - Re-run `npm run dev` or `npm run build` so the standalone HTML export picks up the new URLs. The "Watch clip at …" links will then point to the cloud-hosted clips.

   - **If no**: Clips remain in `public/videos/clips/` for local use only.

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `.cursor/skills/report-publication/scripts/slice-clips.js` | Slice video clips from full video per MDX Clip components | `npm run slice-clips` or `npm run slice-clips -- --report [slug]` — requires full video in `public/videos/` |
| `.cursor/skills/report-publication/scripts/export-reports-html.js` | Generate standalone HTML for each report (Export PDF, Download HTML) | Runs automatically on `npm run dev` and `npm run build` via predev/prebuild; writes to `public/reports-standalone/[slug].html` |

## File locations

- Findings: `data/analysis/[slug]-findings.md` (input—researcher-edited)
- Reports: `content/reports/[slug].mdx` (output—published)
- Index: `data/research-index.json`
- Clips: `public/videos/clips/` (sliced via `npm run slice-clips`, gitignored)
- Standalone HTML: `public/reports-standalone/` (from export script, gitignored)

## MDX report structure

```mdx
---
title: "[Report Title]"
date: "YYYY-MM-DD"
studyId: "study-XXX"
---

# [Report Title]

[Optional intro paragraph]

## 1. [Section Heading]

[Paragraph with context]

<Clip
  src="[VIDEO_URL]"
  label="[Exact quote from participant]"
  participant="Participant N"
  duration="MM:SS"
  start={SECONDS}
  clipDuration={20}
/>

[Follow-up analysis paragraph]

## Actionable Insight

[Recommendation]
```

## Clip component (required)

**Always** use the Clip component for video evidence. Never output raw timestamps.

```mdx
<Clip
  src="https://1drv.ms/v/s!..." 
  label="I kept looking for the Visa logo but it was hidden."
  participant="Participant 4"
  duration="04:12"
  start={45}
/>
```

| Prop | Required | Description |
|------|----------|-------------|
| `src` | Yes | Video URL (OneDrive/SharePoint/local `/videos/...`) |
| `label` | Yes | Exact participant quote in double quotes |
| `start` | No | Start time in seconds (e.g., 45) |
| `end` | No | End time in seconds; if omitted, uses start + clipDuration |
| `clipDuration` | No | Clip length in seconds (default: 20) |
| `participant` | No | e.g., "Participant 4" |
| `duration` | No | Display only, e.g., "04:12" |

## Adding a new study to research-index.json

```json
{
  "id": "study-XXX",
  "title": "[Study Title]",
  "date": "YYYY-MM-DD",
  "persona": "[Persona Type]",
  "product": "[Product Area]",
  "videoUrl": "[OneDrive/SharePoint URL]",
  "transcriptFile": "[filename].txt",
  "reportFile": "[slug].mdx"
}
```

## Report naming

- Use kebab-case: `checkout-flow-usability.mdx`
- Match `reportFile` in research-index.json

## Parsing findings format

Findings use this quote format: `**"[exact quote]"** @ [MM:SS] ([SECONDS] seconds)`. Extract the quote text and the seconds value for `<Clip label="..." start={SECONDS} />`. Map `## Theme N:` to report sections. Map `## Actionable Insights` to the final section.

## Do not

- Use raw timestamps in prose—always use Clip
- Forget `start={SECONDS}` (must be number, not string)
- Commit video files—they live on OneDrive/SharePoint
- Publish without the researcher explicitly saying the report is ready
- Rename clips when copying to OneDrive/Google Drive/SharePoint—keep original filenames so links match
