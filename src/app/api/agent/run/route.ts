import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { getAgentSettings } from "@/lib/agent-settings";

export const dynamic = "force-dynamic";

function parseCustomTemplate(
  template: string,
  prompt: string
): string[] | null {
  const occurrences = (template.match(/\{prompt\}/g) ?? []).length;
  if (occurrences !== 1) return null;
  return template
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (p === "{prompt}" ? prompt : p));
}

function isValidSessionId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, sessionId } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length > 50_000) {
    return Response.json({ error: "Invalid prompt" }, { status: 400 });
  }
  if (sessionId !== undefined && !isValidSessionId(sessionId)) {
    return Response.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  const settings = getAgentSettings();
  const encoder = new TextEncoder();

  // On Windows, npm-installed CLIs are .cmd wrappers that require shell:true
  // so cmd.exe resolves the PATHEXT (.cmd/.bat) automatically.
  const isWindows = process.platform === "win32";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

      try {
        let proc: ReturnType<typeof spawn>;

        if (settings.cli === "claude") {
          // Pass prompt via stdin — avoids command-line length limits (~8 KB on
          // Windows) and shell injection risks. `claude --print` reads stdin
          // when no positional prompt argument is given.
          const args = [
            "--output-format", "stream-json",
            "--verbose",
            "--print",
            "--dangerously-skip-permissions",
          ];
          if (sessionId) args.push("--resume", sessionId);
          proc = spawn("claude", args, { shell: isWindows });
          proc.stdin?.write(prompt);
          proc.stdin?.end();
        } else {
          const parts = parseCustomTemplate(settings.customTemplate ?? "", prompt);
          if (!parts) {
            send({ type: "error", message: "Invalid CLI template — must contain {prompt}" });
            controller.close();
            return;
          }
          proc = spawn(parts[0], parts.slice(1), { shell: isWindows });
        }

        req.signal.addEventListener("abort", () => {
          proc.kill();
          controller.close();
        });

        let lineBuffer = "";
        proc.stdout.on("data", (chunk: Buffer) => {
          lineBuffer += chunk.toString("utf8");
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (settings.cli === "claude") {
              try {
                const parsed = JSON.parse(trimmed);
                if (parsed.type === "assistant") {
                  const blocks: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }> =
                    parsed.message?.content ?? [];
                  for (const block of blocks) {
                    if (block.type === "text" && block.text) {
                      send({ type: "text", content: block.text });
                    } else if (block.type === "tool_use" && block.name) {
                      // Summarise the tool call so the user sees activity
                      const inp = block.input ?? {};
                      const summary =
                        (inp.command as string) ??
                        (inp.file_path as string) ??
                        (inp.pattern as string) ??
                        (inp.path as string) ??
                        JSON.stringify(inp).slice(0, 80);
                      send({ type: "tool", name: block.name, summary });
                    }
                  }
                } else if (parsed.type === "result") {
                  if (parsed.session_id)
                    send({ type: "session", id: parsed.session_id });
                  send({ type: "done" });
                }
              } catch {
                /* skip malformed lines */
              }
            } else {
              send({ type: "text", content: trimmed });
            }
          }
        });

        proc.stderr.on("data", (chunk: Buffer) => {
          send({ type: "text", content: `[stderr] ${chunk.toString("utf8")}` });
        });

        proc.on("close", (code) => {
          if (settings.cli === "custom") send({ type: "done" });
          if (code !== 0 && code !== null)
            send({ type: "error", message: `Process exited with code ${code}` });
          controller.close();
        });

        proc.on("error", (err) => {
          send({ type: "error", message: `Failed to start CLI: ${err.message}` });
          controller.close();
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: `Server error: ${msg}` });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
