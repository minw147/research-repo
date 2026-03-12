import { describe, it, expect, beforeEach } from "vitest";
import { tokenStore } from "./token-store";

describe("TokenStore", () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it("returns null for unknown provider", () => {
    expect(tokenStore.get("google")).toBeNull();
  });

  it("stores and retrieves a token", () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
    });
    const stored = tokenStore.get("google");
    expect(stored).not.toBeNull();
    expect(stored!.accessToken).toBe("tok");
  });

  it("returns null for expired token", () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() - 1000, // already expired
    });
    expect(tokenStore.get("google")).toBeNull();
  });

  it("isConnected returns false when no token", () => {
    expect(tokenStore.isConnected("google")).toBe(false);
  });

  it("isConnected returns true when valid token exists", () => {
    tokenStore.set("google", {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: Date.now() + 3600_000,
    });
    expect(tokenStore.isConnected("google")).toBe(true);
  });

  it("clear(provider) removes only that provider", () => {
    tokenStore.set("google", { accessToken: "g", refreshToken: "gr", expiresAt: Date.now() + 3600_000 });
    tokenStore.set("other", { accessToken: "o", refreshToken: "or", expiresAt: Date.now() + 3600_000 });
    tokenStore.clear("google");
    expect(tokenStore.isConnected("google")).toBe(false);
    expect(tokenStore.isConnected("other")).toBe(true);
  });

  it("clear() with no args removes all providers", () => {
    tokenStore.set("google", { accessToken: "g", refreshToken: "gr", expiresAt: Date.now() + 3600_000 });
    tokenStore.clear();
    expect(tokenStore.isConnected("google")).toBe(false);
  });
});
