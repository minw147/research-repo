import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAutosaveController, defaultIsSuspiciouslyEmpty } from "./autosave";

describe("createAutosaveController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing on a non-doc-changing transaction", () => {
    const onDebouncedChange = vi.fn();
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange,
      onWrite: vi.fn(),
      serialize: () => "md",
    });
    controller.onTransaction(false);
    vi.advanceTimersByTime(1000);
    expect(onDebouncedChange).not.toHaveBeenCalled();
  });

  it("debounces and fires once per pause in typing, not once per keystroke", () => {
    const onDebouncedChange = vi.fn();
    let n = 0;
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange,
      onWrite: vi.fn(),
      serialize: () => `md-${++n}`,
    });
    controller.onTransaction(true);
    vi.advanceTimersByTime(200);
    controller.onTransaction(true); // restarts the timer
    vi.advanceTimersByTime(200);
    controller.onTransaction(true); // restarts again
    vi.advanceTimersByTime(499);
    expect(onDebouncedChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    expect(onDebouncedChange).toHaveBeenCalledWith("md-1");
  });

  it("never calls onWrite from the debounced path — only in-memory onDebouncedChange", () => {
    const onWrite = vi.fn();
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange: vi.fn(),
      onWrite,
      serialize: () => "md",
    });
    controller.onTransaction(true);
    vi.advanceTimersByTime(600);
    expect(onWrite).not.toHaveBeenCalled();
  });

  it("flushAndWrite cancels a pending debounce and writes immediately", () => {
    const onDebouncedChange = vi.fn();
    const onWrite = vi.fn();
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange,
      onWrite,
      serialize: () => "final markdown content long enough to not be guarded",
    });
    controller.onTransaction(true);
    const result = controller.flushAndWrite("blur");
    expect(result.blocked).toBe(false);
    expect(onWrite).toHaveBeenCalledWith("final markdown content long enough to not be guarded");
    vi.advanceTimersByTime(1000);
    expect(onDebouncedChange).not.toHaveBeenCalled(); // debounce was cancelled, not just delayed
  });

  it("blocks a write when the candidate is suspiciously empty relative to last known good", () => {
    const goodContent = "x".repeat(500);
    const onWrite = vi.fn();
    let serialized = goodContent;
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange: vi.fn(),
      onWrite,
      serialize: () => serialized,
    });
    controller.noteExternalKnownGood(goodContent);
    // First a legitimate small edit that keeps content mostly intact.
    serialized = goodContent.slice(0, 480);
    expect(controller.flushAndWrite("manual-save").blocked).toBe(false);
    // Then a parse gone badly wrong — nearly empty compared to what's on disk.
    serialized = "x";
    const result = controller.flushAndWrite("manual-save");
    expect(result.blocked).toBe(true);
    expect(onWrite).toHaveBeenCalledTimes(1); // only the first, legitimate write went through
  });

  it("does not block legitimately short/new documents", () => {
    const onWrite = vi.fn();
    const controller = createAutosaveController({
      debounceMs: 500,
      onDebouncedChange: vi.fn(),
      onWrite,
      serialize: () => "hi",
    });
    controller.noteExternalKnownGood(""); // brand-new, empty document
    expect(controller.flushAndWrite("manual-save").blocked).toBe(false);
    expect(onWrite).toHaveBeenCalledWith("hi");
  });
});

describe("defaultIsSuspiciouslyEmpty", () => {
  it("never guards content under the minimum-length threshold", () => {
    expect(defaultIsSuspiciouslyEmpty("", "short")).toBe(false);
  });

  it("flags a candidate under 15% of a substantial last-known-good length", () => {
    const good = "x".repeat(1000);
    expect(defaultIsSuspiciouslyEmpty("x".repeat(100), good)).toBe(true);
    expect(defaultIsSuspiciouslyEmpty("x".repeat(200), good)).toBe(false);
  });
});
