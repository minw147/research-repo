// src/app/api/drive/report/[fileId]/route.ts
export const runtime = "edge";

import { getDriveToken } from "@/lib/drive-service-account";

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  if (!fileId || !/^[-\w]+$/.test(fileId)) {
    return new Response("Invalid fileId", { status: 400 });
  }

  try {
    const token = await getDriveToken();
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!driveRes.ok) {
      return new Response(`Drive error: ${driveRes.status}`, { status: driveRes.status });
    }

    return new Response(driveRes.body, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        // Sandbox the proxied HTML to limit same-origin script execution risk.
        "Content-Security-Policy": "sandbox allow-scripts allow-same-origin",
      },
    });
  } catch (err: any) {
    console.error("[drive/report] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
