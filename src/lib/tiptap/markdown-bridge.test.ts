import { describe, it, expect } from "vitest";
import { preprocessMarkdownForEditor } from "./markdown-bridge";

const QUOTE_LINE =
  `- **"At a really fundamental level..."** @ 02:08 (128s) | duration: 16s | session: 1 | tags: mental-model`;

describe("preprocessMarkdownForEditor", () => {
  it("converts a quote line to a data-type=quote div", () => {
    const result = preprocessMarkdownForEditor(QUOTE_LINE);
    expect(result).toContain('data-type="quote"');
    expect(result).toContain("data-text=");
    expect(result).toContain("data-start-seconds=\"128\"");
    expect(result).toContain("data-duration-seconds=\"16\"");
    expect(result).toContain("data-session-index=\"1\"");
    expect(result).toContain("data-tags=\"mental-model\"");
    expect(result).not.toContain("- **");
  });

  it("leaves non-quote lines unchanged", () => {
    const md = "## My heading\n\nSome paragraph.";
    expect(preprocessMarkdownForEditor(md)).toBe(md);
  });

  it("handles a mix of quote and non-quote lines", () => {
    const md = `## Section\n\n${QUOTE_LINE}\n\nSome text.`;
    const result = preprocessMarkdownForEditor(md);
    expect(result).toContain("## Section");
    expect(result).toContain('data-type="quote"');
    expect(result).toContain("Some text.");
  });

  it("escapes double quotes in quote text", () => {
    const lineWithQuotes =
      `- **"She said \\"hello\\""** @ 01:00 (60s) | duration: 5s | session: 1 | tags: `;
    const result = preprocessMarkdownForEditor(lineWithQuotes);
    expect(result).toContain("&quot;");
  });

  it("handles multiple tags", () => {
    const line =
      `- **"Some text"** @ 00:30 (30s) | duration: 10s | session: 2 | tags: tag-a, tag-b, tag-c`;
    const result = preprocessMarkdownForEditor(line);
    expect(result).toContain('data-tags="tag-a,tag-b,tag-c"');
  });

  it("handles empty content", () => {
    expect(preprocessMarkdownForEditor("")).toBe("");
  });

  it("handles a callout directive without modification", () => {
    const callout = ":::info\nSome insight.\n:::";
    expect(preprocessMarkdownForEditor(callout)).toBe(callout);
  });
});
