// src/adapters/google-drive/index.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleDriveAdapter } from "./index";
import { tokenStore } from "@/lib/token-store";

// Mock googleapis
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
      })),
    },
    drive: vi.fn().mockReturnValue({
      files: {
        list: vi.fn().mockResolvedValue({ data: { files: [] } }),
        create: vi.fn().mockResolvedValue({ data: { id: "mock-file-id" } }),
        update: vi.fn().mockResolvedValue({ data: { id: "mock-file-id" } }),
        get: vi.fn().mockResolvedValue({ data: "[]" }),
      },
    }),
  },
}));

describe("GoogleDriveAdapter", () => {
  beforeEach(() => {
    tokenStore.clear();
    vi.clearAllMocks();
  });

  it("fails if not connected to Google Drive", async () => {
    const result = await GoogleDriveAdapter.publish(
      { projectDir: "", project: { id: "p1" } as any, htmlPath: "", clipsDir: "" },
      { clientId: "id", clientSecret: "sec", folderId: "fid" }
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Not connected to Google Drive");
  });

  it("fails if folderId is not provided", async () => {
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
    expect(result.message).toContain("folderId");
  });
});
