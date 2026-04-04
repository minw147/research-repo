import path from "path";

/**
 * Resolves the absolute path for a root-level data file.
 * Intentionally narrow: only researcher.md is permitted.
 * Prevents path traversal — no slug or user input is accepted.
 */
export function resolveRootPath(filename: string): string {
  if (filename !== "researcher.md") {
    throw new Error(`resolveRootPath: only "researcher.md" is accessible via this helper, got "${filename}"`);
  }
  return path.join(process.cwd(), "researcher.md");
}
