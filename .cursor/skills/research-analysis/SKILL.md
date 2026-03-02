---
name: research-analysis
description: Analyze UX research transcripts to extract insights, pain points, themes, and verbatim quotes with timestamps. Use when analyzing transcripts, transcribing local videos, extracting findings from interviews, identifying user pain points, or preparing for report writing.
---

# Research Analysis

Analyze transcripts in `data/transcripts`, map to study metadata in `data/research-index.json`, and **write findings to `data/analysis/[slug]-findings.md`**. The researcher can edit that file. Do **not** publish to reports?publication is a separate step (report-publication skill) only when the researcher says the report is ready.

## Before you begin

**Ask the user one question at a time**?do not dive into the transcript until you have context. Ask in this order, waiting for a response before asking the next:

1. **Research plan / research questions** ??Do they have a study plan, script, or specific questions they wanted answered?
2. **Background information** ??Study goals, product context, participant profile, or other framing?
3. **Research flow preference** ??Do they want to follow a different analysis framework or reference another skill?

If the user has a custom workflow (e.g., thematic analysis, Jobs-to-be-Done, journey mapping), use or reference that skill instead. If they say "skip" or "just go ahead" at any step, proceed with defaults and continue to the workflow below.

## When transcript is missing (local video only)

If the user has a **local video** but no transcript (e.g., screen recording, webcam clip):

1. **Transcribe first** with timestamps (required for Clip `start` values). Options:
   - **Groq** (recommended, fast): `python .cursor/skills/research-analysis/scripts/transcribe_groq.py public/videos/file.mp4 -o data/transcripts/study-id.txt` ??requires `GROQ_API_KEY` in `.env`
   - **Gemini**: Use `ai-multimodal` skill with `gemini_batch_process.py --task transcribe`
   - **Whisper**: `whisper video.mp4 --output_format txt --output_dir data/transcripts`
2. Save output to `data/transcripts/[study-id]-transcript.txt` with format `[MM:SS] text` per line
3. Then continue to the analysis workflow below.

## Workflow (when transcript exists)

### Phase 1: Analyze and extract findings

1. **Identify the transcript**
   - List files in `data/transcripts`
   - If user specifies a study ID, find the transcript via `research-index.json` ??`transcriptFile`

2. **Read and analyze**
   - Read the full transcript
   - Extract: pain points, positive feedback, themes, notable quotes
   - **Capture timestamps** for every quote (format: `MM:SS` or `HH:MM:SS`)

3. **Convert timestamps to seconds**
   - `01:30` ??90 seconds
   - `04:45` ??285 seconds
   - Required for `<Clip start={SECONDS} />`

4. **Write findings to `data/analysis/[slug]-findings.md`**

   - Use the study slug (e.g., `ai-chip-war-gpu-tpu`) derived from the report or study ID.
   - The researcher can edit this file directly. Do **not** publish to reports?that happens only when the researcher says the report is ready.

Use this format (researcher-editable):

```markdown
# Study: [title]

**Analysis framework:** [e.g., Thematic analysis]
**Focus:** [Brief focus]
**Audience:** [Who the report is for]

---

## Theme 1: [Theme Name]

[Brief description of the theme.]

### Key quotes

- **"[exact quote]"** @ [MM:SS] ([SECONDS] seconds)
- **"[exact quote]"** @ [MM:SS] ([SECONDS] seconds)

---

## Theme 2: [Theme Name]

...

---

## Actionable Insights

1. [Recommendation 1]
2. [Recommendation 2]
```

5. **Tell the researcher**

   - "Findings saved to `data/analysis/[slug]-findings.md`. You can edit this file. When the report is ready, say **publish the report** and I'll use the report-publication skill to create the report in the research demo."

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `.cursor/skills/research-analysis/scripts/transcribe_groq.py` | Transcribe video/audio to timestamped transcript | `python .cursor/skills/research-analysis/scripts/transcribe_groq.py public/videos/file.mp4 -o data/transcripts/study-id.txt` ? requires `GROQ_API_KEY` in `.env`, `pip install groq` |

## File locations

| Purpose   | Path                              |
|----------|------------------------------------|
| Findings | `data/analysis/[slug]-findings.md` |
| Reports  | `content/reports/[slug].mdx`       |
| Index    | `data/research-index.json`         |

## Transcript sources

| Source     | Transcript   | Action                                                   |
|------------|-------------|----------------------------------------------------------|
| Zoom/Teams | In video    | Use as-is, save to `data/transcripts`                    |
| Local      | None        | Transcribe first (ai-multimodal or Whisper), then analyze |

## Video URL source

For each quote, note which video it comes from. Fetch `videoUrl` from `data/research-index.json` for the study. Clips will use this URL (or pre-sliced clip URLs from SharePoint/OneDrive).

## Do not

- Invent quotes or timestamps
- Skip timestamp conversion (reports need `start={SECONDS}`)
- Publish to `content/reports/`?output findings to `data/analysis/` only; the researcher triggers publication when ready
