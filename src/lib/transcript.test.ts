// src/lib/transcript.test.ts
import { describe, it, expect } from "vitest";
import { parseTranscript, getTranscriptExcerpt } from "./transcript";

describe("parseTranscript", () => {
  it("parses [MM:SS] format", () => {
    const raw = "[00:15] Hello there\n[00:30] How are you";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ sec: 15, text: "Hello there" });
    expect(lines[1]).toEqual({ sec: 30, text: "How are you" });
  });

  it("merges continuation lines", () => {
    const raw = "[00:15] Hello there\ncontinuation text\n[00:30] Next";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0].text).toBe("Hello there continuation text");
  });

  it("handles empty input", () => {
    expect(parseTranscript("")).toEqual([]);
  });
});

describe("getTranscriptExcerpt", () => {
  it("extracts lines within range", () => {
    const lines = [
      { sec: 10, text: "A" },
      { sec: 20, text: "B" },
      { sec: 30, text: "C" },
      { sec: 40, text: "D" },
    ];
    expect(getTranscriptExcerpt(lines, 15, 35)).toBe("B C");
  });
});
