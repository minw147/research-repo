import { NextRequest, NextResponse } from "next/server";
import { spawn, exec } from "child_process";
import path from "path";
import fs from "fs";

/**
 * POST /api/utils/open-folder
 * Body: { path: string } — local filesystem path (file or folder)
 * Opens the folder in the OS (e.g. Windows Explorer). If path is a file, opens its parent folder.
 * Only allowed in development for security.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_OPEN_FOLDER) {
    return NextResponse.json({ error: "Open folder only available in development" }, { status: 403 });
  }

  let body: { path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let rawPath = body.path?.trim();
  if (!rawPath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Strip file:// or file:/// so we always have a filesystem path
  if (rawPath.startsWith("file:///")) {
    rawPath = rawPath.slice(7).replace(/\//g, path.sep);
  } else if (rawPath.startsWith("file://")) {
    rawPath = rawPath.slice(6).replace(/\//g, path.sep);
  }

  // Normalize to OS path (e.g. backslashes on Windows)
  const normalized = path.normalize(rawPath);
  let dir = normalized;
  try {
    const stat = fs.statSync(normalized);
    if (stat.isFile()) {
      dir = path.dirname(normalized);
    }
  } catch {
    // Path may not exist yet; if it looks like a file, use parent
    dir = path.extname(normalized) ? path.dirname(normalized) : normalized;
  }

  try {
    if (process.platform === "win32") {
      // Use full path to explorer.exe — dev server often has no PATH to Windows dirs
      const explorerExe = path.join(process.env.SystemRoot || "C:\\Windows", "explorer.exe");
      const escaped = dir.replace(/"/g, '\\"');
      exec(`"${explorerExe}" "${escaped}"`, { windowsHide: false }, (err) => {
        if (err) console.error("Open folder exec error:", err);
      });
    } else if (process.platform === "darwin") {
      const p = spawn("open", [dir], { shell: false, stdio: "ignore" });
      p.on("error", (err) => {
        console.error("Open folder spawn error:", err);
      });
      p.unref();
    } else {
      const p = spawn("xdg-open", [dir], { shell: false, stdio: "ignore" });
      p.on("error", (err) => {
        console.error("Open folder spawn error:", err);
      });
      p.unref();
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Open folder failed:", err);
    return NextResponse.json({ error: err?.message || "Failed to open folder" }, { status: 500 });
  }
}
