import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { createProject } from "@/lib/projects";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");
const TEST_SLUG = "sessions-test-project";

describe("POST /api/projects/[slug]/sessions", () => {
  beforeEach(() => {
    createProject(
      {
        title: "Sessions Test Project",
        researcher: "Jane",
        persona: "User",
      }
      // use default PROJECTS_DIR so the API finds the project
    );
  });

  afterEach(() => {
    const projectPath = path.join(PROJECTS_DIR, TEST_SLUG);
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  });

  it("returns 400 for invalid slug", async () => {
    const form = new FormData();
    form.append("participant", "P1");
    form.append("video", new File(["x"], "v.mp4", { type: "video/mp4" }));
    form.append("transcript", new File(["t"], "t.txt", { type: "text/plain" }));

    const req = new NextRequest("http://localhost/api/projects/../evil/sessions", {
      method: "POST",
      body: form,
    });

    const res = await POST(req, { params: { slug: "../evil" } });
    expect(res.status).toBe(400);
  });

  it("returns 404 when project does not exist", async () => {
    const form = new FormData();
    form.append("participant", "P1");
    form.append("video", new File(["x"], "v.mp4", { type: "video/mp4" }));
    form.append("transcript", new File(["t"], "t.txt", { type: "text/plain" }));

    const req = new NextRequest("http://localhost/api/projects/nonexistent/sessions", {
      method: "POST",
      body: form,
    });

    const res = await POST(req, { params: { slug: "nonexistent" } });
    expect(res.status).toBe(404);
  });

  // Note: Tests that send FormData body hang in Vitest (req.formData() never resolves).
  // Validation (400/404) is covered above. Full upload flow is verified manually.
});
