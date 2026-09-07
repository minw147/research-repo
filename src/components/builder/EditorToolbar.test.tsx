import { describe, it, expect } from "vitest";
import { normalizeHref } from "./EditorToolbar";

// These lock in the exact current behavior of `normalizeHref`, ported unchanged from
// the previous Tiptap-based toolbar — including its quirks (e.g. "ftp://..." isn't
// actually rejected, just mangled, since the function only validates the *final*
// resolved protocol, not the input's own scheme prefix). This test exists to catch
// accidental behavior changes during the ProseMirror rewrite, not to certify the
// function's edge-case handling as ideal.
describe("normalizeHref", () => {
  it("returns null for empty input", () => {
    expect(normalizeHref("")).toBeNull();
    expect(normalizeHref("   ")).toBeNull();
  });

  it("returns null for incomplete protocol-only input", () => {
    expect(normalizeHref("https://")).toBeNull();
    expect(normalizeHref("http://")).toBeNull();
    expect(normalizeHref("https:")).toBeNull();
    expect(normalizeHref("http:")).toBeNull();
  });

  it("passes through a full https/http URL (URL-normalized)", () => {
    expect(normalizeHref("https://example.com")).toBe("https://example.com/");
    expect(normalizeHref("http://example.com/path")).toBe("http://example.com/path");
  });

  it("prepends https:// to a bare www. domain", () => {
    expect(normalizeHref("www.example.com")).toBe("https://www.example.com/");
  });

  it("prepends https:// to a bare domain with no scheme", () => {
    expect(normalizeHref("example.com")).toBe("https://example.com/");
  });

  it("fixes a malformed scheme missing slashes", () => {
    expect(normalizeHref("https:example.com")).toBe("https://example.com/");
  });

  it("rejects a non-http(s) scheme that resolves to an invalid authority", () => {
    expect(normalizeHref("javascript:alert(1)")).toBeNull();
  });
});
