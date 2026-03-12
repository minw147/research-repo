// src/lib/quote-parser.ts
import type { ParsedQuote } from "@/types";

/** Remove embedded [MM:SS] / [H:MM:SS] from text (selection or stored quote). Use when creating clips and for display. */
export function stripTimestampFragments(text: string): string {
  return text
    .replace(/\s*\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const QUOTE_REGEX = /^-\s+\*\*"(.+?)"\*\*\s+@\s+(\d{1,2}:\d{2})\s+\((\d+)\s*(?:seconds|s)\)/;

export function parseQuote(line: string): ParsedQuote | null {
  const match = line.match(QUOTE_REGEX);
  if (!match) return null;

  const text = match[1];
  const timestampDisplay = match[2];
  const startSeconds = parseInt(match[3], 10);

  const durationMatch = line.match(/duration:\s*(\d+)s/);
  const durationSeconds = durationMatch ? parseInt(durationMatch[1], 10) : 20;

  const sessionMatch = line.match(/session:\s*(\d+)/);
  const sessionIndex = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;
  const hidden = line.includes("| hidden: true");

  const tagsMatch = line.match(/tags:\s*(.*)$/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3)
    : [];

  return {
    text,
    timestampDisplay,
    startSeconds,
    durationSeconds,
    sessionIndex,
    tags,
    rawLine: line,
    hidden,
  };
}

export function parseQuotesFromMarkdown(markdown: string): ParsedQuote[] {
  return markdown
    .split("\n")
    .map(parseQuote)
    .filter((q): q is ParsedQuote => q !== null);
}

const MAX_TAGS_PER_QUOTE = 3;

export function formatQuoteAsMarkdown(
  text: string,
  startSeconds: number,
  durationSeconds: number,
  sessionIndex: number,
  tags: string[],
  hidden?: boolean
): string {
  const min = Math.floor(startSeconds / 60).toString().padStart(2, "0");
  const sec = (startSeconds % 60).toString().padStart(2, "0");
  let line = `- **"${text}"** @ ${min}:${sec} (${startSeconds}s) | duration: ${durationSeconds}s | session: ${sessionIndex}`;
  if (hidden) {
    line += ` | hidden: true`;
  }
  const cappedTags = tags.slice(0, MAX_TAGS_PER_QUOTE);
  line += ` | tags: ${cappedTags.join(", ")}`;
  return line;
}
