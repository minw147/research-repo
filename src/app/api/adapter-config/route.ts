// src/app/api/adapter-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdapterConfig, saveAdapterConfig } from "@/lib/adapter-config";
import { sanitizeSlug } from "@/lib/projects";

export async function GET(req: NextRequest) {
  const adapterId = req.nextUrl.searchParams.get("adapterId");
  if (!adapterId || sanitizeSlug(adapterId) !== adapterId) {
    return NextResponse.json({ error: "Invalid adapterId" }, { status: 400 });
  }
  return NextResponse.json(getAdapterConfig(adapterId));
}

export async function POST(req: NextRequest) {
  const { adapterId, config } = await req.json();
  if (!adapterId || sanitizeSlug(adapterId) !== adapterId) {
    return NextResponse.json({ error: "Invalid adapterId" }, { status: 400 });
  }
  saveAdapterConfig(adapterId, config);
  return NextResponse.json({ success: true });
}
