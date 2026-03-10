// src/app/api/auth/[provider]/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenStore } from "@/lib/token-store";

const REDIRECT_BASE = "http://localhost:3000/api/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return new NextResponse(
      `<html><body><h2 style="font-family:system-ui;text-align:center;margin-top:4rem;color:#dc2626">Auth error: no code returned</h2></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    if (provider === "google") {
      const state = req.nextUrl.searchParams.get("state") ?? "{}";
      let clientId = "", clientSecret = "";
      try {
        ({ clientId, clientSecret } = JSON.parse(decodeURIComponent(state)));
      } catch {}

      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${REDIRECT_BASE}/google/callback`,
        grant_type: "authorization_code",
      });

      const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error_description ?? "Token exchange failed");

      tokenStore.set("google", {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      });
    } else {
      return new NextResponse(
        `<html><body><h2 style="font-family:system-ui;text-align:center;margin-top:4rem;color:#dc2626">Unknown provider: ${provider}</h2></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    return new NextResponse(
      `<html><body><h2 style="font-family:system-ui;text-align:center;margin-top:4rem">Connected successfully. You can close this tab.</h2><script>window.close()</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return new NextResponse(
      `<html><body><h2 style="font-family:system-ui;text-align:center;margin-top:4rem;color:#dc2626">Auth error: ${err.message}</h2></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
