---
name: research-analysis
description: Analyze UX research transcripts to extract insights, pain points, themes, and verbatim quotes with timestamps. Use when analyzing transcripts, transcribing local videos, extracting findings from interviews, identifying user pain points, or preparing for report writing.
---

# Research Analysis

Analyze transcripts in `data/transcripts` (or `content/projects/{slug}/transcripts/` for Report Builder), map to study metadata in `data/research-index.json`, and write findings to `data/analysis/[slug]-findings.md` or `content/projects/{slug}/findings.md`.

**Recommended Workflow:** Use the Report Builder UI at `/builder/[slug]/findings` for a visual, interactive experience (drag-and-drop clips, AI Analyze button, real-time preview).

---

## Codebook locations

When discovering available tags, read from:
- **Global tags:** `data/global-codebook.json`
- **Project tags:** `content/projects/[slug]/codebook.json`

When a prompt already inlines the codebook tag list, use that. Otherwise read the files directly before tagging.

## Steps to Follow

### Step 1: Identify the transcript

- List files in `data/transcripts` or, for Report Builder projects, `content/projects/{slug}/transcripts/`
- If the user specifies a study ID, find the transcript path via `data/research-index.json` → `transcriptFile`

### Step 2: Read and analyze

- Read the full transcript
- Extract: pain points, positive feedback, themes, notable clips
- Capture timestamps for every clip (format: `MM:SS` or `HH:MM:SS`)

### Step 3: Convert timestamps to seconds

- `01:30` → 90 seconds
- `04:45` → 285 seconds
- Use seconds in the quote line format `(90s)`; do not output `<Clip>` in findings—that is for report export only

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

### Step 5: Report back

Tell the researcher:
- Which file was written (findings.md or tags.md)
- How many themes/tags were covered
- Any tags with no evidence (for tags.md)
- Suggested next step (e.g. "Open tags.md in the TagBoard to review evidence")

---

## Quote format (findings.md and tags.md)

Each quote line must use this format so the Report Builder UI can parse timestamps, session, duration, and tags:

```markdown
- **"Full verbatim text from the clip."** @ MM:SS (SECONDSs) | duration: DURATIONs | session: SESSION_INDEX | tags: tag1, tag2
```

### Quote text (CRITICAL)

**Use the full transcript** for each clip. Include the complete verbatim text as spoken in that segment—do not truncate or summarize. The quote text should match exactly what was said from the start timestamp through the duration. If the clip spans multiple lines in the transcript, include all of them.

### Required fields

| Field | Meaning |
|-------|---------|
| **Quote text** | Full verbatim transcript of the clip. Between `**"` and `"**`. Include everything spoken in that segment. |
| **Timestamp** | `@ MM:SS` and `(SECONDSs)` — start time in seconds from the transcript |
| **duration** | Length in seconds (e.g. `15s`). Use 15–20s default if the clip spans multiple lines |
| **session** | Session index (1-based). Use `1` for single-session studies |
| **tags** | Comma-separated tag **ids** from the codebook. Always include the field; use empty `tags: ` when no tag applies. **Maximum 3 tags per quote.** Only assign a tag if ≥80% confident; when uncertain, omit. |

### Example

```markdown
- **"I kept looking for the Visa logo but it was hidden under the fold."** @ 01:30 (90s) | duration: 15s | session: 1 | tags: friction, usability
```

Here the quote text is the full verbatim content of the 15-second clip at 01:30.

---

## Before you begin

- Ensure the transcript exists in the expected path
- For Report Builder: read `data/global-codebook.json` (and project codebook if present) for tag ids

## When transcript is missing (local video only)

Transcribe first using `ai-multimodal` or `.cursor/skills/research-analysis/scripts/transcribe_groq.py`, save to `data/transcripts` or project `transcripts/`, then proceed with analysis (Steps 1–4).

## Report Builder: Adding sessions from the IDE

1. Place video in `content/projects/{slug}/videos/`, transcript in `content/projects/{slug}/transcripts/` (format: `[MM:SS] text` per line)
2. Update `content/projects/{slug}/project.json` — append session object to `sessions` array
3. Tell the researcher: "Session added. Refresh the Report Builder Findings page."

## Scripts

| Script | Purpose |
|--------|---------|
| `transcribe_groq.py` | Transcribe video/audio to timestamped transcript. Requires `GROQ_API_KEY`, `pip install groq`. |

## File locations

| Purpose | Path |
|---------|------|
| Findings | `data/analysis/[slug]-findings.md` or `content/projects/{slug}/findings.md` |
| Tags | `content/projects/{slug}/tags.md` |
| Reports | `content/reports/[slug].mdx` |
| Report Builder project | `content/projects/{slug}/` (videos/, transcripts/, project.json) |

## Do not

- Invent quotes or timestamps
- Skip timestamp conversion (reports need `start={SECONDS}`)
- Truncate or summarize quote text; always use the full verbatim transcript for each clip
- Publish to `content/reports/`—output to findings/tags only
