import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useResearchChat,
  buildTier1Context,
  sanitizeUserInput,
  isSignalMessage,
  type ChatMessage,
} from "./useResearchChat";

// ─── Pure function tests ───────────────────────────────────────────────────────

describe("buildTier1Context", () => {
  it("includes profile, page context, and recent non-signal messages", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "hello", ts: 1 },
      { role: "assistant", content: "hi", ts: 2, signal: true },
      { role: "assistant", content: "how can I help?", ts: 3 },
    ];
    const result = buildTier1Context({
      profileContent: "# Researcher\n- Name: Alice",
      pathname: "/projects/p1",
      history,
    });
    expect(result).toContain("Alice");
    expect(result).toContain("/projects/p1");
    expect(result).toContain("hello");
    expect(result).toContain("how can I help?");
    // Signal message must be excluded
    expect(result).not.toContain("[DOCUMENT_HABIT:");
    expect(result).not.toContain("[SUPPRESS_PATTERN:");
    expect(result).not.toContain("[object Object]");
  });

  it("caps researcher.md at 2000 Unicode chars (not bytes)", () => {
    // Use 3-byte emoji to confirm Unicode-aware slicing
    const emoji = "🔬"; // 4 bytes but 1 char
    const longProfile = emoji.repeat(2100); // 2100 chars
    const result = buildTier1Context({
      profileContent: longProfile,
      pathname: "/",
      history: [],
    });
    // Should contain exactly 2000 emojis, not more
    const profileSection = result.match(/<researcher_profile>([\s\S]*?)<\/researcher_profile>/)?.[1] ?? "";
    expect([...profileSection.trim()].length).toBeLessThanOrEqual(2000);
  });

  it("only includes last 10 non-signal messages from history", () => {
    const history: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
      role: "user" as const,
      content: `msg-${i}`,
      ts: i,
    }));
    const result = buildTier1Context({ profileContent: null, pathname: "/", history });
    expect(result).not.toContain("msg-0");
    expect(result).not.toContain("msg-4");
    expect(result).toContain("msg-14");
  });

  it("handles null profileContent without crashing", () => {
    const result = buildTier1Context({ profileContent: null, pathname: "/", history: [] });
    expect(result).not.toContain("researcher_profile");
    expect(result).toContain("/");
  });
});

describe("sanitizeUserInput", () => {
  it("escapes [DOCUMENT_HABIT: prefix", () => {
    const out = sanitizeUserInput("[DOCUMENT_HABIT: test]");
    expect(out).toBe("\\[DOCUMENT_HABIT: test]");
  });

  it("escapes [SUPPRESS_PATTERN: prefix", () => {
    const out = sanitizeUserInput("[SUPPRESS_PATTERN: cross-reference]");
    expect(out).toBe("\\[SUPPRESS_PATTERN: cross-reference]");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeUserInput("What are the themes?")).toBe("What are the themes?");
  });
});

describe("isSignalMessage", () => {
  it("returns true for DOCUMENT_HABIT messages", () => {
    expect(isSignalMessage("[DOCUMENT_HABIT: cross-reference sessions]")).toBe(true);
  });

  it("returns true for SUPPRESS_PATTERN messages", () => {
    expect(isSignalMessage("[SUPPRESS_PATTERN: cross-reference]")).toBe(true);
  });

  it("returns false for normal messages", () => {
    expect(isSignalMessage("Here are the themes I found.")).toBe(false);
  });
});

// ─── Hook tests ───────────────────────────────────────────────────────────────

const mockLocalStorage: Record<string, string> = {};
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mockLocalStorage[k] ?? null,
    setItem: (k: string, v: string) => { mockLocalStorage[k] = v; },
    removeItem: (k: string) => { delete mockLocalStorage[k]; },
    clear: () => { for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k]; },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k];
});

/** Build a minimal SSE stream from an array of data strings. */
function makeSseStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const ev of events) {
        controller.enqueue(encoder.encode(`data: ${ev}\n\n`));
      }
      controller.close();
    },
  });
}

function makeOkSseResponse(events: string[]) {
  return { ok: true, status: 200, body: makeSseStream(events) };
}

describe("useResearchChat — ring buffer", () => {
  it("evicts oldest message when history exceeds 50", async () => {
    // Pre-fill localStorage with 50 messages
    const initial: ChatMessage[] = Array.from({ length: 50 }, (_, i) => ({
      role: "user" as const,
      content: `msg-${i}`,
      ts: i,
    }));
    mockLocalStorage["ra-history"] = JSON.stringify(initial);

    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "reply" }] } }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );

    await act(async () => {
      await result.current.sendMessage("msg-50");
    });

    await waitFor(() => !result.current.streaming);

    // History should have 50 entries (ring buffer capped)
    expect(result.current.history.length).toBeLessThanOrEqual(50);
    // msg-0 should be evicted
    expect(result.current.history.find((m) => m.content === "msg-0")).toBeUndefined();
  });
});

describe("useResearchChat — sessionId", () => {
  it("sends sessionId in request body when a valid one is in localStorage", async () => {
    mockLocalStorage["ra-session-id"] = "session-abc123";

    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "hi" }] } }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );
    await act(async () => { await result.current.sendMessage("hello"); });

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.sessionId).toBe("session-abc123");
  });

  it("does not send sessionId when stored value fails validation", async () => {
    mockLocalStorage["ra-session-id"] = "../evil/path";

    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "hi" }] } }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );
    await act(async () => { await result.current.sendMessage("hello"); });

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.sessionId).toBeUndefined();
  });

  it("SSE error event clears sessionId from localStorage", async () => {
    mockLocalStorage["ra-session-id"] = "valid-session";

    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({ type: "error", message: "session not found" }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );
    await act(async () => { await result.current.sendMessage("hello"); });
    await waitFor(() => !result.current.streaming);

    expect(mockLocalStorage["ra-session-id"]).toBeUndefined();
  });

  it("stores new sessionId received in system event", async () => {
    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({ type: "system", session_id: "new-session-xyz" }),
        JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "hi" }] } }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );
    await act(async () => { await result.current.sendMessage("hello"); });
    await waitFor(() => !result.current.streaming);

    expect(mockLocalStorage["ra-session-id"]).toBe("new-session-xyz");
  });
});

describe("useResearchChat — signal message filtering", () => {
  it("signal messages are stored in history but excluded from visibleHistory", async () => {
    mockFetch.mockResolvedValueOnce(
      makeOkSseResponse([
        JSON.stringify({
          type: "assistant",
          message: { content: [{ type: "text", text: "[DOCUMENT_HABIT: cross-reference sessions]" }] },
        }),
      ])
    );

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );
    await act(async () => { await result.current.sendMessage("hello"); });
    await waitFor(() => !result.current.streaming);

    const signalInHistory = result.current.history.find(
      (m) => m.content === "[DOCUMENT_HABIT: cross-reference sessions]"
    );
    const signalInVisible = result.current.visibleHistory.find(
      (m) => m.content === "[DOCUMENT_HABIT: cross-reference sessions]"
    );

    expect(signalInHistory).toBeDefined();
    expect(signalInHistory?.signal).toBe(true);
    expect(signalInVisible).toBeUndefined();
  });
});

describe("useResearchChat — clearHistory", () => {
  it("clears history and sessionId from localStorage", async () => {
    mockLocalStorage["ra-history"] = JSON.stringify([{ role: "user", content: "hi", ts: 1 }]);
    mockLocalStorage["ra-session-id"] = "old-session";

    const { result } = renderHook(() =>
      useResearchChat({ profileContent: null, pathname: "/" })
    );

    act(() => result.current.clearHistory());

    expect(result.current.history).toHaveLength(0);
    expect(mockLocalStorage["ra-history"]).toBeUndefined();
    expect(mockLocalStorage["ra-session-id"]).toBeUndefined();
  });
});
