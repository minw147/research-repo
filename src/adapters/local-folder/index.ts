// src/adapters/local-folder/index.ts
import { PublishAdapter } from "../types";
import fs from "fs";
import path from "path";
import { generateViewerHtml } from "@/lib/viewer-template";
import { extractProjectTagData } from "@/lib/extract-project-tags";
import { sliceTagClips } from "@/lib/slice-tag-clips";

export const LocalFolderAdapter: PublishAdapter = {
  id: "local-folder",
  name: "Local Folder",
  description: "Choose a folder (or location) where the exported report will be stored.",
  icon: "Folder",
  configSchema: [
    { key: "targetPath", label: "Destination folder", type: "path", required: true, placeholder: "e.g. C:\\Reports or /Users/name/Reports" }
  ],
  async publish(payload, config) {
    const { projectDir, project } = payload;
    const { targetPath } = config;

    if (!targetPath) {
      return { success: false, message: "Please choose a folder or location to store the export." };
    }

    if (!project.id || path.basename(project.id) !== project.id) {
      return { success: false, message: `Invalid project ID: "${project.id}"` };
    }

    try {
      // Slice any clips referenced in tags.md that don't exist yet
      const sliceResults = await sliceTagClips(projectDir, project);
      const sliceErrors = sliceResults.filter((r) => r.status === "error");
      if (sliceErrors.length) {
        console.warn("[local-folder] Some clips could not be sliced:", sliceErrors);
      }

      fs.mkdirSync(targetPath, { recursive: true });

      // Publish to a project-specific subdirectory
      const destDir = path.join(targetPath, project.id);
      fs.mkdirSync(destDir, { recursive: true });

      // 1. Copy HTML report if it exists (optional — tag board works without it)
      //    Copy only index.html, not export/clips/ — clips come from {projectDir}/clips/ below
      const exportHtml = path.join(projectDir, "export", "index.html");
      if (fs.existsSync(exportHtml)) {
        fs.copyFileSync(exportHtml, path.join(destDir, "index.html"));
      }

      // 2. Copy clips — {projectDir}/clips/ is the single source of truth
      const projectClipsDir = path.join(projectDir, "clips");
      if (fs.existsSync(projectClipsDir)) {
        fs.mkdirSync(path.join(destDir, "clips"), { recursive: true });
        fs.cpSync(projectClipsDir, path.join(destDir, "clips"), { recursive: true, force: true });
      }

      // 3. Update repo-index.json at the root of targetPath
      const indexPath = path.join(targetPath, "repo-index.json");
      let repoIndex: any[] = [];
      if (fs.existsSync(indexPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
          repoIndex = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Failed to parse repo-index.json, starting fresh", e);
        }
      }

      // Only link to the findings report if it was actually published
      const hasReport = fs.existsSync(path.join(destDir, "index.html"));

      const tagData = extractProjectTagData(projectDir, project, process.cwd());
      const entry = {
        id: project.id,
        title: project.title,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: hasReport ? `${project.id}/index.html` : null,
        publishedUrl: project.publishedUrl,
        quotes: tagData.quotes,
        codebook: tagData.codebook,
      };

      const existingIndex = repoIndex.findIndex(p => p.id === project.id);
      if (existingIndex >= 0) {
        repoIndex[existingIndex] = entry;
      } else {
        repoIndex.push(entry);
      }

      fs.writeFileSync(indexPath, JSON.stringify(repoIndex, null, 2));

      // Keep the viewer HTML up to date. Data is inlined so stakeholders can
      // double-click index.html directly (file:// protocol, no server needed).
      fs.writeFileSync(path.join(targetPath, "index.html"), generateViewerHtml({ data: repoIndex }), "utf-8");

      return {
        success: true,
        message: `Published to ${destDir}`,
        url: path.join(destDir, "index.html"), // Project report (not the repo viewer at target root)
      };
    } catch (error) {
      console.error("Publishing to local folder failed:", error);
      return { success: false, message: `Publish failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
};
