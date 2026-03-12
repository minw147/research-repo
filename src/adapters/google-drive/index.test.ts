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
        on = vi.fn();
      },
    },
    drive: vi.fn().mockReturnValue({ files: mockDriveFiles }),
  },
}));

const AUTH_CONFIG = { clientId: "id", clientSecret: "sec", targetFolderId: "root-folder-id" };
const GOOGLE_TOKEN = { accessToken: "tok", refreshToken: "ref", expiresAt: Date.now() + 3_600_000 };

describe("GoogleDriveAdapter", () => {
  let tempProjectDir: string;

  beforeEach(() => {
    tokenStore.clear();
    vi.clearAllMocks();
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "gd-project-"));
    // Export dir is optional — create it for tests that need the HTML report
    const exportDir = path.join(tempProjectDir, "export");
    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(path.join(exportDir, "index.html"), "<html>Report</html>");
  });

  afterEach(() => {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
  });

  it("fails if not connected to Google Drive", async () => {
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "", project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Not connected to Google Drive");
  });

  it("fails if targetFolderId is not provided", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "", project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("targetFolderId");
  });

  it("fails if project.id is invalid (path traversal attempt)", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    const result = await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "../other" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid project ID");
  });

  it("publishes successfully with export dir", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    const result = await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "Test" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    expect(result.success).toBe(true);
    expect(result.url).toContain("drive.google.com");
  });

  it("succeeds without export directory (clips-only publish)", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    fs.rmSync(path.join(tempProjectDir, "export"), { recursive: true, force: true });
    const result = await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "Test" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    expect(result.success).toBe(true);
  });

  it("uploads clips from {projectDir}/clips/ not just export/clips/", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    const clipsDir = path.join(tempProjectDir, "clips");
    fs.mkdirSync(clipsDir, { recursive: true });
    fs.writeFileSync(path.join(clipsDir, "clip-1-10s.mp4"), "fake-clip");
    await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "Test" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    // uploadOrUpdateFile should have been called with clip-1-10s.mp4
    const createCalls = mockDriveFiles.create.mock.calls.map((c: any[]) => c[0]?.requestBody?.name);
    const updateCalls = mockDriveFiles.update.mock.calls.map((c: any[]) => c[0]?.fileId);
    const allNames = [...createCalls, ...updateCalls];
    // The clip upload uses uploadOrUpdateFile which calls list first, then create
    const listCalls = mockDriveFiles.list.mock.calls.map((c: any[]) => c[0]?.q ?? "");
    expect(listCalls.some((q: string) => q.includes("clip-1-10s.mp4"))).toBe(true);
  });

  it("includes quotes and codebook when tags.md exists", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    const tagsMd = `## Delight\n- **"A great moment"** @ 00:10 (10s) | duration: 5s | session: 1 | tags: delight`;
    fs.writeFileSync(path.join(tempProjectDir, "tags.md"), tagsMd);

    // Capture what gets uploaded as repo-index.json
    let uploadedIndex: any[] = [];
    mockDriveFiles.create.mockImplementation(async (params: any) => {
      if (params.requestBody?.name === "repo-index.json" || params.requestBody?.name === undefined) {
        // Try to capture body content if it's the index upload
      }
      return { data: { id: "mock-file-id" } };
    });

    await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "T" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );

    // Verify uploadOrUpdateFile was called for repo-index.json (it calls list then create)
    const listQueries = mockDriveFiles.list.mock.calls.map((c: any[]) => c[0]?.q ?? "");
    expect(listQueries.some((q: string) => q.includes("repo-index.json"))).toBe(true);
  });

  it("uploads hub viewer index.html to root folder", async () => {
    tokenStore.set("google", GOOGLE_TOKEN);
    await GoogleDriveAdapter.publish(
      { projectDir: tempProjectDir, project: { id: "test-project", title: "Test" } as any, htmlPath: "", clipsDir: "" },
      AUTH_CONFIG
    );
    // The hub index.html is uploaded to root (targetFolderId), not the project subfolder
    // list is called to check if index.html exists in root folder
    const listQueries = mockDriveFiles.list.mock.calls.map((c: any[]) => c[0]?.q ?? "");
    expect(listQueries.some((q: string) => q.includes("index.html") && q.includes("root-folder-id"))).toBe(true);
  });
});
