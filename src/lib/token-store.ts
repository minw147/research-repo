// src/lib/token-store.ts
// OAuth token storage. Persists to content/.oauth-tokens.json — a stable
// location that survives Next.js dev-server restarts, hot-module reloads,
// and `npm run build` cache wipes.

import fs from "fs";
import path from "path";

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp ms
}

const CACHE_FILE = path.join(process.cwd(), "content", ".oauth-tokens.json");

function readCacheFile(): Map<string, StoredToken> {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, StoredToken>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function writeCacheFile(store: Map<string, StoredToken>): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(store), null, 2));
  } catch {
    // Non-fatal: in-memory store still works for this session
  }
}

class TokenStore {
  private store = new Map<string, StoredToken>();

  set(provider: string, token: StoredToken): void {
    this.store.set(provider, token);
    writeCacheFile(this.store);
  }

  get(provider: string): StoredToken | null {
    let token = this.store.get(provider);

    // Fall back to file cache when in-memory is empty (e.g. after hot-reload / restart)
    if (!token) {
      const cached = readCacheFile();
      const fromFile = cached.get(provider);
      if (fromFile) {
        this.store = cached;
        token = fromFile;
      }
    }

    if (!token) return null;

    // If the access token is expired but we have a refresh token, still return
    // the stored credentials — the OAuth2 client (googleapis) will use the
    // refresh token to obtain a new access token automatically.
    // Only treat as disconnected when there is no refresh token AND the access
    // token is past its expiry.
    if (Date.now() >= token.expiresAt && !token.refreshToken) {
      this.store.delete(provider);
      writeCacheFile(this.store);
      return null;
    }

    return token;
  }

  isConnected(provider: string): boolean {
    return this.get(provider) !== null;
  }

  clear(provider?: string): void {
    if (provider) {
      this.store.delete(provider);
    } else {
      this.store.clear();
    }
    writeCacheFile(this.store);
  }
}

export const tokenStore = new TokenStore();
