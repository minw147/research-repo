// src/lib/prompts.ts
import type { Project } from "@/types";

/**
 * Generates a prompt for thematic analysis of a research transcript.
 * Optimized for Claude.
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
 * Generates a prompt for tagging transcript excerpts based on a codebook.
 * Optimized for Claude.
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
