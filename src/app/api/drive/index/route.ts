// src/app/api/drive/index/route.ts
export const runtime = "edge";

import { getDriveToken } from "@/lib/drive-service-account";

const FOLDER_ID_RE = /^[-\w]+$/;

export async function GET() {
  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    return Response.json({ error: "DRIVE_ROOT_FOLDER_ID is not configured" }, { status: 503 });
  }
  if (!FOLDER_ID_RE.test(rootFolderId)) {
    return Response.json({ error: "DRIVE_ROOT_FOLDER_ID is misconfigured" }, { status: 503 });
  }

  try {
    const token = await getDriveToken();

    // Find repo-index.json in the root folder
    const q = encodeURIComponent(
      `name='repo-index.json' and '${rootFolderId}' in parents and trashed=false`
    );
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!listRes.ok) {
      console.error("[drive/index] Drive list error:", listRes.status);
      return Response.json({ error: "Failed to query Drive" }, { status: 502 });
    }

    const listData = await listRes.json();
    if (!listData.files?.length) return Response.json([]);

    const fileId: string = listData.files[0].id;
    const contentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!contentRes.ok) {
      console.error("[drive/index] Drive get error:", contentRes.status);
      return Response.json({ error: "Failed to read index file" }, { status: 502 });
    }

    const text = await contentRes.text();
    return Response.json(JSON.parse(text));
  } catch (err: any) {
    console.error("[drive/index] Unexpected error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
