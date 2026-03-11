// src/lib/extract-project-tags.ts
import fs from "fs";
import path from "path";
import { parseQuotesFromMarkdown } from "./quote-parser";
import { mergeCodebooks } from "./codebook";
import type { Project, Codebook, CodebookTag } from "@/types";

export interface QuoteEntry {
  text: string;
  timestampDisplay: string;
  startSeconds: number;
  durationSeconds: number;
  sessionIndex: number;
  tags: string[];
  clipFile: string; // filename only: "clip-{sessionIndex}-{startSeconds}s.mp4"
}

export interface ProjectTagData {
  quotes: QuoteEntry[];
  codebook: CodebookTag[];
}

export function extractProjectTagData(
  projectDir: string,
  project: Pick<Project, "id" | "codebookData">,
  baseDir: string = process.cwd()
): ProjectTagData {
  const tagsPath = path.join(projectDir, "tags.md");
  if (!fs.existsSync(tagsPath)) return { quotes: [], codebook: [] };

  try {
    const markdown = fs.readFileSync(tagsPath, "utf-8");
    const parsed = parseQuotesFromMarkdown(markdown);

    const quotes: QuoteEntry[] = parsed
      .filter(q => !q.hidden)
      .map(q => ({
        text: q.text,
        timestampDisplay: q.timestampDisplay,
        startSeconds: q.startSeconds,
        durationSeconds: q.durationSeconds,
        sessionIndex: q.sessionIndex,
        tags: q.tags,
        clipFile: `clip-${q.sessionIndex}-${q.startSeconds}s.mp4`,
      }));

    // Load global codebook
    let globalCodebook: Codebook = { tags: [], categories: [] };
    const globalPath = path.join(baseDir, "data", "global-codebook.json");
    if (fs.existsSync(globalPath)) {
      globalCodebook = JSON.parse(fs.readFileSync(globalPath, "utf-8"));
    }

    // Merge with project custom codebook if present
    const merged = project.codebookData
      ? mergeCodebooks(globalCodebook, project.codebookData)
      : globalCodebook;

    // Only include tags actually used in these quotes
    const usedTagIds = new Set(quotes.flatMap(q => q.tags));
    const codebook: CodebookTag[] = merged.tags.filter(t => usedTagIds.has(t.id));

    return { quotes, codebook };
  } catch (err) {
    console.error("[extractProjectTagData] Failed to process tags.md:", err);
    return { quotes: [], codebook: [] };
  }
}
