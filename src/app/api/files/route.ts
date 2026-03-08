import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

function resolveProjectPath(slug: string, filePath: string): string | null {
  const resolved = path.resolve(PROJECTS_DIR, slug, filePath);
  if (!resolved.startsWith(path.resolve(PROJECTS_DIR, slug))) return null;
  return resolved;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const file = req.nextUrl.searchParams.get("file");
  if (!slug || !file) {
    return NextResponse.json({ error: "slug and file required" }, { status: 400 });
  }
  const filePath = resolveProjectPath(slug, file);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: null });
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, file, content } = body;
  if (!slug || !file || content === undefined) {
    return NextResponse.json({ error: "slug, file, and content required" }, { status: 400 });
  }
  const filePath = resolveProjectPath(slug, file);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return NextResponse.json({ success: true });
}
