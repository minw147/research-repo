// src/lib/prompts.ts
import type { Project, Codebook } from "@/types";

/**
 * Helper to format codebook for prompts
 */
function formatCodebook(codebook: Codebook): string {
  if (!codebook.tags || codebook.tags.length === 0) return "No tags defined.";
  return codebook.tags
    .map((t) => `- ${t.label} (ID: ${t.id}, Category: ${t.category})`)
    .join("\n");
}

/** Instruction block for IDE-based AI agents. Assumes the user runs this prompt in Cursor or similar. */
const OUTPUT_FORMAT_PREFIX = `**Output format (CRITICAL):**
- Produce the RAW CONTENT for the target file directly.
- DO NOT wrap your output in a markdown code block (no \` \` \`md or \` \` \`mdx).
- DO NOT include YAML frontmatter (no \`---\` blocks).
- DO NOT use <Clip /> components; use the bulleted quote format instead.
- NO preamble, NO lead-in text, NO "Here is the file content".

**MANDATORY: Follow the skill.** Read \`.cursor/skills/research-analysis/SKILL.md\` and execute its Steps 1–3, then the appropriate Step 4 (4a for findings.md, 4b for tags.md). Use the quote format and conventions from the "Quote format" section exactly.

**ANTI-HALLUCINATION (CRITICAL):** NEVER fabricate, paraphrase, summarize, or blend quotes. Every quote must be the exact verbatim text found in the transcript at the specified timestamp. If you cannot find the exact text in the transcript for a claimed timestamp, omit that quote entirely. It is better to have fewer quotes than one fabricated quote.

---
`;

/**
 * Build a consistent project context block so the AI always knows which project and scope.
 * Includes the project directory path and sessions (by default all sessions in the project).
 */
function projectContextBlock(project: Project): string {
  const projectDir = `content/projects/${project.id}`;
  const sessions = project.sessions ?? [];
  const sessionsList =
    sessions.length === 0
      ? "No sessions listed; use all transcripts in the project if present."
      : sessions
        .map(
          (s, i) =>
            `  ${i + 1}. **${s.id}** — participant: ${s.participant}, transcript: \`transcripts/${s.transcriptFile}\``
        )
        .join("\n");

  return `## Current project
- **Project directory:** \`${projectDir}\` (relative to repo root)
- **Title:** ${project.title}
- **Project ID:** ${project.id}
- **Researcher:** ${project.researcher}
- **Date:** ${project.date}
- **Persona:** ${project.persona}
- **Product / focus:** ${project.product ?? "Not specified"}
- **Methodology:** ${project.methodology ?? "Mixed methods (interviews + usability)"}
- **Research plan / goals:** ${project.researchPlan ?? "Not specified"}

### Sessions to analyze (default: all)
${sessionsList}

Read and write files under \`${projectDir}\`. Ensure the repo is opened so that path exists.
`;
}

/**
 * Initial findings: create or rewrite findings.md from transcripts.
 * Specifies project and sessions (default: all). Output = full findings.md content only.
 */
export function buildAnalyzeTranscriptsPrompt(
  project: Project,
  codebook: Codebook
): string {
  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Create (or rewrite) the file \`findings.md\` for this project.

Analyze the transcript(s) for the sessions listed above (in \`transcripts/\` inside the project directory). Use all sessions by default unless the user specifies otherwise.

Available tags:
${formatCodebook(codebook)}

**Goal:** Produce the complete contents for \`findings.md\`.
- Follow \`.cursor/skills/research-analysis/SKILL.md\` Steps 1–3, then Step 4a, and the "Quote format" section.
- Identify 5–8 key research findings and themes.
- For each finding: H2 heading, 1–2 paragraph summary, 2–3 supporting quotes.
- **Quote text:** Use the full verbatim transcript for each clip—include everything spoken in that segment. Do not truncate or summarize.
- **Duration:** Calculate from the transcript timestamps (end − start). Only estimate 15–20s when transcript timestamps are unavailable for a segment.
- Each quote MUST be exactly one line: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: DURATIONs | session: X | tags: tag1, tag2\`
- Up to 3 tags per quote; only assign if ≥80% confident; otherwise leave \`tags: \` empty.

**Finding quality checklist — each finding must:**
1. Be supported by ≥2 quotes from different sessions (when multiple sessions exist)
2. Distinguish between **frequency** (how many participants) and **severity/impact** (how much it matters)
3. Include a concrete **implication or recommendation** — not just "users said X" but "therefore we should Y"
4. Have a concise, descriptive H2 title (not just a tag name — describe the insight)

**Output Rule:** Your output will be saved directly to \`findings.md\`. Do not include preamble or code blocks.`;
}

/**
 * Refine findings: modify existing findings.md (improve structure, merge themes, add evidence).
 * Specifies project and sessions. Output = full modified findings.md content only.
 */
export function buildAnalyzeFindingsPrompt(
  project: Project,
  codebook: Codebook
): string {
  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Update the file \`findings.md\` for this project.

Read the existing \`findings.md\` in the project directory. You may also re-check the transcripts for the sessions listed above if you need more evidence.

**Goal:** Produce the updated contents for \`findings.md\` (refined themes, clearer structure, better quotes).
- Follow \`.cursor/skills/research-analysis/SKILL.md\` Steps 1–3, then Step 4a, and the "Quote format" section.
- Identify 3–5 key themes; merge or split sections as needed.
- **Quote text:** Use the full verbatim transcript for each clip. Do not truncate or summarize.
- **Duration:** Calculate from the transcript timestamps (end − start). Only estimate 15–20s when transcript timestamps are unavailable.
- Keep or add quotes in the exact line format: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: DURATIONs | session: X | tags: tag1, tag2\`
- Use the available tags when they fit; up to 3 per quote.

**Finding quality checklist — each finding must:**
1. Be supported by ≥2 quotes from different sessions (when multiple sessions exist)
2. Distinguish between **frequency** (how many participants) and **severity/impact** (how much it matters)
3. Include a concrete **implication or recommendation**

**Output Rule:** Your output will be saved directly to \`findings.md\`. Do not include preamble or code blocks.`;
}

/**
 * Task 3.3: buildAddThemePrompt
 * For adding a specific theme based on existing findings and transcripts.
 */
export function buildAddThemePrompt(
  project: Project,
  themeName: string
): string {
  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Add a new theme to the research findings.

Analyze research data (findings.md and transcripts/) in the current project to find evidence for a new theme: "${themeName}".

**Goal:** Generate the markdown section for this theme.
- Follow \`.cursor/skills/research-analysis/SKILL.md\` Steps 1–3, then Step 4a, and the "Quote format" section.
1. Provide a summary of how this theme manifested.
2. Include at least 3 supporting quotes. **Quote text** = full verbatim transcript of the clip.
   Quotes MUST be in this EXACT format: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: DURATIONs | session: X | tags: tag1, tag2\`
   **Duration:** Calculate from transcript timestamps (end − start). Only estimate 15–20s when timestamps unavailable.
   Tagging rules: Up to 3 tags per quote.

**Output Rule:** Provide ONLY the new markdown section. No preamble or code blocks.`;
}

/**
 * Task 3.3: buildGenerateTagsPrompt
 * For tag board - suggests tags for excerpts.
 */
export function buildGenerateTagsPrompt(
  project: Project,
  codebook: Codebook,
  source: "findings" | "transcripts"
): string {
  const tagList = formatCodebook(codebook);

  if (source === "findings") {
    return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Create (or update) the file \`tags.md\` by parsing \`findings.md\` and reorganizing all quotes by codebook tags.

Read \`findings.md\` in the current project directory. Extract every quote line. Assign up to 3 tags from the codebook where you are at least 80% confident; when uncertain, leave \`tags: \` empty.

Available tags:
${tagList}

**Goal:** Produce the complete contents for \`tags.md\` that groups quotes under tag headings.
- Follow \`.cursor/skills/research-analysis/SKILL.md\` Steps 1–3, then Step 4b, and the "Quote format" section.
- **Quote text:** Use the full verbatim transcript for each clip. Do not truncate or summarize.
- Structure: H1 \`# Tag Board: [Project Title]\`, then H2 \`## [Tag Label]\` with bulleted quotes
- Each quote MUST be exactly one line: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: 20s | session: X | tags: tag1, tag2\`

**Output Rule:** Your response will be saved directly to \`tags.md\`. Do not include preamble, YAML, or code blocks.`;
  }

  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Create (or update) the file \`tags.md\` by scanning all session transcripts and extracting evidence for codebook tags.

Scan all transcripts in the project. For each tag in the codebook, find 3–5 high-quality quotes that represent that concept.

Available tags:
${tagList}

**Goal:** Produce the complete contents for \`tags.md\` that groups quotes under tag headings.
- Follow \`.cursor/skills/research-analysis/SKILL.md\` Steps 1–3, then Step 4b, and the "Quote format" section.
- **Quote text:** Use the full verbatim transcript for each clip. Do not truncate or summarize.
- Structure: H1 \`# Tag Board: [Project Title]\`, then H2 \`## [Tag Label]\` with bulleted quotes
- Each quote MUST be exactly one line: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: 20s | session: X | tags: tag1, tag2\`

**Output Rule:** Your response will be saved directly to \`tags.md\`. Do not include preamble, YAML, or code blocks.`;
}

/** Report-specific output prefix (uses report-publication skill, allows HTML output without markdown blocks). */
const REPORT_OUTPUT_PREFIX = `**Output format (CRITICAL):**
- Produce the RAW HTML CONTENT for the target file directly.
- DO NOT wrap your output in a markdown code block (no \\\`\\\`\\\`html).
- NO preamble, NO lead-in text.
- APPLY the /ui-ux-pro-max aesthetics per the skill guidelines.

**Visual Design Principles (blog post style — presentable & scannable):**
- The report should read like a polished Medium/Substack article — engaging, scannable, and ready to present to stakeholders.
- **Information hierarchy:** Use large bold headings (H1/H2), short paragraphs, and generous whitespace.
- **Information panels / callout boxes:** Wrap key statistics, critical findings, or important caveats in styled bordered boxes (e.g., light tinted background + left accent border). Use these for: key metrics, severity callouts, participant count, methodology summary.
- **Visual elements:** Add emojis as bullet decorators (📊 🔍 ⚡ 💡 🎯), subtle dividers between sections, and icon-like indicators for finding severity (🔴 critical / 🟡 moderate / 🟢 positive).
- **Typography:** Use a clean sans-serif stack (Inter, system-ui). Headings should be significantly larger than body text. Bold key phrases within paragraphs for easy scanning.
- **Data tables:** When comparing perspectives across sessions or participants, use clean bordered tables with alternating row tints.
- **Executive summary:** Start with a concise 2–3 paragraph summary that a busy stakeholder can read in 30 seconds — key findings + top recommendations.
- **Recommendations section:** End with numbered, actionable recommendations. Each should be one sentence: what to do + why.
- **Light backgrounds only throughout — no dark sections.** Create visual hierarchy with borders, subtle tints (e.g., primary/10), left-accent borders, and light shaded panels — never dark fills.

**MANDATORY: Follow the skill.** Read \`.cursor/skills/report-publication/SKILL.md\` and execute its steps to build a beautiful \`findings.html\`.

---
`;

/**
 * Other templates: context for findings.md / tags.md (uses research-analysis skill).
 */
export type OtherTemplateContext = "findings" | "tags" | "report";

export type OtherTemplateId =
  | "streamline-markdown"
  | "add-research-question"
  | "review-notes-modify"
  | "reorganize-themes"
  | "add-participant-table"
  | "fix-quote-format"
  | "streamline-report"
  | "add-executive-summary"
  | "restructure-report";

const OTHER_TEMPLATES_FINDINGS_TAGS: { id: OtherTemplateId; label: string; sub: string }[] = [
  { id: "streamline-markdown", label: "Streamline markdown", sub: "Fix formatting, preserve content" },
  { id: "add-research-question", label: "Add research question", sub: "Incorporate new question into findings" },
  { id: "review-notes-modify", label: "Review notes and modify", sub: "Merge notes file into findings" },
  { id: "reorganize-themes", label: "Reorganize themes", sub: "Merge, split, reorder sections" },
  { id: "add-participant-table", label: "Add participant table", sub: "Insert sessions/participants table" },
  { id: "fix-quote-format", label: "Fix quote format", sub: "Ensure all quotes match SKILL format" },
];

const OTHER_TEMPLATES_REPORT: { id: OtherTemplateId; label: string; sub: string }[] = [
  { id: "streamline-report", label: "Streamline report", sub: "Fix formatting, preserve content" },
  { id: "add-executive-summary", label: "Add executive summary", sub: "Insert summary at top" },
  { id: "restructure-report", label: "Restructure report", sub: "Reorganize sections for clarity" },
  { id: "add-participant-table", label: "Add participant table", sub: "Insert sessions/participants table" },
];

export function getOtherTemplatesForContext(context: OtherTemplateContext): { id: OtherTemplateId; label: string; sub: string; targetFile: string }[] {
  if (context === "report") {
    return OTHER_TEMPLATES_REPORT.map((t) => ({ ...t, targetFile: "findings.html" }));
  }
  return OTHER_TEMPLATES_FINDINGS_TAGS.map((t) => ({
    ...t,
    targetFile: getOtherTemplateTargetFile(t.id, context),
  }));
}

export function buildOtherTemplatePrompt(
  project: Project,
  templateId: OtherTemplateId,
  context: OtherTemplateContext,
  codebook?: Codebook
): string {
  const projectBlock = projectContextBlock(project);
  const prefix = context === "report" ? REPORT_OUTPUT_PREFIX : OUTPUT_FORMAT_PREFIX;

  switch (templateId) {
    case "streamline-markdown": {
      const target = context === "tags" ? "tags.md" : "findings.md";
      return `${prefix}${projectBlock}

**Task:** Streamline the formatting of \`${target}\` for this project.

Read the existing \`${target}\`. Fix inconsistencies: heading levels (consistent H2 for themes), list formatting, and quote line format per \`.cursor/skills/research-analysis/SKILL.md\`. Preserve all content—only improve structure and formatting.

**Output Rule:** Your output will be saved directly to \`${target}\`. Do not include preamble or code blocks.`;
    }
    case "add-research-question": {
      return `${prefix}${projectBlock}

**Task:** Add a new research question to \`findings.md\` for this project.

Research question to address: [RESEARCH_QUESTION]

Read the existing \`findings.md\` and transcripts. Add a new theme/section that addresses this question with evidence from the data. Use the quote format from \`.cursor/skills/research-analysis/SKILL.md\` (full verbatim transcript per quote, timestamp + duration).

**Output Rule:** Produce the complete updated \`findings.md\`. Do not include preamble or code blocks.`;
    }
    case "review-notes-modify": {
      return `${prefix}${projectBlock}

**Task:** Review a notes file and incorporate its insights into \`findings.md\`.

Notes file path (relative to repo root): [NOTES_FILE_PATH]

Read the notes file at the path above. Extract insights, themes, or quotes. Merge them into the existing \`findings.md\`—add new sections or integrate into existing themes. Preserve the quote format from \`.cursor/skills/research-analysis/SKILL.md\`.

**Output Rule:** Produce the complete updated \`findings.md\`. Do not include preamble or code blocks.`;
    }
    case "reorganize-themes": {
      return `${prefix}${projectBlock}

**Task:** Reorganize the themes in \`findings.md\` for this project.

Read the existing \`findings.md\`. Merge similar sections, split large ones, reorder for clarity. Preserve all quotes and their format. Improve flow and logical grouping.

**Output Rule:** Produce the complete reorganized \`findings.md\`. Do not include preamble or code blocks.`;
    }
    case "add-participant-table": {
      if (context === "report") {
        return `${REPORT_OUTPUT_PREFIX}${projectBlock}

**Task:** Add a participant/session context table to \`findings.html\` for this project.

Read \`findings.html\` and \`project.json\` (sessions). Insert an HTML table near the top summarizing participants and sessions. Preserve the rest of the report.

**Output Rule:** Produce the complete \`findings.html\` with the new table. Do not include preamble or code blocks.`;
      }
      return `${prefix}${projectBlock}

**Task:** Add a participant/session context table to \`findings.md\` for this project.

Read \`findings.md\` and \`project.json\` (sessions). Insert a markdown table near the top (after intro if present) summarizing participants and sessions, e.g.:

| Session | Participant | Notes |
|---------|-------------|-------|
| 1       | ...         | ...   |

Keep existing content. The table helps readers understand the research context.

**Output Rule:** Produce the complete \`findings.md\` with the new table. Do not include preamble or code blocks.`;
    }
    case "fix-quote-format": {
      const target = context === "tags" ? "tags.md" : "findings.md";
      return `${prefix}${projectBlock}

**Task:** Fix quote format in \`${target}\` for this project.

Read the existing \`${target}\`. Ensure every quote line matches the format in \`.cursor/skills/research-analysis/SKILL.md\`: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: DURATIONs | session: X | tags: ...\`. Fix any malformed lines. Preserve content.

**Output Rule:** Produce the complete corrected \`${target}\`. Do not include preamble or code blocks.`;
    }
    case "streamline-report": {
      return `${REPORT_OUTPUT_PREFIX}${projectBlock}

**Task:** Streamline the formatting of \`findings.html\` for this project.

Read the existing \`findings.html\`. Fix formatting inconsistencies. Preserve content, HTML structure, and pseudo-video components. Improve structure and readability.

**Output Rule:** Produce the complete updated \`findings.html\`. Do not include preamble or code blocks.`;
    }
    case "add-executive-summary": {
      return `${REPORT_OUTPUT_PREFIX}${projectBlock}

**Task:** Add an executive summary to \`findings.html\` for this project.

Read the existing \`findings.html\` and \`findings.md\`. Add a concise executive summary (2–4 paragraphs) near the top that distills the key insights and recommendations. Preserve the rest of the report.

**Output Rule:** Produce the complete \`findings.html\` with the new summary. Do not include preamble or code blocks.`;
    }
    case "restructure-report": {
      return `${REPORT_OUTPUT_PREFIX}${projectBlock}

**Task:** Restructure \`findings.html\` for this project.

Read the existing \`findings.html\`. Reorganize sections for better flow—merge, split, or reorder. Improve narrative clarity. Preserve all content, HTML layout, and pseudo-video clips.

**Output Rule:** Produce the complete restructured \`findings.html\`. Do not include preamble or code blocks.`;
    }
  }

  return `${prefix}${projectBlock}\n**Task:** [Unknown template]`;
}

/** Resolve target file for other-template + report context (add-participant-table on report). */
export function getOtherTemplateTargetFile(templateId: OtherTemplateId, context: OtherTemplateContext): string {
  if (context === "report") return "findings.html";
  if (templateId === "fix-quote-format" && context === "tags") return "tags.md";
  if (["add-research-question", "review-notes-modify", "reorganize-themes", "add-participant-table"].includes(templateId)) return "findings.md";
  return context === "tags" ? "tags.md" : "findings.md";
}

/**
 * Task 3.3: buildGenerateReportPrompt
 * For report generation from findings and tags.
 */
export function buildGenerateReportPrompt(
  project: Project,
  style: "blog" | "slides"
): string {
  const slug = project.id;
  const sessions = project.sessions ?? [];
  const videoUrlBlock =
    sessions.length === 0
      ? "No sessions; video URLs not applicable."
      : `**Video base URL:** \`/api/projects/${slug}/files/videos/[VIDEO_FILE]\`
**Session → video file mapping (use for each quote's session):**
${sessions
  .map(
    (s, i) =>
      `  - Session ${i + 1} (id: ${s.id}): \`${s.videoFile}\` → \`/api/projects/${slug}/files/videos/${s.videoFile}\``
  )
  .join("\n")}`;

  return `${REPORT_OUTPUT_PREFIX}${projectContextBlock(project)}

${videoUrlBlock}

**Task:** Generate a final HTML research report (\`findings.html\`).

**For this task also use:** \`.cursor/skills/report-publication/SKILL.md\` for steps, UI guidelines, and pseudo-video clip generation.

Review \`findings.md\` and \`tags.md\` in the current project directory.

Style: ${style === "blog" ? "Long-form Blog Post / Case Study" : "Presentation Slides"}.

Goal: Synthesize all findings into a final report.
- Highlight the most critical insights.
- Add advanced visuals, layouts, info panels, emojis.
- Include evidence (pseudo-video clips) for each point (play/stop via timecodes). Use the video URLs above—append \`#t=START_seconds,END_seconds\` for clip range.
- Provide actionable recommendations.
- Use light backgrounds only throughout—no dark header or recommendation sections (research reports use light, professional layouts).

Format as a professional, beautiful ${style === "blog" ? "research report HTML" : "presentation deck HTML"}.`;
}

/**
 * Cross-session comparative analysis: compare responses across sessions for a theme or feature.
 */
export function buildCrossSessionPrompt(
  project: Project,
  themeOrFeature: string
): string {
  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

**Task:** Cross-session comparative analysis for the theme/feature: "${themeOrFeature}"

Read ALL session transcripts in the project directory. Compare how different participants responded to or experienced this theme/feature.

**Analysis framework:**
1. **Agreement / consensus:** What did most participants agree on? Quote the majority view with evidence from ≥2 sessions.
2. **Disagreement / divergence:** Where did participants contradict each other? Present both sides with quotes.
3. **Edge cases / outliers:** Did any single participant have a notably different experience? Flag it explicitly.
4. **Frequency vs. severity:** How many participants mentioned this? How impactful was it for each?
5. **Behavioral patterns:** Did participants approach or talk about this differently based on their background, role, or usage patterns?

**Output format:** Write a comparative analysis section (H2: the theme/feature name) suitable for insertion into \`findings.md\`.
- Use the standard quote format: \`- **"full quote text"** @ MM:SS (SECONDSs) | duration: DURATIONs | session: X | tags: tag1, tag2\`
- **Duration:** Calculate from transcript timestamps (end − start). Only estimate 15–20s when timestamps unavailable.
- Clearly attribute each quote to its session/participant.
- End with a synthesis: what does this comparison mean for the product/feature?

**Output Rule:** Produce the comparative analysis section only. No preamble or code blocks.`;
}

/**
 * Deprecated: Use buildAnalyzeTranscriptsPrompt instead for multi-session analysis.
 * Keeping for single transcript analysis if needed.
 */
export function generateThematicAnalysisPrompt(
  project: Project,
  transcript: string,
  sessionIndex: number
): string {
  return `${OUTPUT_FORMAT_PREFIX}${projectContextBlock(project)}

Analyze this UX research transcript (session ${sessionIndex}).

Goal: Extract key themes, friction points, and delight moments.
Format: Return a markdown document with H2 themes and bulleted insights.
For every insight, include at least one quote. Quote text = full verbatim transcript of the clip. EXACT format:
- **"full quote text"** @ MM:SS (seconds) | duration: 20s | session: ${sessionIndex}

Transcript:
${transcript}`;
}

/**
 * Deprecated: Use buildGenerateTagsPrompt instead.
 */
export function generateTaggingPrompt(
  transcript: string,
  codebook: string,
  sessionIndex: number
): string {
  return `Using this codebook:
${codebook}

Label the following transcript excerpts with the appropriate tags. 
For every tagged moment, return a quote. Quote text = full verbatim transcript of the clip. EXACT format:
- **"full quote text"** @ MM:SS (seconds) | duration: 20s | session: ${sessionIndex} | tags: tag1, tag2

Transcript:
${transcript}`;
}
