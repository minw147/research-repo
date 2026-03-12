import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCascade } from "./route";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import path from "path";

const TMP = path.join(process.cwd(), "content", "projects", "__cascade_test__");

function makeProject(name: string, content: string) {
  const dir = path.join(TMP, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "tags.md"), content, "utf-8");
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

async function callCascade(body: object) {
  return runCascade(body as any);
}

describe("cascade dry-run rename", () => {
  it("returns count of affected quotes without writing", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    const data = await callCascade({
      dryRun: true,
      action: "rename",
      oldId: "usability",
      newId: "ux-issue",
      projectsRoot: TMP,
    });
    expect(data.affectedQuoteCount).toBe(1);
    expect(data.affectedFiles).toHaveLength(1);
  });
});

describe("cascade execute rename", () => {
  it("replaces old tag ID in file", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    await callCascade({
      dryRun: false,
      action: "rename",
      oldId: "usability",
      newId: "ux-issue",
      projectsRoot: TMP,
    });

    const { readFileSync } = await import("fs");
    const content = readFileSync(path.join(TMP, "p1", "tags.md"), "utf-8");
    expect(content).toContain("tags: ux-issue, delight");
    expect(content).not.toContain("usability");
  });
});

describe("cascade execute delete", () => {
  it("removes tag ID from file", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    await callCascade({
      dryRun: false,
      action: "delete",
      oldId: "usability",
      projectsRoot: TMP,
    });

    const { readFileSync } = await import("fs");
    const content = readFileSync(path.join(TMP, "p1", "tags.md"), "utf-8");
    expect(content).toContain("tags: delight");
    expect(content).not.toContain("usability");
  });
});

describe("cascade execute delete — only tag", () => {
  it("removes the entire tags segment when deleting the only tag", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability\n`);

    await runCascade({
      dryRun: false,
      action: "delete",
      oldId: "usability",
      projectsRoot: TMP,
    });

    const { readFileSync } = await import("fs");
    const content = readFileSync(path.join(TMP, "p1", "tags.md"), "utf-8");
    expect(content).not.toContain("tags:");
    expect(content).toContain("@ 00:10");
  });
});
