// src/adapters/local-folder/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalFolderAdapter } from "./index";
import fs from "fs";
import path from "path";
import os from "os";

describe("LocalFolderAdapter", () => {
  let tempProjectDir: string;
  let tempExportDir: string;
  let tempTargetDir: string;

  beforeEach(() => {
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-"));
    tempExportDir = path.join(tempProjectDir, "export");
    tempTargetDir = fs.mkdtempSync(path.join(os.tmpdir(), "target-"));

    fs.mkdirSync(tempExportDir, { recursive: true });
    fs.mkdirSync(path.join(tempExportDir, "clips"), { recursive: true });
    fs.writeFileSync(path.join(tempExportDir, "index.html"), "<html>Test</html>");
    fs.writeFileSync(path.join(tempExportDir, "clips/clip1.mp4"), "fake-video-content");
  });

  afterEach(() => {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
    fs.rmSync(tempTargetDir, { recursive: true, force: true });
  });

  it("should successfully publish to a local folder", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: { id: "test-project", title: "Test Project" } as any,
      htmlPath: path.join(tempExportDir, "index.html"),
      clipsDir: path.join(tempExportDir, "clips"),
    };

    const config = { targetPath: tempTargetDir };

    const result = await LocalFolderAdapter.publish(payload, config);

    expect(result.success).toBe(true);
    expect(result.message).toContain(tempTargetDir);

    expect(fs.existsSync(path.join(tempTargetDir, "test-project", "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tempTargetDir, "test-project", "clips", "clip1.mp4"))).toBe(true);
    expect(fs.readFileSync(path.join(tempTargetDir, "test-project", "index.html"), "utf-8")).toBe("<html>Test</html>");
  });

  it("should fail if target directory is not provided", async () => {
    const payload = {
      projectDir: tempProjectDir,
      project: {} as any,
      htmlPath: "",
      clipsDir: "",
    };

    const result = await LocalFolderAdapter.publish(payload, {});

    expect(result.success).toBe(false);
    expect(result.message).toContain("Please choose a folder or location to store the export");
  });

  it("should fail if export directory does not exist", async () => {
    fs.rmSync(tempExportDir, { recursive: true, force: true });

    const payload = {
      projectDir: tempProjectDir,
      project: {} as any,
      htmlPath: "",
      clipsDir: "",
    };

    const result = await LocalFolderAdapter.publish(payload, { targetPath: tempTargetDir });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Export directory not found");
  });
});
