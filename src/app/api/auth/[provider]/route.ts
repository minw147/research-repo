// src/app/api/auth/[provider]/route.ts
import { NextRequest, NextResponse } from "next/server";

const REDIRECT_BASE = "http://localhost:3000/api/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const searchParams = req.nextUrl.searchParams;

  if (provider === "google") {
    const clientId = searchParams.get("clientId");
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    const state = encodeURIComponent(JSON.stringify({
      clientId,
      clientSecret: searchParams.get("clientSecret") ?? "",
    }));
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", `${REDIRECT_BASE}/google/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);
    return NextResponse.json({ authUrl: authUrl.toString() });
  }

  return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
}
