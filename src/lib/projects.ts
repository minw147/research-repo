// src/lib/projects.ts
import fs from "fs";
import path from "path";
import type { Project, Session } from "@/types";

const DEFAULT_PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export function getProjectsDir(): string {
  return DEFAULT_PROJECTS_DIR;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Sanitizes a slug to ensure it only contains alphanumeric characters and hyphens.
 * Returns null if the slug is invalid or contains path traversal sequences.
 */
export function sanitizeSlug(slug: string | null): string | null {
  if (!slug || typeof slug !== "string") return null;
  const sanitized = slug.replace(/[^a-zA-Z0-9-]/g, "");
  if (sanitized !== slug || sanitized.length === 0) return null;
  return sanitized;
}

export function createProject(
  input: {
    title: string;
    researcher: string;
    persona: string;
    product?: string;
    researchPlan?: string;
    date?: string;
  },
  baseDir = DEFAULT_PROJECTS_DIR
): Project {
  const id = slugify(input.title);
  const projectDir = path.join(baseDir, id);

  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(projectDir, "transcripts"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "videos"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "clips"), { recursive: true });

  const project: Project = {
    id,
    title: input.title,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    researcher: input.researcher,
    persona: input.persona,
    product: input.product,
    status: "setup",
    researchPlan: input.researchPlan,
    codebook: null,
    sessions: [],
    publishedUrl: null,
  };

  fs.writeFileSync(
    path.join(projectDir, "project.json"),
    JSON.stringify(project, null, 2)
  );

  return project;
}

export function getProject(
  slug: string,
  baseDir = DEFAULT_PROJECTS_DIR
): Project | null {
  const jsonPath = path.join(baseDir, slug, "project.json");
  if (!fs.existsSync(jsonPath)) return null;
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

export function updateProject(
  slug: string,
  updates: Partial<Project>,
  baseDir = DEFAULT_PROJECTS_DIR
): Project | null {
  const project = getProject(slug, baseDir);
  if (!project) return null;
  const updated = { ...project, ...updates };
  const jsonPath = path.join(baseDir, slug, "project.json");
  fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2));
  return updated;
}

export function listProjects(baseDir = DEFAULT_PROJECTS_DIR): Project[] {
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const projects: Project[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const project = getProject(entry.name, baseDir);
    if (project) projects.push(project);
  }
  return projects.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Safe filename for a new session file: session-{index}.{ext}
 * Extension is sanitized to alphanumeric only (e.g. mp4, txt).
 */
export function sessionFilename(sessionIndex: number, extension: string): string {
  const ext = (extension.startsWith(".") ? extension.slice(1) : extension)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "bin";
  return `session-${sessionIndex}.${ext}`;
}

/**
 * Append a session to a project and optionally set status to "findings" if currently "setup".
 */
export function addSessionToProject(
  slug: string,
  session: Session,
  baseDir = DEFAULT_PROJECTS_DIR
): Project | null {
  const project = getProject(slug, baseDir);
  if (!project) return null;
  const sessions = [...project.sessions, session];
  const status = project.status === "setup" ? "findings" : project.status;
  return updateProject(slug, { sessions, status }, baseDir);
}
