// src/adapters/google-drive/index.ts
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import { tokenStore } from "@/lib/token-store";
import { generateViewerHtml } from "@/lib/viewer-template";

function bufferToStream(buffer: Buffer): Readable {
  const r = new Readable();
  r.push(buffer);
  r.push(null);
  return r;
}

async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
  });
  if (res.data.files.length > 0) return res.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return created.data.id;
}

async function uploadOrUpdateFile(
  drive: any,
  name: string,
  parentId: string,
  content: Buffer,
  mimeType = "application/octet-stream"
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: "files(id)",
  });
  const media = { mimeType, body: bufferToStream(content) };
  if (res.data.files.length > 0) {
    const fileId = res.data.files[0].id;
    await drive.files.update({ fileId, media });
    return fileId;
  }
  const created = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media,
    fields: "id",
  });
  return created.data.id;
}

export const GoogleDriveAdapter: PublishAdapter = {
  id: "google-drive",
  name: "Google Drive",
  description: "Upload reports to a shared Google Drive folder. Team members can download and open HTML reports locally.",
  icon: "Cloud",
  configSchema: [
    { key: "clientId", label: "Google OAuth client ID", type: "text", required: true, placeholder: "xxxxx.apps.googleusercontent.com" },
    { key: "clientSecret", label: "Google OAuth client secret", type: "password", required: true },
    { key: "folderId", label: "Drive folder ID", type: "text", required: true, placeholder: "Paste from the folder URL: /folders/{this-part}" },
    { key: "_oauth", label: "Sign in to Google Drive", type: "oauth", required: true },
  ],

  async publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult> {
    const stored = tokenStore.get("google");
    if (!stored) {
      return { success: false, message: "Not connected to Google Drive. Click 'Sign in to Google Drive' first." };
    }
    if (!config.folderId) {
      return { success: false, message: "folderId is required" };
    }

    const { project, projectDir } = payload;

    try {
      const { google } = await import("googleapis");
      const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);
      auth.setCredentials({ access_token: stored.accessToken, refresh_token: stored.refreshToken });
      const drive = google.drive({ version: "v3", auth });

      const exportDir = path.join(projectDir, "export");
      if (!fs.existsSync(exportDir)) {
        return { success: false, message: `Export directory not found: ${exportDir}. Run export first.` };
      }

      // 1. Create or get project subfolder
      const projectFolderId = await getOrCreateFolder(drive, project.id, config.folderId);

      // 2. Upload index.html
      const htmlContent = fs.readFileSync(path.join(exportDir, "index.html"));
      const htmlFileId = await uploadOrUpdateFile(drive, "index.html", projectFolderId, htmlContent, "text/html");

      // 3. Upload clips
      const clipFileIds: Record<string, string> = {};
      const clipsDir = path.join(exportDir, "clips");
      if (fs.existsSync(clipsDir)) {
        const clipsFolderId = await getOrCreateFolder(drive, "clips", projectFolderId);
        for (const clip of fs.readdirSync(clipsDir)) {
          const clipContent = fs.readFileSync(path.join(clipsDir, clip));
          clipFileIds[clip] = await uploadOrUpdateFile(drive, clip, clipsFolderId, clipContent, "video/mp4");
        }
      }

      // 4. Update repo-index.json in root folder
      let repoIndex: any[] = [];
      const existing = await drive.files.list({
        q: `name='repo-index.json' and '${config.folderId}' in parents and trashed=false`,
        fields: "files(id)",
      });
      if (existing.data.files.length > 0) {
        const fileId = existing.data.files[0].id;
        const content = await drive.files.get({ fileId, alt: "media" } as any);
        try { repoIndex = JSON.parse(content.data as string); } catch {}
      }

      const entry = {
        id: project.id,
        title: project.title,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: `${project.id}/index.html`,
        publishedUrl: null,
        driveFileIds: {
          report: htmlFileId,
          clips: clipFileIds,
        },
      };

      const idx = repoIndex.findIndex((p: any) => p.id === project.id);
      if (idx >= 0) repoIndex[idx] = entry; else repoIndex.push(entry);

      await uploadOrUpdateFile(
        drive,
        "repo-index.json",
        config.folderId,
        Buffer.from(JSON.stringify(repoIndex, null, 2)),
        "application/json"
      );

      // 5. Upload viewer index.html to root folder
      await uploadOrUpdateFile(
        drive,
        "index.html",
        config.folderId,
        Buffer.from(generateViewerHtml()),
        "text/html"
      );

      const folderUrl = `https://drive.google.com/drive/folders/${config.folderId}`;
      return { success: true, message: `Published to Google Drive`, url: folderUrl };
    } catch (err: any) {
      return { success: false, message: `Google Drive publish failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};
