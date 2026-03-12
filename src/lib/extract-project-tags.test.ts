// src/lib/extract-project-tags.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { extractProjectTagData } from "./extract-project-tags";
import fs from "fs";
import path from "path";
import os from "os";

describe("extractProjectTagData", () => {
  const dirs: string[] = [];
  function mkTemp() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "extract-test__"));
    dirs.push(d);
    return d;
  }
  afterEach(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

  const SAMPLE_TAGS_MD = `
## Delight Moment
- **"When you look at the source material..."** @ 03:42 (222s) | duration: 18s | session: 1 | tags: delight

## Friction Point
- **"If you're involved..."** @ 00:24 (24s) | duration: 15s | session: 1 | tags: friction, mental-model
- **"Hidden quote"** @ 01:00 (60s) | duration: 10s | session: 1 | tags: delight | hidden: true
`.trim();

  it("returns empty when tags.md does not exist", () => {
    const dir = mkTemp();
    const result = extractProjectTagData(dir, { id: "p1" } as any);
    expect(result.quotes).toEqual([]);
    expect(result.codebook).toEqual([]);
  });

  it("parses quotes and derives clipFile correctly", () => {
    const dir = mkTemp();
    fs.writeFileSync(path.join(dir, "tags.md"), SAMPLE_TAGS_MD);
    const result = extractProjectTagData(dir, { id: "p1" } as any);
    expect(result.quotes).toHaveLength(2); // hidden excluded
    expect(result.quotes[0].clipFile).toBe("clip-1-222s.mp4");
    expect(result.quotes[0].tags).toEqual(["delight"]);
  });

  it("excludes hidden quotes", () => {
    const dir = mkTemp();
    fs.writeFileSync(path.join(dir, "tags.md"), SAMPLE_TAGS_MD);
    const result = extractProjectTagData(dir, { id: "p1" } as any);
    expect(result.quotes.every(q => !q.text.includes("Hidden"))).toBe(true);
  });

  it("filters codebook to only used tags", () => {
    const dir = mkTemp();
    fs.writeFileSync(path.join(dir, "tags.md"), `## Delight\n- **"Q"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: delight`);
    const result = extractProjectTagData(dir, { id: "p1" } as any);
    expect(result.codebook).toHaveLength(1);
    expect(result.codebook[0].id).toBe("delight");
  });

  it("project codebook overrides global tag", () => {
    const dir = mkTemp();
    fs.writeFileSync(path.join(dir, "tags.md"), `## Delight\n- **"Q"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: delight`);
    const project = {
      id: "p1",
      codebookData: {
        tags: [{ id: "delight", label: "Custom Delight", color: "#FF0000", category: "Positive" }],
        categories: ["Positive"],
      }
    } as any;
    const result = extractProjectTagData(dir, project);
    expect(result.codebook[0].label).toBe("Custom Delight");
    expect(result.codebook[0].color).toBe("#FF0000");
  });

  it("handles quotes with no tags (empty tags field)", () => {
    const dir = mkTemp();
    fs.writeFileSync(path.join(dir, "tags.md"), `## Untagged\n- **"Q"** @ 00:10 (10s) | duration: 5s | session: 1 | tags:`);
    const result = extractProjectTagData(dir, { id: "p1" } as any);
    expect(result.quotes[0].tags).toEqual([]);
    expect(result.codebook).toEqual([]);
  });
});
