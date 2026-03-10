// src/lib/drive-service-account.ts
// Edge-compatible: uses jose for JWT signing, raw fetch for token exchange.
// Used by Edge API routes that proxy Google Drive content.

import { SignJWT, importPKCS8 } from "jose";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

/**
 * Returns a short-lived Google OAuth access token using the service account.
 * Called per-request in Edge Functions (no shared in-memory cache across invocations).
 */
export async function getDriveToken(): Promise<string> {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set");

  const key: ServiceAccountKey = JSON.parse(json);
  const privateKey = await importPKCS8(key.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iss: key.client_email,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Service account token exchange failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}
