// src/app/api/drive/index/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    return NextResponse.json({ error: "DRIVE_ROOT_FOLDER_ID is not configured" }, { status: 503 });
  }

  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON is not configured" }, { status: 503 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(json),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    const listRes = await drive.files.list({
      q: `name='repo-index.json' and '${rootFolderId}' in parents and trashed=false`,
      fields: "files(id)",
    });

    if (!listRes.data.files?.length) return NextResponse.json([]);

    const fileId = listRes.data.files[0].id!;
    const content = await drive.files.get(
      { fileId, alt: "media" } as any,
      { responseType: "text" }
    );

    return NextResponse.json(JSON.parse(content.data as string));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
