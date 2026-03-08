import { startWatcher, addListener } from "@/lib/file-watcher";
import { sanitizeSlug } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = sanitizeSlug(url.searchParams.get("slug"));
  if (!slug) {
    return new Response("Invalid project slug", { status: 400 });
  }

  startWatcher();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const remove = addListener((data) => {
        if (data.slug !== slug) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      });

      req.signal.addEventListener("abort", () => {
        remove();
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
