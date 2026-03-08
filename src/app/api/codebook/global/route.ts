import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
