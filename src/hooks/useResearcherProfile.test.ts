import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useResearcherProfile, isBlank } from "./useResearcherProfile";

// ─── isBlank ──────────────────────────────────────────────────────────────────

describe("isBlank", () => {
  it("returns true when Name line has no content", () => {
    expect(isBlank("## Identity\n- Name: \n- Role: Researcher")).toBe(true);
  });

  it("returns true for bare Name: with no trailing space", () => {
    expect(isBlank("- Name:")).toBe(true);
  });

  it("returns false when Name has content", () => {
    expect(isBlank("- Name: Alice")).toBe(false);
  });

  it("returns false for content with no Name line at all", () => {
    expect(isBlank("# Researcher Profile\n## Identity")).toBe(false);
  });
});

// ─── useResearcherProfile ─────────────────────────────────────────────────────

const mockFetch = vi.fn();
const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => mockSessionStorage[k] ?? null,
    setItem: (k: string, v: string) => { mockSessionStorage[k] = v; },
    removeItem: (k: string) => { delete mockSessionStorage[k]; },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  for (const k of Object.keys(mockSessionStorage)) delete mockSessionStorage[k];
});

function makeOkResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("useResearcherProfile — load states", () => {
  it("200 + blank content → state becomes 'onboarding'", async () => {
    mockFetch.mockResolvedValueOnce(
      makeOkResponse({ content: "## Identity\n- Name: \n" })
    );
    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).not.toBe("loading"));
    expect(result.current.state).toBe("onboarding");
    expect(result.current.profile).toBeNull();
  });

  it("200 + populated content → state becomes 'ready'", async () => {
    mockFetch.mockResolvedValueOnce(
      makeOkResponse({ content: "## Identity\n- Name: Alice\n" })
    );
    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.profile?.content).toBe("## Identity\n- Name: Alice\n");
  });

  it("404 → state becomes 'onboarding'", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse({ content: null }, 404));
    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).not.toBe("loading"));
    expect(result.current.state).toBe("onboarding");
    expect(result.current.profile).toBeNull();
  });

  it("network error → state becomes 'error' (shows chat with notice, no onboarding loop)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failed"));
    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.error).toBeTruthy();
    // Must NOT be 'onboarding' — network error must not trigger onboarding loop
    expect(result.current.state).not.toBe("onboarding");
  });

  it("200 + null content → state becomes 'onboarding'", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse({ content: null }));
    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).not.toBe("loading"));
    expect(result.current.state).toBe("onboarding");
  });
});

describe("useResearcherProfile — sessionStorage cache", () => {
  it("uses cached profile without fetching", async () => {
    const cached = { content: "## Identity\n- Name: Bob\n" };
    mockSessionStorage["ra-profile"] = JSON.stringify(cached);

    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.profile?.content).toBe(cached.content);
  });

  it("invalidateCache() clears sessionStorage entry", async () => {
    const cached = { content: "## Identity\n- Name: Bob\n" };
    mockSessionStorage["ra-profile"] = JSON.stringify(cached);

    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("ready"));

    act(() => result.current.invalidateCache());
    expect(mockSessionStorage["ra-profile"]).toBeUndefined();
  });
});

describe("useResearcherProfile — save()", () => {
  it("POSTs content and returns true on success", async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce(makeOkResponse({ content: null }, 404));
    mockFetch.mockResolvedValueOnce(makeOkResponse({ ok: true }));

    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("onboarding"));

    let saved: boolean;
    await act(async () => {
      saved = await result.current.save("## Identity\n- Name: Alice\n");
    });

    expect(saved!).toBe(true);
    expect(result.current.state).toBe("ready");
    expect(result.current.profile?.content).toBe("## Identity\n- Name: Alice\n");
  });

  it("returns false and does not update state on POST failure", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse({ content: null }, 404));
    mockFetch.mockResolvedValueOnce(makeOkResponse({ error: "oops" }, 500));

    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("onboarding"));

    let saved: boolean;
    await act(async () => {
      saved = await result.current.save("## Identity\n- Name: Alice\n");
    });

    expect(saved!).toBe(false);
    expect(result.current.state).toBe("onboarding");
  });

  it("updates sessionStorage after successful save", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse({ content: null }, 404));
    mockFetch.mockResolvedValueOnce(makeOkResponse({ ok: true }));

    const { result } = renderHook(() => useResearcherProfile());
    await waitFor(() => expect(result.current.state).toBe("onboarding"));

    await act(async () => {
      await result.current.save("## Identity\n- Name: Alice\n");
    });

    expect(mockSessionStorage["ra-profile"]).toBeTruthy();
    const stored = JSON.parse(mockSessionStorage["ra-profile"]);
    expect(stored.content).toBe("## Identity\n- Name: Alice\n");
  });
});
