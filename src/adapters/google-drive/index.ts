// src/adapters/google-drive/index.ts
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { PublishAdapter, PublishPayload, PublishResult } from "../types";
import { tokenStore } from "@/lib/token-store";
import { sliceTagClips } from "@/lib/slice-tag-clips";
import { extractProjectTagData } from "@/lib/extract-project-tags";
import { generateViewerHtml } from "@/lib/viewer-template";

/** Escape a value for use inside a Google Drive API query string. */
function driveEsc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function bufferToStream(buffer: Buffer): Readable {
  const r = new Readable();
  r.push(buffer);
  r.push(null);
  return r;
}

async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const res = await drive.files.list({
    q: `name='${driveEsc(name)}' and '${driveEsc(parentId)}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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
    q: `name='${driveEsc(name)}' and '${driveEsc(parentId)}' in parents and trashed=false`,
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
  icon: "HardDrive",
  configSchema: [
    {
      key: "clientId",
      label: "Google OAuth client ID",
      type: "text",
      required: true,
      placeholder: "xxxxx.apps.googleusercontent.com",
      help: {
        title: "How to create Google OAuth credentials",
        steps: [
          { text: "Open Google Cloud Console", url: "https://console.cloud.google.com/" },
          { text: "Create a new project (or select an existing one) from the project dropdown at the top." },
          { text: 'Go to APIs & Services → Library, search for "Google Drive API", and click Enable.' },
          { text: "Go to APIs & Services → Credentials → + Create Credentials → OAuth client ID." },
          { text: "If prompted, configure the OAuth consent screen first — set User Type to External, fill in the app name, and add your email as a test user." },
          { text: "Set Application type to Web application." },
          { text: "Under Authorized redirect URIs, add: http://localhost:3000/api/auth/google/callback" },
          { text: "Click Create. Copy the Client ID and Client Secret into the fields here." },
        ],
      },
    },
    { key: "clientSecret", label: "Google OAuth client secret", type: "password", required: true },
    { key: "targetFolderId", label: "Drive folder ID", type: "text", required: true, placeholder: "Paste from the folder URL: /folders/{this-part}" },
    { key: "_oauth", label: "Sign in to Google Drive", type: "oauth", required: true, provider: "google" },
  ],

  async publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult> {
    const stored = tokenStore.get("google");
    if (!stored) {
      return { success: false, message: "Not connected to Google Drive. Click 'Sign in to Google Drive' first." };
    }
    if (!config.targetFolderId) {
      return { success: false, message: "targetFolderId is required" };
    }
    if (!config.clientId || !config.clientSecret) {
      return { success: false, message: "Google OAuth client ID and client secret are required" };
    }

    const { project, projectDir } = payload;

    if (!project.id || path.basename(project.id) !== project.id) {
      return { success: false, message: `Invalid project ID: "${project.id}"` };
    }

    try {
      // Slice any clips referenced in tags.md that don't exist yet
      const sliceResults = await sliceTagClips(projectDir, project);
      const sliceErrors = sliceResults.filter((r) => r.status === "error");
      if (sliceErrors.length) {
        console.warn("[google-drive] Some clips could not be sliced:", sliceErrors);
      }

      const { google } = await import("googleapis");
      const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);
      auth.setCredentials({ access_token: stored.accessToken, refresh_token: stored.refreshToken });

      // Persist refreshed tokens automatically so the user stays connected
      // after the 1-hour access token window without re-doing the consent flow.
      auth.on("tokens", (tokens) => {
        const current = tokenStore.get("google");
        tokenStore.set("google", {
          accessToken: tokens.access_token ?? stored.accessToken,
          refreshToken: tokens.refresh_token ?? current?.refreshToken ?? stored.refreshToken,
          expiresAt: tokens.expiry_date ?? (Date.now() + 3600 * 1000),
        });
      });

      const drive = google.drive({ version: "v3", auth });

      // 1. Create or get project subfolder
      const projectFolderId = await getOrCreateFolder(drive, project.id, config.targetFolderId);

      // 2. Upload index.html if the export dir exists (optional)
      let htmlFileId: string | null = null;
      const exportDir = path.join(projectDir, "export");
      const htmlPath = path.join(exportDir, "index.html");
      if (fs.existsSync(htmlPath)) {
        htmlFileId = await uploadOrUpdateFile(
          drive, "index.html", projectFolderId,
          fs.readFileSync(htmlPath), "text/html"
        );
      }

      // 3. Upload clips from {projectDir}/clips/ — freshly sliced at publish time
      const clipFileIds: Record<string, string> = {};
      const projectClipsDir = path.join(projectDir, "clips");
      if (fs.existsSync(projectClipsDir)) {
        const clipsFolderId = await getOrCreateFolder(drive, "clips", projectFolderId);
        for (const clip of fs.readdirSync(projectClipsDir)) {
          if (!clip.endsWith(".mp4")) continue;
          clipFileIds[clip] = await uploadOrUpdateFile(
            drive, clip, clipsFolderId,
            fs.readFileSync(path.join(projectClipsDir, clip)), "video/mp4"
          );
        }
      }

      // 4. Update repo-index.json in root folder
      let repoIndex: any[] = [];
      const existing = await drive.files.list({
        q: `name='repo-index.json' and '${driveEsc(config.targetFolderId)}' in parents and trashed=false`,
        fields: "files(id)",
      });
      if (existing.data.files.length > 0) {
        const fileId = existing.data.files[0].id;
        const content = await drive.files.get({ fileId, alt: "media" } as any);
        try { repoIndex = JSON.parse(content.data as string); } catch {}
      }

      const tagData = extractProjectTagData(projectDir, project);
      const entry = {
        id: project.id,
        title: project.title,
        date: project.date,
        researcher: project.researcher,
        persona: project.persona,
        product: project.product,
        findingsHtml: htmlFileId ? `${project.id}/index.html` : null,
        publishedUrl: null,
        quotes: tagData.quotes,
        codebook: tagData.codebook,
        driveFileIds: { report: htmlFileId, clips: clipFileIds },
      };

      const idx = repoIndex.findIndex((p: any) => p.id === project.id);
      if (idx >= 0) repoIndex[idx] = entry; else repoIndex.push(entry);

      await uploadOrUpdateFile(
        drive, "repo-index.json", config.targetFolderId,
        Buffer.from(JSON.stringify(repoIndex, null, 2)),
        "application/json"
      );

      // 5. Upload hub viewer index.html with inlined data to root folder
      await uploadOrUpdateFile(
        drive, "index.html", config.targetFolderId,
        Buffer.from(generateViewerHtml({ data: repoIndex }), "utf-8"),
        "text/html"
      );

      const folderUrl = `https://drive.google.com/drive/folders/${config.targetFolderId}`;
      return { success: true, message: `Published to Google Drive`, url: folderUrl };
    } catch (err: any) {
      return { success: false, message: `Google Drive publish failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};
