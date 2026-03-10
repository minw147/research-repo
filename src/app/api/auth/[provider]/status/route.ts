// src/app/api/auth/[provider]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenStore } from "@/lib/token-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { provider: string } }
) {
  return NextResponse.json({ connected: tokenStore.isConnected(params.provider) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { provider: string } }
) {
  tokenStore.clear(params.provider);
  return NextResponse.json({ connected: false });
}
