import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, POST } from "./route";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");
const TEST_SLUG = "test-slug-api";
const TEST_FILE = "test-file.md";
const TEST_CONTENT = "Hello from API test";

describe("Files API Route", () => {
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

  it("GET returns 400 if slug or file is missing", async () => {
    const req1 = new NextRequest(`http://localhost/api/files?file=${TEST_FILE}`);
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);

    const req2 = new NextRequest(`http://localhost/api/files?slug=${TEST_SLUG}`);
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
  });

  it("GET returns content: null if file does not exist", async () => {
    const req = new NextRequest(`http://localhost/api/files?slug=${TEST_SLUG}&file=non-existent.md`);
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.content).toBe(null);
  });

  it("GET returns file content if file exists", async () => {
    const filePath = path.join(PROJECTS_DIR, TEST_SLUG, TEST_FILE);
    fs.writeFileSync(filePath, TEST_CONTENT);

    const req = new NextRequest(`http://localhost/api/files?slug=${TEST_SLUG}&file=${TEST_FILE}`);
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.content).toBe(TEST_CONTENT);
  });

  it("POST creates file and returns success", async () => {
    const body = { slug: TEST_SLUG, file: TEST_FILE, content: TEST_CONTENT };
    const req = new NextRequest("http://localhost/api/files", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const filePath = path.join(PROJECTS_DIR, TEST_SLUG, TEST_FILE);
    expect(fs.readFileSync(filePath, "utf-8")).toBe(TEST_CONTENT);
  });

  it("POST returns 400 if slug, file, or content is missing", async () => {
    const req = new NextRequest("http://localhost/api/files", {
      method: "POST",
      body: JSON.stringify({ slug: TEST_SLUG }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("prevents directory traversal", async () => {
    const req = new NextRequest(`http://localhost/api/files?slug=${TEST_SLUG}&file=../../../etc/passwd`);
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid path");
  });
});
