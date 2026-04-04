import { spawn } from "child_process";
import { getAgentSettings } from "@/lib/agent-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getAgentSettings();
  const isWindows = process.platform === "win32";

  if (settings.cli === "custom") {
    return Response.json({ ok: true, version: "custom CLI" });
  }

  return new Promise<Response>((resolve) => {
    const proc = spawn("claude", ["--version"], { shell: isWindows });
    let output = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });

    proc.on("close", (code) => {
      if (code === 0 && output.trim()) {
        resolve(Response.json({ ok: true, version: output.trim() }));
      } else {
        resolve(Response.json({ ok: false, version: null }, { status: 503 }));
      }
    });

    proc.on("error", () => {
      resolve(Response.json({ ok: false, version: null }, { status: 503 }));
    });

    // Timeout after 3s
    setTimeout(() => {
      proc.kill();
      resolve(Response.json({ ok: false, version: null, error: "timeout" }, { status: 503 }));
    }, 3000);
  });
}
