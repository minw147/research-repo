import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import path from "path";

// ─── resolveRootPath (real implementation via importActual) ───────────────────
// vi.mock is hoisted, so we must use importActual to test the real module here.

describe("resolveRootPath", () => {
  let resolveRootPath: (f: string) => string;

  beforeAll(async () => {
    const mod = await vi.importActual<typeof import("@/lib/resolve-root-path")>(
      "@/lib/resolve-root-path"
    );
    resolveRootPath = mod.resolveRootPath;
  });

  it("returns a path ending in researcher.md for researcher.md input", () => {
    expect(resolveRootPath("researcher.md").endsWith("researcher.md")).toBe(true);
  });

  it("throws for filenames other than researcher.md", () => {
    expect(() => resolveRootPath("soul.md")).toThrow(
      /only "researcher\.md" is accessible/
    );
  });

  it("throws for path traversal attempts", () => {
    expect(() => resolveRootPath("../researcher.md")).toThrow();
    expect(() => resolveRootPath("../../etc/passwd")).toThrow();
  });

  it("throws for empty string", () => {
    expect(() => resolveRootPath("")).toThrow();
  });
});

// ─── Route handlers ───────────────────────────────────────────────────────────
// Mock resolveRootPath to point at a temp file so we don't clobber the real one.

const TMP_DIR = path.join(process.cwd(), "__profile_test__");
const TMP_FILE = path.join(TMP_DIR, "researcher.md");

vi.mock("@/lib/resolve-root-path", () => ({
  resolveRootPath: (_filename: string) => TMP_FILE,
}));

import { GET, POST } from "./route";

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  vi.resetAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/researcher/profile", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as import("next/server").NextRequest;
}

describe("GET /api/researcher/profile", () => {
  it("returns content when researcher.md exists", async () => {
    await writeFile(TMP_FILE, "# Researcher Profile", "utf8");
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.content).toBe("# Researcher Profile");
  });

  it("returns 404 with content:null when file is missing", async () => {
    // TMP_FILE does not exist yet
    const res = await GET();
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.content).toBeNull();
  });
});

describe("POST /api/researcher/profile", () => {
  it("writes content and returns ok:true", async () => {
    const res = await POST(makeRequest({ content: "# Profile\n" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(existsSync(TMP_FILE)).toBe(true);
    expect(await readFile(TMP_FILE, "utf8")).toBe("# Profile\n");
  });

  it("rejects missing body with 400", async () => {
    const req = new Request("http://localhost/api/researcher/profile", {
      method: "POST",
      body: "not-json{{",
      headers: { "Content-Type": "application/json" },
    }) as import("next/server").NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects non-string content with 400", async () => {
    const res = await POST(makeRequest({ content: 42 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/string/);
  });

  it("rejects content exceeding 100KB with 400", async () => {
    const res = await POST(makeRequest({ content: "x".repeat(100_001) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/100KB/);
  });

  it("overwrites existing file with new content", async () => {
    await writeFile(TMP_FILE, "old content", "utf8");
    await POST(makeRequest({ content: "new content" }));
    expect(await readFile(TMP_FILE, "utf8")).toBe("new content");
  });
});
