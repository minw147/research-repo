#!/usr/bin/env tsx
/**
 * Refresh the viewer HTML and repo-index.json at a published destination.
 *
 * Usage:
 *   npx tsx scripts/refresh-viewer.ts --path /path/to/published/folder
 *   npx tsx scripts/refresh-viewer.ts  # reads .refresh-viewer.json
 *
 * Config file (.refresh-viewer.json):
 *   { "targetPath": "/path/to/published/folder" }
 */

import path from "path";
import fs from "fs";
import { buildRepoIndex, syncDir, writeIfChanged } from "../src/lib/refresh-viewer";
import { generateViewerHtml } from "../src/lib/viewer-template";

function getTargetPath(): string {
  // CLI arg: --path <value>
  const pathArgIdx = process.argv.indexOf("--path");
  if (pathArgIdx !== -1 && process.argv[pathArgIdx + 1]) {
    return process.argv[pathArgIdx + 1];
  }

  // Config file
  const configFile = path.join(process.cwd(), ".refresh-viewer.json");
  if (fs.existsSync(configFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      if (cfg.targetPath) return cfg.targetPath;
    } catch {
      console.error("Error reading .refresh-viewer.json");
    }
  }

  console.error("Usage: tsx scripts/refresh-viewer.ts --path <destination-folder>");
  console.error('  or: create .refresh-viewer.json with { "targetPath": "..." }');
  process.exit(1);
}

async function main() {
  const targetPath = getTargetPath();
  const contentProjectsDir = path.join(process.cwd(), "content", "projects");

  console.log(`Refreshing viewer at: ${targetPath}`);

  if (!fs.existsSync(targetPath)) {
    console.error(`Destination not found: ${targetPath}`);
    process.exit(1);
  }

  // 1. Sync project exports
  let totalCopied = 0, totalSkipped = 0;
  if (fs.existsSync(contentProjectsDir)) {
    for (const slug of fs.readdirSync(contentProjectsDir)) {
      const exportDir = path.join(contentProjectsDir, slug, "export");
      if (!fs.existsSync(exportDir)) continue;

      const destDir = path.join(targetPath, slug);
      const result = syncDir(exportDir, destDir);
      totalCopied += result.copied.length;
      totalSkipped += result.skipped.length;
      if (result.errors.length) {
        result.errors.forEach(e => console.error(`  Error in ${slug}: ${e}`));
      }
    }
  }

  console.log(`  Files copied: ${totalCopied}, skipped (unchanged): ${totalSkipped}`);

  // 2. Rebuild and write repo-index.json
  const repoIndex = buildRepoIndex(contentProjectsDir);
  const indexPath = path.join(targetPath, "repo-index.json");
  const indexWritten = writeIfChanged(indexPath, JSON.stringify(repoIndex, null, 2));
  console.log(`  repo-index.json: ${indexWritten ? "updated" : "unchanged"} (${repoIndex.length} projects)`);

  // 3. Write viewer HTML
  const viewerHtml = generateViewerHtml();
  const viewerWritten = writeIfChanged(path.join(targetPath, "index.html"), viewerHtml);
  console.log(`  index.html (viewer): ${viewerWritten ? "updated" : "unchanged"}`);

  console.log("Done.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
