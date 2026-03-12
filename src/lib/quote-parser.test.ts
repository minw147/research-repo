// src/lib/quote-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseQuote, parseQuotesFromMarkdown, formatQuoteAsMarkdown, stripTimestampFragments } from "./quote-parser";

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
      hidden: false,
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
      hidden: false,
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

  it("caps at 3 tags when parsing (max tags per quote)", () => {
    const line = '- **"Too many tags"** @ 01:00 (60s) | duration: 10s | session: 1 | tags: a, b, c, d, e';
    const result = parseQuote(line);
    expect(result?.tags).toEqual(["a", "b", "c"]);
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

describe("stripTimestampFragments", () => {
  it("removes [MM:SS] and [H:MM:SS] from text", () => {
    expect(stripTimestampFragments("Hello [05:10] world")).toBe("Hello world");
    expect(stripTimestampFragments("[00:00] Start here")).toBe("Start here");
    expect(stripTimestampFragments("Before [1:30:45] after")).toBe("Before after");
  });
  it("collapses multiple spaces and trims", () => {
    expect(stripTimestampFragments("  [05:09]  [05:10]  text  ")).toBe("text");
  });
});

describe("formatQuoteAsMarkdown", () => {
  it("always includes | tags: in output (empty when no tags)", () => {
    const line = formatQuoteAsMarkdown("Hello", 90, 15, 1, []);
    expect(line).toContain("| tags: ");
    expect(line).toMatch(/\|\s*tags:\s*$/);
    const parsed = parseQuote(line);
    expect(parsed?.tags).toEqual([]);
  });

  it("includes tag ids when provided", () => {
    const line = formatQuoteAsMarkdown("Hi", 60, 10, 2, ["usability", "friction"]);
    expect(line).toContain("| tags: usability, friction");
    const parsed = parseQuote(line);
    expect(parsed?.tags).toEqual(["usability", "friction"]);
  });
});
