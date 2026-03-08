// src/lib/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  getProjectsDir,
  listProjects,
  getProject,
  createProject,
  updateProject,
  slugify,
} from "./projects";

const TEST_DIR = path.join(process.cwd(), "content/projects/__test__");

describe("slugify", () => {
  it("converts title to kebab-case slug", () => {
    expect(slugify("Checkout Flow Usability")).toBe("checkout-flow-usability");
    expect(slugify("AI Chip War: GPU vs TPU")).toBe("ai-chip-war-gpu-vs-tpu");
    expect(slugify("  Spaces  Everywhere  ")).toBe("spaces-everywhere");
  });
});

describe("project CRUD", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("createProject creates folder structure and project.json", () => {
    const project = createProject(
      {
        title: "Test Study",
        researcher: "Jane",
        persona: "Customer",
        product: "Web App",
      },
      TEST_DIR
    );

    expect(project.id).toBe("test-study");
    expect(project.status).toBe("setup");

    const jsonPath = path.join(TEST_DIR, "test-study", "project.json");
    expect(fs.existsSync(jsonPath)).toBe(true);

    const dirs = ["transcripts", "videos", "clips"];
    for (const dir of dirs) {
      expect(fs.existsSync(path.join(TEST_DIR, "test-study", dir))).toBe(true);
    }
  });

  it("getProject reads project.json", () => {
    createProject(
      { title: "Read Test", researcher: "Jane", persona: "User" },
      TEST_DIR
    );
    const project = getProject("read-test", TEST_DIR);
    expect(project?.title).toBe("Read Test");
  });

  it("listProjects returns all projects sorted by date desc", () => {
    createProject(
      { title: "Older", researcher: "A", persona: "X", date: "2026-01-01" },
      TEST_DIR
    );
    createProject(
      { title: "Newer", researcher: "B", persona: "Y", date: "2026-03-01" },
      TEST_DIR
    );
    const projects = listProjects(TEST_DIR);
    expect(projects).toHaveLength(2);
    expect(projects[0].title).toBe("Newer");
  });

  it("updateProject modifies project.json", () => {
    createProject(
      { title: "Update Test", researcher: "Jane", persona: "User" },
      TEST_DIR
    );
    const updated = updateProject("update-test", { researcher: "John" }, TEST_DIR);
    expect(updated?.researcher).toBe("John");
    const project = getProject("update-test", TEST_DIR);
    expect(project?.researcher).toBe("John");
  });
});
