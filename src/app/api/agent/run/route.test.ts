import { describe, it, expect } from "vitest";
import { parseCustomTemplate, isValidSessionId } from "./route";

describe("parseCustomTemplate", () => {
  it("returns argv array when template has exactly one {prompt}", () => {
    expect(parseCustomTemplate("opencode run {prompt}", "hello world")).toEqual([
      "opencode",
      "run",
      "hello world",
    ]);
  });

  it("substitutes {prompt} with the provided prompt string", () => {
    expect(parseCustomTemplate("echo {prompt}", "my text")).toEqual([
      "echo",
      "my text",
    ]);
  });

  it("returns null when {prompt} is missing", () => {
    expect(parseCustomTemplate("opencode run", "x")).toBeNull();
  });

  it("returns null when {prompt} appears twice", () => {
    expect(parseCustomTemplate("{prompt} {prompt}", "x")).toBeNull();
  });

  it("handles leading/trailing whitespace in template", () => {
    expect(parseCustomTemplate("  echo  {prompt}  ", "hi")).toEqual(["echo", "hi"]);
  });
});

describe("isValidSessionId", () => {
  it("accepts alphanumeric + hyphens + underscores", () => {
    expect(isValidSessionId("abc-123_XYZ")).toBe(true);
  });

  it("accepts a single alphanumeric character", () => {
    expect(isValidSessionId("a")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isValidSessionId("../etc/passwd")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidSessionId("")).toBe(false);
  });

  it("rejects strings longer than 128 characters", () => {
    expect(isValidSessionId("a".repeat(129))).toBe(false);
  });

  it("rejects strings with spaces", () => {
    expect(isValidSessionId("session id")).toBe(false);
  });
});
