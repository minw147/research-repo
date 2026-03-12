// src/adapters/sharepoint-onedrive/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SharePointOneDriveAdapter } from "./index";
import fs from "fs";
import path from "path";
import os from "os";

// Note: these tests call the real sliceTagClips, which guards on getFfmpegPath().
// When FFmpeg is absent (CI / dev without ffmpeg-static), sliceTagClips returns []
// without error. Clip-slicing logic is therefore not exercised here; it is covered
// by the slice-tag-clips unit tests which mock the ffmpeg binary directly.
describe("SharePointOneDriveAdapter", () => {
  let tempProjectDir: string;
  let tempExportDir: string;
  let tempSyncedDir: string;

  beforeEach(() => {
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-"));
    tempExportDir = path.join(tempProjectDir, "export");
    tempSyncedDir = fs.mkdtempSync(path.join(os.tmpdir(), "synced-"));

    fs.mkdirSync(tempExportDir, { recursive: true });
    fs.writeFileSync(path.join(tempExportDir, "index.html"), "<html>Test</html>");
    // Clips live in {projectDir}/clips/, not export/clips/
    fs.mkdirSync(path.join(tempProjectDir, "clips"), { recursive: true });
    fs.writeFileSync(path.join(tempProjectDir, "clips/clip1.mp4"), "fake-video-content");
  });

  afterEach(() => {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
    fs.rmSync(tempSyncedDir, { recursive: true, force: true });
  });

  it("should successfully publish to the provided path", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: { id: "test-project", title: "Test Project" } as any,
      htmlPath: path.join(tempExportDir, "index.html"),
      clipsDir: path.join(tempExportDir, "clips"),
    };

    const config = { syncedPath: tempSyncedDir };

    const result = await SharePointOneDriveAdapter.publish(payload, config);

    expect(result.success).toBe(true);
    expect(result.message).toContain(tempSyncedDir);

    expect(fs.existsSync(path.join(tempSyncedDir, "test-project", "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tempSyncedDir, "test-project", "clips", "clip1.mp4"))).toBe(true);
    expect(fs.readFileSync(path.join(tempSyncedDir, "test-project", "index.html"), "utf-8")).toBe("<html>Test</html>");
  });

  it("should fail if targetPath not provided", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: { id: "test-project", title: "Test" } as any,
      htmlPath: "",
      clipsDir: "",
    };

    const result = await SharePointOneDriveAdapter.publish(payload, {});

    expect(result.success).toBe(false);
    expect(result.message).toContain("Please choose a folder or location to store the export");
  });

  it("should succeed without export directory (clips-only publish)", async () => {
    fs.rmSync(tempExportDir, { recursive: true, force: true });

    const payload = {
      projectDir: tempProjectDir,
      project: { id: "test-project", title: "Test" } as any,
      htmlPath: "",
      clipsDir: "",
    };

    const result = await SharePointOneDriveAdapter.publish(payload, { syncedPath: tempSyncedDir });

    expect(result.success).toBe(true);
    // No HTML report → findingsHtml should be null in the index
    const index = JSON.parse(fs.readFileSync(path.join(tempSyncedDir, "repo-index.json"), "utf-8"));
    expect(index[0].findingsHtml).toBeNull();
  });

  it("should create repo-index.json with project entry on first publish", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: { id: "test-project", title: "Test Project", date: "2026-03-09", researcher: "Alice", persona: "Admin", product: "Dashboard" } as any,
      htmlPath: path.join(tempExportDir, "index.html"),
      clipsDir: path.join(tempExportDir, "clips"),
    };

    await SharePointOneDriveAdapter.publish(payload, { syncedPath: tempSyncedDir });

    const indexPath = path.join(tempSyncedDir, "repo-index.json");
    expect(fs.existsSync(indexPath)).toBe(true);
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    expect(index).toHaveLength(1);
    expect(index[0].id).toBe("test-project");
    expect(index[0].findingsHtml).toBe("test-project/index.html");
  });

  it("should upsert existing entry in repo-index.json on re-publish", async () => {
    const base = { id: "test-project", title: "Old Title" } as any;
    const updated = { id: "test-project", title: "New Title" } as any;

    await SharePointOneDriveAdapter.publish({ projectDir: tempProjectDir, project: base, htmlPath: "", clipsDir: "" }, { syncedPath: tempSyncedDir });
    await SharePointOneDriveAdapter.publish({ projectDir: tempProjectDir, project: updated, htmlPath: "", clipsDir: "" }, { syncedPath: tempSyncedDir });

    const index = JSON.parse(fs.readFileSync(path.join(tempSyncedDir, "repo-index.json"), "utf-8"));
    expect(index).toHaveLength(1);
    expect(index[0].title).toBe("New Title");
  });

  it("should fail for invalid project.id (path traversal attempt)", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: { id: "../other", title: "Bad" } as any,
      htmlPath: "",
      clipsDir: "",
    };

    const result = await SharePointOneDriveAdapter.publish(payload, { syncedPath: tempSyncedDir });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid project ID");
  });

  it("should include quotes and codebook when tags.md exists", async () => {
    const tagsMd = `## Delight\n- **"A great moment"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: delight`;
    fs.writeFileSync(path.join(tempProjectDir, "tags.md"), tagsMd);
    const payload = { projectDir: tempProjectDir, project: { id: "test-project", title: "T" } as any, htmlPath: "", clipsDir: "" };
    await SharePointOneDriveAdapter.publish(payload, { syncedPath: tempSyncedDir });
    const index = JSON.parse(fs.readFileSync(path.join(tempSyncedDir, "repo-index.json"), "utf-8"));
    expect(Array.isArray(index[0].quotes)).toBe(true);
    expect(index[0].quotes.length).toBeGreaterThan(0);
    expect(index[0].quotes[0].clipFile).toMatch(/^clip-\d+-\d+s\.mp4$/);
    expect(Array.isArray(index[0].codebook)).toBe(true);
  });

  it("should include empty quotes when tags.md does not exist", async () => {
    const payload = { projectDir: tempProjectDir, project: { id: "test-project", title: "T" } as any, htmlPath: "", clipsDir: "" };
    await SharePointOneDriveAdapter.publish(payload, { syncedPath: tempSyncedDir });
    const index = JSON.parse(fs.readFileSync(path.join(tempSyncedDir, "repo-index.json"), "utf-8"));
    expect(index[0].quotes).toEqual([]);
    expect(index[0].codebook).toEqual([]);
  });
});
