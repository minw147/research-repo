// src/lib/transcript.test.ts
import { describe, it, expect } from "vitest";
import { parseTranscript, getTranscriptExcerpt, getClipVtt } from "./transcript";

describe("parseTranscript", () => {
  it("parses [MM:SS] format", () => {
    const raw = "[00:15] Hello there\n[00:30] How are you";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ sec: 15, text: "Hello there" });
    expect(lines[1]).toEqual({ sec: 30, text: "How are you" });
  });

  it("parses [HH:MM:SS] format", () => {
    const raw = "[01:02:03] Long ago\n[1:02:03] Also long ago";
    const lines = parseTranscript(raw);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ sec: 3723, text: "Long ago" });
    expect(lines[1]).toEqual({ sec: 3723, text: "Also long ago" });
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

describe("getClipVtt", () => {
  it("generates valid WEBVTT content with rebased timestamps", () => {
    const lines = [
      { sec: 10, text: "A" },
      { sec: 20, text: "B" },
      { sec: 30, text: "C" },
      { sec: 40, text: "D" },
    ];
    const vtt = getClipVtt(lines, 15, 35);
    expect(vtt).toContain("WEBVTT");
    // Line B: 20s -> rebased to 20-15 = 5s. Start 00:00:05.000
    // Line C: 30s -> rebased to 30-15 = 15s. Start 00:00:15.000
    expect(vtt).toContain("00:00:05.000");
    expect(vtt).toContain("00:00:15.000");
    expect(vtt).toContain("B");
    expect(vtt).toContain("C");
    expect(vtt).not.toContain("A");
    expect(vtt).not.toContain("D");
  });

  it("handles empty range", () => {
    const lines = [{ sec: 10, text: "A" }];
    expect(getClipVtt(lines, 20, 30)).toBe("");
  });
});
