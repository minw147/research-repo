// src/adapters/sharepoint-onedrive/index.ts
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import fs from "fs";
import path from "path";
import { generateViewerHtml } from "@/lib/viewer-template";
import { extractProjectTagData } from "@/lib/extract-project-tags";
import { sliceTagClips } from "@/lib/slice-tag-clips";

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
      // Slice any clips referenced in tags.md that don't exist yet
      const sliceResults = await sliceTagClips(projectDir, project);
      const sliceErrors = sliceResults.filter((r) => r.status === "error");
      if (sliceErrors.length) {
        console.warn("[sharepoint-onedrive] Some clips could not be sliced:", sliceErrors);
      }

      fs.mkdirSync(targetPath, { recursive: true });

      const destDir = path.join(targetPath, project.id);
      fs.mkdirSync(destDir, { recursive: true });

      // Copy HTML report if it exists (optional — tag board works without it)
      // Copy only index.html, not export/clips/ — clips come from {projectDir}/clips/ below
      const exportHtml = path.join(projectDir, "export", "index.html");
      if (fs.existsSync(exportHtml)) {
        fs.copyFileSync(exportHtml, path.join(destDir, "index.html"));
      }

      // Copy clips — {projectDir}/clips/ is the single source of truth
      const projectClipsDir = path.join(projectDir, "clips");
      if (fs.existsSync(projectClipsDir)) {
        fs.mkdirSync(path.join(destDir, "clips"), { recursive: true });
        fs.cpSync(projectClipsDir, path.join(destDir, "clips"), { recursive: true, force: true });
      }

      // Update repo-index.json
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
        publishedUrl: project.publishedUrl ?? null,
        quotes: tagData.quotes,
        codebook: tagData.codebook,
      };

      const idx = repoIndex.findIndex((p: any) => p.id === project.id);
      if (idx >= 0) {
        repoIndex[idx] = entry;
      } else {
        repoIndex.push(entry);
      }

      fs.writeFileSync(indexPath, JSON.stringify(repoIndex, null, 2));

      // Keep the viewer HTML up to date. Data is inlined so stakeholders can
      // double-click index.html directly from the SharePoint folder (file:// protocol).
      fs.writeFileSync(path.join(targetPath, "index.html"), generateViewerHtml({ data: repoIndex }), "utf-8");

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
