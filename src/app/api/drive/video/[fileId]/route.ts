// src/app/api/drive/video/[fileId]/route.ts
export const runtime = "edge";

import { getDriveToken } from "@/lib/drive-service-account";

export async function GET(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  if (!fileId || !/^[-\w]+$/.test(fileId)) {
    return new Response("Invalid fileId", { status: 400 });
  }

  try {
    const token = await getDriveToken();
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const range = req.headers.get("Range");
    if (range) headers["Range"] = range;

    const driveRes = await fetch(driveUrl, { headers });

    if (!driveRes.ok) {
      console.error("[drive/video] Drive error:", driveRes.status);
      return new Response("Drive error", { status: driveRes.status });
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": driveRes.headers.get("Content-Type") ?? "video/mp4",
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    };
    const contentRange = driveRes.headers.get("Content-Range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;
    const contentLength = driveRes.headers.get("Content-Length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[drive/video] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
