// src/lib/quote-parser.ts
import type { ParsedQuote } from "@/types";

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

  const tagsMatch = line.match(/tags:\s*(.+?)$/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    text,
    timestampDisplay,
    startSeconds,
    durationSeconds,
    sessionIndex,
    tags,
    rawLine: line,
  };
}

export function parseQuotesFromMarkdown(markdown: string): ParsedQuote[] {
  return markdown
    .split("\n")
    .map(parseQuote)
    .filter((q): q is ParsedQuote => q !== null);
}

export function formatQuoteAsMarkdown(
  text: string,
  startSeconds: number,
  durationSeconds: number,
  sessionIndex: number,
  tags: string[]
): string {
  const min = Math.floor(startSeconds / 60).toString().padStart(2, "0");
  const sec = (startSeconds % 60).toString().padStart(2, "0");
  let line = `- **"${text}"** @ ${min}:${sec} (${startSeconds}s) | duration: ${durationSeconds}s | session: ${sessionIndex}`;
  if (tags.length > 0) {
    line += ` | tags: ${tags.join(", ")}`;
  }
  return line;
}
