import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePatternDetector, matchPattern, BUILT_IN_PATTERNS } from "./usePatternDetector";

// ─── matchPattern (pure) ──────────────────────────────────────────────────────

describe("matchPattern", () => {
  it("matches trigger keywords case-insensitively", () => {
    expect(matchPattern("I want to CROSS-REFERENCE my sessions", [])).not.toBeNull();
    expect(matchPattern("Can you compare sessions from last week?", [])).not.toBeNull();
  });

  it("returns the correct pattern for each built-in keyword", () => {
    expect(matchPattern("what are the themes across sessions?", [])?.keyword).toBe("extract themes");
    expect(matchPattern("what did Alice mention?", [])?.keyword).toBe("participant quote lookup");
    expect(matchPattern("can you cluster these responses?", [])?.keyword).toBe("affinity clustering");
    expect(matchPattern("compare this to the previous session", [])?.keyword).toBe("cross-reference sessions");
  });

  it("returns null when text does not match any pattern", () => {
    expect(matchPattern("show me the transcript", [])).toBeNull();
  });

  it("returns null for suppressed patterns", () => {
    const result = matchPattern("compare sessions", ["cross-reference sessions"]);
    expect(result).toBeNull();
  });

  it("still matches other patterns when one is suppressed", () => {
    const result = matchPattern("what are the themes?", ["cross-reference sessions"]);
    expect(result?.keyword).toBe("extract themes");
  });
});

// ─── usePatternDetector ───────────────────────────────────────────────────────

const mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mockLocalStorage[k] ?? null,
    setItem: (k: string, v: string) => { mockLocalStorage[k] = v; },
    removeItem: (k: string) => { delete mockLocalStorage[k]; },
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k];
});

describe("usePatternDetector — count threshold", () => {
  it("fires nudge at count >= 3", () => {
    const onNudge = vi.fn();
    const { result } = renderHook(() =>
      usePatternDetector({ sessionId: "s1", suppressed: [], onNudge })
    );

    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("previous session lookup"));
    expect(onNudge).not.toHaveBeenCalled();

    act(() => result.current.analyze("cross-reference sessions from April"));
    expect(onNudge).toHaveBeenCalledOnce();
    expect(onNudge).toHaveBeenCalledWith({
      keyword: "cross-reference sessions",
      label: "cross-reference sessions",
    });
  });

  it("does not fire nudge before count reaches 3", () => {
    const onNudge = vi.fn();
    const { result } = renderHook(() =>
      usePatternDetector({ sessionId: "s1", suppressed: [], onNudge })
    );

    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("compare sessions"));
    expect(onNudge).not.toHaveBeenCalled();
  });
});

describe("usePatternDetector — 24h cooldown", () => {
  it("does not fire again within 24 hours of last fire", () => {
    const onNudge = vi.fn();
    const { result } = renderHook(() =>
      usePatternDetector({ sessionId: "s1", suppressed: [], onNudge })
    );

    // Fire it once (3 calls)
    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("previous session"));
    act(() => result.current.analyze("cross-reference with last week"));
    expect(onNudge).toHaveBeenCalledOnce();

    // 4th call — within 24h
    act(() => result.current.analyze("compare sessions again"));
    expect(onNudge).toHaveBeenCalledOnce(); // still once

    // Advance 23 hours — still within cooldown
    vi.advanceTimersByTime(23 * 60 * 60 * 1000);
    act(() => result.current.analyze("compare sessions again"));
    expect(onNudge).toHaveBeenCalledOnce();

    // Advance past 24h
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    act(() => result.current.analyze("compare sessions after cooldown"));
    expect(onNudge).toHaveBeenCalledTimes(2);
  });
});

describe("usePatternDetector — suppression", () => {
  it("does not analyze suppressed patterns", () => {
    const onNudge = vi.fn();
    const { result } = renderHook(() =>
      usePatternDetector({
        sessionId: "s1",
        suppressed: ["cross-reference sessions"],
        onNudge,
      })
    );

    for (let i = 0; i < 5; i++) {
      act(() => result.current.analyze("compare sessions"));
    }
    expect(onNudge).not.toHaveBeenCalled();
  });
});

describe("usePatternDetector — resetCounts", () => {
  it("clears counts so nudge can fire again immediately", () => {
    const onNudge = vi.fn();
    const { result } = renderHook(() =>
      usePatternDetector({ sessionId: "s1", suppressed: [], onNudge })
    );

    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("compare sessions"));
    expect(onNudge).toHaveBeenCalledOnce();

    act(() => result.current.resetCounts());

    // After reset, should fire again at threshold
    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("compare sessions"));
    act(() => result.current.analyze("compare sessions"));
    expect(onNudge).toHaveBeenCalledTimes(2);
  });

  it("removes ra-pattern-nudge-state from localStorage", () => {
    mockLocalStorage["ra-pattern-nudge-state"] = JSON.stringify({ test: 1 });
    const { result } = renderHook(() =>
      usePatternDetector({ sessionId: "s1", suppressed: [], onNudge: vi.fn() })
    );
    act(() => result.current.resetCounts());
    expect(mockLocalStorage["ra-pattern-nudge-state"]).toBeUndefined();
  });
});
