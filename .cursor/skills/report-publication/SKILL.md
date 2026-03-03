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

7. **Video hosting**: After clips are generated, ask: *"How will you host the video clips—local files only, Google Drive, OneDrive, SharePoint, or another service?"*

   - **Local only**: No change. Clips stay in `public/videos/clips/`. Clip `src` remains `/videos/...` (full video with `#t=start`) or `/videos/clips/...` if using pre-sliced files.

   - **Google Drive / OneDrive / SharePoint / Other**: Ask for the folder path/URL where they will put the clips. Then:
     - Tell the user to **copy or move** the clip files from `public/videos/clips/` to that folder.
     - **Do not rename the clips.** Keep original filenames (e.g. `ai-chip-war-gpu-tpu_01_70s.mp4`) when uploading.
     - Once uploaded, the user provides share links for each clip. Create or update `data/clip-urls-[slug].json` with the mapping, then run `npm run update-clip-urls` to update the MDX.
     - **Google Drive**: Use share links like `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`. Clips render via iframe; "Watch clip at" opens in new tab.
     - **OneDrive / SharePoint**: Use share links (e.g. `https://1drv.ms/v/c/...`). OneDrive blocks iframe embeds, so clips show a "Watch clip at …" link placeholder instead of an inline player. Link opens in new tab.
     - Re-run `npm run dev` or `npm run build` so the standalone HTML export picks up the new URLs.

8. **Portable sharing** (optional): To share a report with local videos like PowerPoint, run `npm run export-portable`. Output goes to `public/reports-portable/` with HTML, `videos/`, and `vtt/` in the same folder. Zip the folder; recipients unzip and run `npx serve .` in that folder, then open `http://localhost:3000`—browsers often block video playback over `file://`, so serving over HTTP is required.

9. **Export to PowerPoint** (optional): To convert a report to .pptx with embedded video clips, run `npm run export-pptx` (or `npm run export-pptx -- --report [slug]`). Requires local clips in `public/videos/clips/`—run `npm run slice-clips` first. Output: `public/reports-pptx/[slug].pptx`. Videos are embedded in the file; share the .pptx alone. Cloud-hosted clips (Drive/OneDrive) show as quote + link if no local file exists; clip-urls mapping is used to resolve local filenames when possible.

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `.cursor/skills/report-publication/scripts/slice-clips.js` | Slice video clips from full video per MDX Clip components | `npm run slice-clips` or `npm run slice-clips -- --report [slug]` — requires full video in `public/videos/` |
| `.cursor/skills/report-publication/scripts/update-clip-urls.js` | Update Clip `src` in MDX from `data/clip-urls-[report].json` | `npm run update-clip-urls` (defaults to ai-chip-war) or pass json + mdx paths |
| `.cursor/skills/report-publication/scripts/export-reports-html.js` | Generate standalone HTML for each report (Export PDF, Download HTML) | Runs automatically on `npm run dev` and `npm run build` via predev/prebuild; writes to `public/reports-standalone/[slug].html`. Use `npm run export-portable` for shareable output with videos/vtt in same folder. |
| `.cursor/skills/report-publication/scripts/export-reports-pptx.js` | Export report to PowerPoint with embedded video clips | `npm run export-pptx` or `npm run export-pptx -- --report [slug]` — requires local clips in `public/videos/clips/`; output in `public/reports-pptx/` |

## File locations

- Findings: `data/analysis/[slug]-findings.md` (input—researcher-edited)
- Reports: `content/reports/[slug].mdx` (output—published)
- Index: `data/research-index.json`
- Clips: `public/videos/clips/` (sliced via `npm run slice-clips`, gitignored)
- Standalone HTML: `public/reports-standalone/` (from export script, gitignored)
- Portable HTML: `public/reports-portable/` (from `npm run export-portable`, gitignored)—includes `videos/` and `vtt/` in same folder for sharing
- PowerPoint: `public/reports-pptx/` (from `npm run export-pptx`, gitignored)—.pptx with embedded clips

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
