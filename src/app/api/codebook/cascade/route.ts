import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

interface CascadeRequest {
  dryRun: boolean;
  action: "rename" | "delete";
  oldId: string;
  newId?: string;
  projectsRoot?: string; // injectable for tests
}

function patchTagsLine(line: string, oldId: string, newId: string | null): string {
  const match = line.match(/(\|\s*tags:\s*)(.+)$/);
  if (!match) return line;
  const tags = match[2]
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== oldId);
  if (newId) {
    // insert new ID in the same position as the old one
    const originalTags = match[2].split(",").map((t) => t.trim());
    const oldIdx = originalTags.indexOf(oldId);
    tags.splice(oldIdx, 0, newId);
  }
  return line.replace(/\|\s*tags:\s*.+$/, `| tags: ${tags.join(", ")}`);
}

export async function POST(request: Request) {
  try {
    const body: CascadeRequest = await request.json();
    const { dryRun, action, oldId, newId } = body;

    if (!oldId || !action) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (action === "rename" && !newId) {
      return Response.json({ error: "newId required for rename" }, { status: 400 });
    }

    const projectsRoot =
      body.projectsRoot ?? path.join(process.cwd(), "content", "projects");

    const projectDirs = await readdir(projectsRoot, { withFileTypes: true });
    const affectedFiles: string[] = [];
    let affectedQuoteCount = 0;

    for (const dirent of projectDirs) {
      if (!dirent.isDirectory()) continue;
      for (const filename of ["tags.md", "findings.md"]) {
        const filePath = path.join(projectsRoot, dirent.name, filename);
        let content: string;
        try {
          content = await readFile(filePath, "utf-8");
        } catch {
          continue;
        }

        const lines = content.split("\n");
        let changed = false;
        const patched = lines.map((line) => {
          const tagMatch = line.match(/\|\s*tags:\s*(.+)$/);
          if (!tagMatch) return line;
          const ids = tagMatch[1].split(",").map((t) => t.trim());
          if (!ids.includes(oldId)) return line;
          affectedQuoteCount++;
          changed = true;
          return patchTagsLine(line, oldId, action === "rename" ? (newId ?? null) : null);
        });

        if (changed) {
          affectedFiles.push(filePath);
          if (!dryRun) {
            await writeFile(filePath, patched.join("\n"), "utf-8");
          }
        }
      }
    }

    return Response.json({ affectedFiles, affectedQuoteCount });
  } catch (error) {
    console.error("Cascade error:", error);
    return Response.json({ error: "Cascade failed" }, { status: 500 });
  }
}
