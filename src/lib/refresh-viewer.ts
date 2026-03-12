import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface RepoIndexEntry {
  id: string;
  title: string;
  date?: string;
  researcher?: string;
  persona?: string;
  product?: string;
  findingsHtml: string;
  publishedUrl?: string | null;
}

export interface SyncResult {
  copied: string[];   // files that were copied (changed or new)
  skipped: string[];  // files that were skipped (identical)
  errors: string[];   // files that failed to copy
}

/** MD5 hash of a file's contents. Returns "" if file doesn't exist. */
export function hashFile(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(content).digest("hex");
  } catch {
    return "";
  }
}

/**
 * Recursively copies files from srcDir to dstDir, skipping files with identical MD5.
 * dstDir is created if it doesn't exist.
 */
export function syncDir(srcDir: string, dstDir: string): SyncResult {
  const result: SyncResult = { copied: [], skipped: [], errors: [] };
  if (!fs.existsSync(srcDir)) return result;

  fs.mkdirSync(dstDir, { recursive: true });

  function walk(src: string, dst: string, relPrefix: string = "") {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const dstPath = path.join(dst, entry.name);
      const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        fs.mkdirSync(dstPath, { recursive: true });
        walk(srcPath, dstPath, relPath);
      } else {
        try {
          const srcHash = hashFile(srcPath);
          const dstHash = hashFile(dstPath);
          if (srcHash === dstHash) {
            result.skipped.push(relPath);
          } else {
            fs.copyFileSync(srcPath, dstPath);
            result.copied.push(relPath);
          }
        } catch (e: any) {
          result.errors.push(`${relPath}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  walk(srcDir, dstDir);
  return result;
}

/**
 * Scans content/projects/ for projects with status "exported" or "published".
 * Returns a repo-index compatible array.
 */
export function buildRepoIndex(contentProjectsDir: string): RepoIndexEntry[] {
  const entries: RepoIndexEntry[] = [];
  if (!fs.existsSync(contentProjectsDir)) return entries;

  for (const slug of fs.readdirSync(contentProjectsDir)) {
    const projectJsonPath = path.join(contentProjectsDir, slug, "project.json");
    if (!fs.existsSync(projectJsonPath)) continue;

    try {
      const project = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
      if (!["exported", "published"].includes(project.status)) continue;

      entries.push({
        id: project.id ?? slug,
        title: project.title ?? slug,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: `${project.id ?? slug}/index.html`,
        publishedUrl: project.publishedUrl ?? null,
      });
    } catch {
      // Skip projects with invalid JSON
    }
  }

  return entries;
}

/**
 * Writes content to filePath only if the content has changed (by MD5).
 * Returns true if written, false if skipped.
 */
export function writeIfChanged(filePath: string, content: string | Buffer): boolean {
  const newContent = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
  const newHash = crypto.createHash("md5").update(newContent).digest("hex");
  const oldHash = hashFile(filePath);
  if (newHash === oldHash) return false;
  fs.writeFileSync(filePath, newContent);
  return true;
}
