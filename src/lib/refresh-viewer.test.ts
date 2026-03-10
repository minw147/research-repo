import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { hashFile, syncDir, buildRepoIndex, writeIfChanged } from "./refresh-viewer";

describe("hashFile", () => {
  it("returns md5 hash of a file", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hash-"));
    const f = path.join(tmp, "test.txt");
    fs.writeFileSync(f, "hello");
    const hash = hashFile(f);
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
    expect(hash).toBe(hashFile(f)); // deterministic
    fs.rmSync(tmp, { recursive: true });
  });

  it("returns empty string for non-existent file", () => {
    expect(hashFile("/nonexistent/path/file.txt")).toBe("");
  });
});

describe("syncDir", () => {
  let src: string, dst: string;
  beforeEach(() => {
    src = fs.mkdtempSync(path.join(os.tmpdir(), "src-"));
    dst = fs.mkdtempSync(path.join(os.tmpdir(), "dst-"));
  });
  afterEach(() => {
    fs.rmSync(src, { recursive: true, force: true });
    fs.rmSync(dst, { recursive: true, force: true });
  });

  it("copies new files", () => {
    fs.writeFileSync(path.join(src, "a.txt"), "content-a");
    const result = syncDir(src, dst);
    expect(result.copied).toContain("a.txt");
    expect(fs.readFileSync(path.join(dst, "a.txt"), "utf-8")).toBe("content-a");
  });

  it("skips identical files", () => {
    fs.writeFileSync(path.join(src, "a.txt"), "same");
    fs.writeFileSync(path.join(dst, "a.txt"), "same");
    const result = syncDir(src, dst);
    expect(result.skipped).toContain("a.txt");
    expect(result.copied).toHaveLength(0);
  });

  it("copies changed files", () => {
    fs.writeFileSync(path.join(src, "a.txt"), "new-content");
    fs.writeFileSync(path.join(dst, "a.txt"), "old-content");
    const result = syncDir(src, dst);
    expect(result.copied).toContain("a.txt");
    expect(fs.readFileSync(path.join(dst, "a.txt"), "utf-8")).toBe("new-content");
  });

  it("returns empty result for non-existent src", () => {
    const result = syncDir("/nonexistent", dst);
    expect(result.copied).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});

describe("buildRepoIndex", () => {
  let contentDir: string;
  beforeEach(() => {
    contentDir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
  });
  afterEach(() => {
    fs.rmSync(contentDir, { recursive: true, force: true });
  });

  it("returns entries for exported and published projects", () => {
    const proj1 = path.join(contentDir, "proj-1");
    fs.mkdirSync(proj1);
    fs.writeFileSync(path.join(proj1, "project.json"), JSON.stringify({
      id: "proj-1", title: "Project One", status: "exported", date: "2026-01"
    }));

    const proj2 = path.join(contentDir, "proj-2");
    fs.mkdirSync(proj2);
    fs.writeFileSync(path.join(proj2, "project.json"), JSON.stringify({
      id: "proj-2", title: "Project Two", status: "published"
    }));

    const entries = buildRepoIndex(contentDir);
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.id)).toContain("proj-1");
    expect(entries.map(e => e.id)).toContain("proj-2");
  });

  it("skips projects that are not exported or published", () => {
    const proj = path.join(contentDir, "draft");
    fs.mkdirSync(proj);
    fs.writeFileSync(path.join(proj, "project.json"), JSON.stringify({
      id: "draft", title: "Draft", status: "draft"
    }));
    const entries = buildRepoIndex(contentDir);
    expect(entries).toHaveLength(0);
  });

  it("returns empty array for non-existent directory", () => {
    expect(buildRepoIndex("/nonexistent")).toHaveLength(0);
  });
});

describe("writeIfChanged", () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wif-")); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it("writes file if it does not exist", () => {
    const f = path.join(tmp, "new.txt");
    const written = writeIfChanged(f, "hello");
    expect(written).toBe(true);
    expect(fs.readFileSync(f, "utf-8")).toBe("hello");
  });

  it("skips write if content is identical", () => {
    const f = path.join(tmp, "same.txt");
    fs.writeFileSync(f, "hello");
    const written = writeIfChanged(f, "hello");
    expect(written).toBe(false);
  });

  it("writes file if content has changed", () => {
    const f = path.join(tmp, "changed.txt");
    fs.writeFileSync(f, "old");
    const written = writeIfChanged(f, "new");
    expect(written).toBe(true);
    expect(fs.readFileSync(f, "utf-8")).toBe("new");
  });
});
