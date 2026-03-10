// src/adapters/local-folder/index.ts
import { PublishAdapter } from "../types";
import fs from "fs";
import path from "path";

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
      const exportDir = path.join(projectDir, "export");

      if (!fs.existsSync(exportDir)) {
        return { success: false, message: `Export directory not found: ${exportDir}. Run export first.` };
      }

      fs.mkdirSync(targetPath, { recursive: true });

      // Publish to a project-specific subdirectory
      const destDir = path.join(targetPath, project.id);
      fs.mkdirSync(destDir, { recursive: true });

      // 1. Copy project files
      // Using cpSync for recursive copy
      fs.cpSync(exportDir, destDir, { recursive: true, force: true });

      // 2. Update repo-index.json at the root of targetPath
      const indexPath = path.join(targetPath, "repo-index.json");
      let repoIndex: any[] = [];
      if (fs.existsSync(indexPath)) {
        try {
          repoIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        } catch (e) {
          console.error("Failed to parse repo-index.json, starting fresh", e);
        }
      }

      // Update or add entry
      const entry = {
        id: project.id,
        title: project.title,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: `${project.id}/index.html`,
        publishedUrl: project.publishedUrl
      };

      const existingIndex = repoIndex.findIndex(p => p.id === project.id);
      if (existingIndex >= 0) {
        repoIndex[existingIndex] = entry;
      } else {
        repoIndex.push(entry);
      }

      fs.writeFileSync(indexPath, JSON.stringify(repoIndex, null, 2));

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
