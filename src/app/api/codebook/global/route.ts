import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

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
    const filePath = path.join(process.cwd(), "data", "global-codebook.json");
    await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving global codebook:", error);
    return NextResponse.json({ error: "Failed to save codebook" }, { status: 500 });
  }
}
