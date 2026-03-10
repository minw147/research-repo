// src/adapters/sharepoint-onedrive/index.ts
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import fs from "fs";
import path from "path";
import { generateViewerHtml } from "@/lib/viewer-template";

export const SharePointOneDriveAdapter: PublishAdapter = {
  id: "sharepoint-onedrive",
  name: "SharePoint (via OneDrive Sync)",
  description: "Publish to a SharePoint library by writing to your locally synced OneDrive folder. No Azure setup required.",
  icon: "Share2",
  configSchema: [
    {
      key: "syncedPath",
      label: "Path to your synced SharePoint folder",
      type: "path",
      required: true,
      placeholder: "e.g. C:\\Users\\you\\Contoso\\Research Reports",
    },
  ],

  async publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult> {
    const { projectDir, project } = payload;
    const targetPath = config.syncedPath;

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

      const destDir = path.join(targetPath, project.id);
      fs.mkdirSync(destDir, { recursive: true });

      fs.cpSync(exportDir, destDir, { recursive: true, force: true });

      // Update repo-index.json
      const indexPath = path.join(targetPath, "repo-index.json");
      let repoIndex: any[] = [];
      if (fs.existsSync(indexPath)) {
        try {
          repoIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        } catch (e) {
          console.error("Failed to parse repo-index.json, starting fresh", e);
        }
      }

      const entry = {
        id: project.id,
        title: project.title,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: `${project.id}/index.html`,
        publishedUrl: project.publishedUrl ?? null,
      };

      const idx = repoIndex.findIndex((p: any) => p.id === project.id);
      if (idx >= 0) {
        repoIndex[idx] = entry;
      } else {
        repoIndex.push(entry);
      }

      fs.writeFileSync(indexPath, JSON.stringify(repoIndex, null, 2));

      // Write viewer HTML
      fs.writeFileSync(path.join(targetPath, "index.html"), generateViewerHtml(), "utf-8");

      return {
        success: true,
        message: `Published to SharePoint via OneDrive: ${destDir}`,
        url: path.join(destDir, "index.html"),
      };
    } catch (error) {
      return {
        success: false,
        message: `Publish failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
