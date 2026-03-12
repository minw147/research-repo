// src/lib/token-store.ts
// OAuth token storage. Persists to .next/cache/oauth-tokens.json so tokens
// survive Next.js hot-module reloads in development.

import fs from "fs";
import path from "path";

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp ms
}

const CACHE_FILE = path.join(process.cwd(), ".next", "cache", "oauth-tokens.json");

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
    // Non-fatal: in-memory store still works
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

    // Fall back to file cache when in-memory is empty (e.g. after hot-reload)
    if (!token) {
      const cached = readCacheFile();
      const fromFile = cached.get(provider);
      if (fromFile) {
        this.store = cached; // re-hydrate in-memory store
        token = fromFile;
      }
    }

    if (!token) return null;
    if (Date.now() >= token.expiresAt) {
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
