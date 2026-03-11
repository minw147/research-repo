import fs from "fs";
import path from "path";

/**
 * Resolve the path to the ffmpeg binary at runtime.
 * Prefer process.cwd() + node_modules so it works when ffmpeg-static is bundled by Next.js
 * (bundling breaks __dirname inside the package and causes ENOENT).
 */
export function getFfmpegPath(): string | null {
  const envPath = process.env.FFMPEG_BIN;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const localPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  try {
    const fromPackage = require("ffmpeg-static") as string | null; // eslint-disable-line
    if (fromPackage && fs.existsSync(fromPackage)) {
      return fromPackage;
    }
  } catch {
    // ignore
  }

  return null;
}
