// src/lib/quote-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseQuote, parseQuotesFromMarkdown } from "./quote-parser";

describe("parseQuote", () => {
  it("parses full format with all fields", () => {
    const line = '- **"I kept looking for the Visa logo"** @ 01:30 (90s) | duration: 15s | session: 2 | tags: checkout, friction';
    const result = parseQuote(line);
    expect(result).toEqual({
      text: "I kept looking for the Visa logo",
      timestampDisplay: "01:30",
      startSeconds: 90,
      durationSeconds: 15,
      sessionIndex: 2,
      tags: ["checkout", "friction"],
      rawLine: line,
    });
  });

  it("parses minimal format (backwards-compatible)", () => {
    const line = '- **"The button was too small"** @ 03:45 (225s)';
    const result = parseQuote(line);
    expect(result).toEqual({
      text: "The button was too small",
      timestampDisplay: "03:45",
      startSeconds: 225,
      durationSeconds: 20,
      sessionIndex: 1,
      tags: [],
      rawLine: line,
    });
  });

  it("parses old format with seconds in parentheses as words", () => {
    const line = '- **"Old format quote"** @ 02:08 (128 seconds)';
    const result = parseQuote(line);
    expect(result?.startSeconds).toBe(128);
  });

  it("returns null for non-quote lines", () => {
    expect(parseQuote("## Theme 1: Payment")).toBeNull();
    expect(parseQuote("Some paragraph text")).toBeNull();
    expect(parseQuote("")).toBeNull();
  });
});

describe("parseQuotesFromMarkdown", () => {
  it("extracts all quotes from markdown content", () => {
    const md = `# Findings

## Theme 1: Payment Issues

Some context paragraph.

### Key quotes

- **"I kept looking for the Visa logo"** @ 01:30 (90s) | duration: 15s | session: 1 | tags: checkout
- **"The button was too small"** @ 03:45 (225s) | duration: 10s | session: 2

## Theme 2: Navigation

- **"I got lost in the menu"** @ 05:00 (300s)
`;
    const quotes = parseQuotesFromMarkdown(md);
    expect(quotes).toHaveLength(3);
    expect(quotes[0].text).toBe("I kept looking for the Visa logo");
    expect(quotes[1].text).toBe("The button was too small");
    expect(quotes[2].text).toBe("I got lost in the menu");
  });
});
