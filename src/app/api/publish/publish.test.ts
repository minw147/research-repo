// src/app/api/publish/publish.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { getAdapter } from "@/lib/adapters";
import { getProject, updateProject } from "@/lib/projects";
import fs from "fs";

vi.mock("@/lib/adapters", () => ({
  getAdapter: vi.fn(),
}));

vi.mock("@/lib/projects", () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
  getProjectsDir: vi.fn(() => "/mock-projects-dir"),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
  },
}));

describe("Publish API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if slug or adapterId is missing", async () => {
    const req = new NextRequest("http://localhost/api/publish", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Missing slug or adapterId");
  });

  it("should return 404 if adapter is not found", async () => {
    (getAdapter as any).mockReturnValue(null);

    const req = new NextRequest("http://localhost/api/publish", {
      method: "POST",
      body: JSON.stringify({ slug: "test-slug", adapterId: "unknown-adapter" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Adapter not found");
  });

  it("should return 404 if project is not found", async () => {
    (getAdapter as any).mockReturnValue({ id: "local-folder" });
    (getProject as any).mockReturnValue(null);

    const req = new NextRequest("http://localhost/api/publish", {
      method: "POST",
      body: JSON.stringify({ slug: "test-slug", adapterId: "local-folder" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Project not found");
  });

  it("should call adapter publish and update project on success", async () => {
    const mockAdapter = {
      id: "local-folder",
      publish: vi.fn().mockResolvedValue({ success: true, url: "http://published.url", message: "Success" }),
    };
    const mockProject = { id: "test-slug", title: "Test Project", publishedUrl: null };

    (getAdapter as any).mockReturnValue(mockAdapter);
    (getProject as any).mockReturnValue(mockProject);

    const req = new NextRequest("http://localhost/api/publish", {
      method: "POST",
      body: JSON.stringify({ slug: "test-slug", adapterId: "local-folder", config: { target: "/foo" } }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAdapter.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        project: mockProject,
        projectDir: expect.stringContaining("test-slug"),
      }),
      { target: "/foo" }
    );
    expect(updateProject).toHaveBeenCalledWith("test-slug", expect.objectContaining({
      status: "published",
      publishedUrl: "http://published.url",
    }));
  });

  it("should return error status and not update project if adapter publish fails", async () => {
    const mockAdapter = {
      id: "local-folder",
      publish: vi.fn().mockResolvedValue({ success: false, message: "Publishing failed" }),
    };
    const mockProject = { id: "test-slug", title: "Test Project" };

    (getAdapter as any).mockReturnValue(mockAdapter);
    (getProject as any).mockReturnValue(mockProject);

    const req = new NextRequest("http://localhost/api/publish", {
      method: "POST",
      body: JSON.stringify({ slug: "test-slug", adapterId: "local-folder", config: {} }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200); // Note: Current implementation returns 200 with success: false
    expect(data.success).toBe(false);
    expect(data.message).toBe("Publishing failed");
    expect(updateProject).not.toHaveBeenCalled();
  });
});
