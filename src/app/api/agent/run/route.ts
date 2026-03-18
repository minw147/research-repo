import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { getAgentSettings } from "@/lib/agent-settings";

export const dynamic = "force-dynamic";

export function parseCustomTemplate(
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

export function isValidSessionId(id: string): boolean {
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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

      let proc: ReturnType<typeof spawn>;

      if (settings.cli === "claude") {
        const args = ["--output-format", "stream-json", "--print"];
        if (sessionId) args.push("--resume", sessionId);
        args.push(prompt);
        proc = spawn("claude", args, { shell: false });
      } else {
        const parts = parseCustomTemplate(settings.customTemplate ?? "", prompt);
        if (!parts) {
          send({
            type: "error",
            message: "Invalid CLI template — must contain {prompt}",
          });
          controller.close();
          return;
        }
        proc = spawn(parts[0], parts.slice(1), { shell: false });
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
                const text = parsed.message?.content?.[0]?.text ?? "";
                if (text) send({ type: "text", content: text });
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
        send({ type: "error", message: err.message });
        controller.close();
      });
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
