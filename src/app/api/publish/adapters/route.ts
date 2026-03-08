// src/app/api/publish/adapters/route.ts
import { NextResponse } from "next/server";
import { listAdapters } from "@/lib/adapters";

export async function GET() {
  try {
    const adapters = listAdapters();
    return NextResponse.json(adapters);
  } catch (error: any) {
    console.error("Failed to list adapters:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to list adapters" },
      { status: 500 }
    );
  }
}
