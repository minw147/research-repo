import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
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

async function callRoute(body: object) {
  const req = new Request("http://localhost/api/codebook/cascade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("cascade dry-run rename", () => {
  it("returns count of affected quotes without writing", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    const res = await callRoute({
      dryRun: true,
      action: "rename",
      oldId: "usability",
      newId: "ux-issue",
      projectsRoot: TMP,
    });
    const data = await res.json();
    expect(data.affectedQuoteCount).toBe(1);
    expect(data.affectedFiles).toHaveLength(1);
  });
});

describe("cascade execute rename", () => {
  it("replaces old tag ID in file", async () => {
    makeProject("p1", `- **"text"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: usability, delight\n`);

    await callRoute({
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

    await callRoute({
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
