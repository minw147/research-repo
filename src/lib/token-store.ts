// src/lib/token-store.ts
// In-memory OAuth token storage. Resets on server restart.
// Acceptable for local-first dev tool usage.

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp ms
}

class TokenStore {
  private store = new Map<string, StoredToken>();

  set(provider: string, token: StoredToken): void {
    this.store.set(provider, token);
  }

  get(provider: string): StoredToken | null {
    const token = this.store.get(provider);
    if (!token) return null;
    if (Date.now() >= token.expiresAt) {
      this.store.delete(provider);
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
  }
}

export const tokenStore = new TokenStore();
