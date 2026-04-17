import { parseQuote } from "@/lib/quote-parser";

/** Escape for use inside double-quoted HTML attributes (matches preprocess output). */
export function escapeQuoteAttr(val: string): string {
  return val.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Reverse `escapeQuoteAttr` when reading `data-text` from the DOM. */
export function unescapeQuoteAttr(val: string): string {
  return val.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

/**
 * Converts quote lines to HTML divs before markdown-it processes the string.
 * tiptap-markdown is configured with html:true so these pass through as-is.
 * The Quote Tiptap node's parseHTML rule matches `div[data-type="quote"]`.
 */
export function preprocessMarkdownForEditor(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      const q = parseQuote(line);
      if (!q) return line;
      return [
        `<div`,
        ` data-type="quote"`,
        ` data-text="${escapeQuoteAttr(q.text)}"`,
        ` data-start-seconds="${q.startSeconds}"`,
        ` data-duration-seconds="${q.durationSeconds}"`,
        ` data-session-index="${q.sessionIndex}"`,
        ` data-tags="${escapeQuoteAttr(q.tags.join(","))}"`,
        ` data-hidden="${q.hidden}"`,
        `></div>`,
      ].join("");
    })
    .join("\n");
}
