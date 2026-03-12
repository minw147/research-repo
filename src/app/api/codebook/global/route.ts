import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile, rename } from "fs/promises";
import os from "os";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "global-codebook.json");

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Global codebook not found" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading global codebook:", error);
    return NextResponse.json({ error: "Failed to read global codebook" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (
      !body ||
      !Array.isArray(body.tags) ||
      !Array.isArray(body.categories)
    ) {
      return NextResponse.json(
        { error: "Invalid codebook format" },
        { status: 400 }
      );
    }

    // Fix 1: Per-item validation on tags and categories arrays
    const invalidTag = body.tags.find(
      (t: unknown) =>
        typeof t !== "object" ||
        t === null ||
        typeof (t as Record<string, unknown>).id !== "string" ||
        typeof (t as Record<string, unknown>).label !== "string"
    );
    if (invalidTag) {
      return NextResponse.json(
        { error: "Each tag must have string id and label fields" },
        { status: 400 }
      );
    }

    const invalidCategory = body.categories.find(
      (c: unknown) => typeof c !== "string"
    );
    if (invalidCategory !== undefined) {
      return NextResponse.json(
        { error: "Each category must be a string" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "data", "global-codebook.json");

    // Fix 2: Atomic write using temp file + rename
    const tmp = path.join(os.tmpdir(), `global-codebook-${Date.now()}.json`);
    await writeFile(tmp, JSON.stringify(body, null, 2), "utf-8");
    await rename(tmp, filePath);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving global codebook:", error);
    return NextResponse.json({ error: "Failed to save codebook" }, { status: 500 });
  }
}
