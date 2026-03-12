// src/adapters/google-drive/index.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleDriveAdapter } from "./index";
import { tokenStore } from "@/lib/token-store";
import fs from "fs";
import path from "path";
import os from "os";

const mockDriveFiles = {
  list: vi.fn().mockResolvedValue({ data: { files: [] } }),
  create: vi.fn().mockResolvedValue({ data: { id: "mock-file-id" } }),
  update: vi.fn().mockResolvedValue({ data: { id: "mock-file-id" } }),
  get: vi.fn().mockResolvedValue({ data: "[]" }),
};

// Mock googleapis
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: class MockOAuth2 {
        setCredentials = vi.fn();
      },
    },
    drive: vi.fn().mockReturnValue({ files: mockDriveFiles }),
  },
}));

describe("GoogleDriveAdapter", () => {
  let tempProjectDir: string;

  beforeEach(() => {
    tokenStore.clear();
    vi.clearAllMocks();
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "gd-project-"));
    const exportDir = path.join(tempProjectDir, "export");
    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(path.join(exportDir, "index.html"), "<html>Report</html>");
    const clipsDir = path.join(exportDir, "clips");
    fs.mkdirSync(clipsDir, { recursive: true });
    fs.writeFileSync(path.join(clipsDir, "clip1.mp4"), "fake-video");
  });

  afterEach(() => {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
  });

  it("fails if not connected to Google Drive", async () => {
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "", project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec", targetFolderId: "fid" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Not connected to Google Drive");
  });

  it("fails if targetFolderId is not provided", async () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
    });
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "", project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("targetFolderId");
  });

  it("fails if project.id is invalid (path traversal attempt)", async () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
    });
    const result = await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "../other" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec", targetFolderId: "fid" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid project ID");
  });

  it("publishes successfully when all prerequisites are met", async () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
    });
    const result = await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "Test" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec", targetFolderId: "root-folder-id" }
    );
    expect(result.success).toBe(true);
    expect(result.url).toContain("drive.google.com");
    expect(result.message).toContain("Google Drive");
  });
});
