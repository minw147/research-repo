import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAgentSettings } from "./useAgentSettings";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useAgentSettings", () => {
  it("calls GET /api/agent-settings on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ cli: "claude" }),
    });

    renderHook(() => useAgentSettings());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/agent-settings");
    });
  });

  it("applies returned JSON to settings state", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ cli: "custom", customTemplate: "opencode {prompt}" }),
    });

    const { result } = renderHook(() => useAgentSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings).toEqual({
      cli: "custom",
      customTemplate: "opencode {prompt}",
    });
  });

  it("sets loading=false even when network fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAgentSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings).toEqual({ cli: "claude" });
  });

  it("save() POSTs correct body and updates settings state", async () => {
    // Initial GET
    mockFetch.mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) });
    // POST response
    mockFetch.mockResolvedValueOnce({ json: async () => ({ success: true }) });

    const { result } = renderHook(() => useAgentSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save({ cli: "custom", customTemplate: "echo {prompt}" });
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/agent-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cli: "custom", customTemplate: "echo {prompt}" }),
    });
    expect(result.current.settings).toEqual({
      cli: "custom",
      customTemplate: "echo {prompt}",
    });
  });

  it("save() network errors do not throw out of the hook", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) });
    mockFetch.mockRejectedValueOnce(new Error("POST failed"));

    const { result } = renderHook(() => useAgentSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.save({ cli: "claude" });
      })
    ).resolves.not.toThrow();
  });
});
