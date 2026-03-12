import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { startWatcher, addListener } from "./file-watcher";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");
const TEST_SLUG = "test-watcher-slug";
const TEST_FILE = "test-file.md";

describe("File Watcher", () => {
  beforeEach(() => {
    const testPath = path.join(PROJECTS_DIR, TEST_SLUG);
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(testPath, { recursive: true });
    }
  });

  afterEach(() => {
    const testPath = path.join(PROJECTS_DIR, TEST_SLUG);
    if (fs.existsSync(testPath)) {
      fs.rmSync(testPath, { recursive: true, force: true });
    }
  });

  it("notifies listeners on file change", async () => {
    const filePath = path.join(PROJECTS_DIR, TEST_SLUG, TEST_FILE);
    fs.writeFileSync(filePath, "initial content");

    startWatcher();

    const mockCallback = vi.fn();
    addListener(mockCallback);

    // Give chokidar a moment to register existing files
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the file
    fs.writeFileSync(filePath, "updated content");

    // Chokidar might take a bit to fire the event
    // with awaitWriteFinish it might be longer
    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(mockCallback).toHaveBeenCalled();
    const callData = mockCallback.mock.calls[0][0];
    expect(callData.slug).toBe(TEST_SLUG);
    expect(callData.file).toBe(TEST_FILE);
    expect(callData.event).toBe("change");
  });
});
