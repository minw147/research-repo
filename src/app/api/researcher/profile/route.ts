import { NextRequest } from "next/server";
import fs from "fs/promises";
import { resolveRootPath } from "@/lib/resolve-root-path";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = resolveRootPath("researcher.md");
  try {
    const content = await fs.readFile(filePath, "utf8");
    return Response.json({ content });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ content: null }, { status: 404 });
    }
    return Response.json({ error: "Failed to read researcher.md" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string") {
    return Response.json({ error: "Invalid request: content must be a string" }, { status: 400 });
  }
  if (body.content.length > 100_000) {
    return Response.json({ error: "Content too large (max 100KB)" }, { status: 400 });
  }
  const filePath = resolveRootPath("researcher.md");
  try {
    await fs.writeFile(filePath, body.content, "utf8");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to write researcher.md" }, { status: 500 });
  }
}
