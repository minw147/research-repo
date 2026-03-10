// src/lib/drive-service-account.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getDriveToken", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  });

  it("throws if GOOGLE_SERVICE_ACCOUNT_JSON is not set", async () => {
    const { getDriveToken } = await import("./drive-service-account");
    await expect(getDriveToken()).rejects.toThrow("GOOGLE_SERVICE_ACCOUNT_JSON");
  });
});
