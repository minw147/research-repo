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

/**
 * Task 3.3: buildAnalyzeTranscriptsPrompt
 * For initial findings generation from all transcripts.
 */
export function buildAnalyzeTranscriptsPrompt(
  project: Project,
  codebook: Codebook
): string {
  return `Analyze all transcript files in the 'transcripts/' directory for the project "${project.title}".
Context: ${project.persona} testing ${project.product || "the product"}.
Research Plan: ${project.researchPlan || "Not specified"}.

Available tags:
${formatCodebook(codebook)}

Goal: Identify 5-8 key research findings and themes.
For each finding:
1. Provide a clear H2 heading.
2. Write a 1-2 paragraph summary.
3. Include 2-3 supporting verbatim quotes from the transcripts.
   Quotes MUST be in this EXACT format:
   - **"quote text"** @ MM:SS (seconds) | duration: 20s | session: X

  Format the entire response as a single Markdown file.`;
}

/**
 * For analyzing existing findings.md to refine or summarize.
 */
export function buildAnalyzeFindingsPrompt(
  project: Project,
  codebook: Codebook
): string {
  return `Analyze 'findings.md' in the current directory for the project "${project.title}".
Context: ${project.persona} testing ${project.product || "the product"}.

Goal: Identify 3-5 key themes/patterns.
For each theme:
1. Provide a 1-paragraph summary.
2. Include relevant quotes from 'findings.md' (formatted as \`> quote (Session X)\`) as evidence.
3. Suggest potential design improvements or next steps.

Format your response as a professional research report section in Markdown.`;
}

/**
 * Task 3.3: buildAddThemePrompt
 * For adding a specific theme based on existing findings and transcripts.
 */
export function buildAddThemePrompt(
  project: Project,
  themeName: string
): string {
  return `Analyze research data (findings.md and transcripts/) to find evidence for a new theme: "${themeName}".
Project: ${project.title}
Persona: ${project.persona}

Goal: Generate a detailed section for this theme.
1. Provide a summary of how this theme manifested.
2. Include at least 3 supporting verbatim quotes.
   Quotes MUST be in this EXACT format:
   - **"quote text"** @ MM:SS (seconds) | duration: 20s | session: X

Format as Markdown.`;
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
  const sourceFile = source === "findings" ? "findings.md" : "transcripts/*.json";
  const tagList = formatCodebook(codebook);

  return `Review the research data in '${sourceFile}' for the project "${project.title}".
Available tags:
${tagList}

Goal: Suggest tags for the excerpts and findings.
For each significant moment or finding:
1. Quote the text (truncated if long).
2. Suggest 1-3 tags from the available list.
3. Provide a brief reasoning for each suggestion.

Format your response as a Markdown list of suggestions.`;
}

/**
 * Task 3.3: buildGenerateReportPrompt
 * For report generation from findings and tags.
 */
export function buildGenerateReportPrompt(
  project: Project,
  style: "blog" | "slides"
): string {
  return `Review 'findings.md' and 'tags.md' in the current directory for the project "${project.title}".
Style: ${style === "blog" ? "Long-form Blog Post / Case Study" : "Presentation Slides (Markdown)"}.

Goal: Synthesize all findings into a final report.
- Highlight the most critical insights.
- Include evidence (quotes) for each point.
- Provide actionable recommendations.

Format as a professional ${
    style === "blog" ? "research report" : "presentation deck"
  } in Markdown.`;
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
  return `Analyze this UX research transcript for the project "${project.title}".
Context: ${project.persona} testing ${project.product || "the product"}.

Goal: Extract key themes, friction points, and delight moments.
Format: Return a markdown document with H2 themes and bulleted insights.
For every insight, include at least one verbatim quote in this EXACT format:
- **"quote text"** @ MM:SS (seconds) | duration: 20s | session: ${sessionIndex}

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
For every tagged moment, return a quote in this EXACT format:
- **"quote text"** @ MM:SS (seconds) | duration: 20s | session: ${sessionIndex} | tags: tag1, tag2

Transcript:
${transcript}`;
}
