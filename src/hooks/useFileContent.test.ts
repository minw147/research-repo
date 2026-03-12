import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFileContent } from "./useFileContent";

describe("useFileContent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches content on mount", async () => {
    const mockContent = { content: "# Test Findings" };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContent),
    });

    const { result } = renderHook(() => useFileContent("test-project", "findings.md"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.content).toBe("# Test Findings");
    expect(fetch).toHaveBeenCalledWith(
      "/api/files?slug=test-project&file=findings.md",
      { cache: "no-store" }
    );
  });

  it("saves content when saveContent is called", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: "# Initial Content" }),
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useFileContent("test-project", "findings.md"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveContent("# New Content");
    });

    expect(result.current.content).toBe("# New Content");
    expect(fetch).toHaveBeenCalledWith("/api/files", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ slug: "test-project", file: "findings.md", content: "# New Content" }),
    }));
  });

  it("sets error when fetch fails", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useFileContent("test-project", "findings.md"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch findings.md");
    expect(result.current.content).toBeNull();
  });
});
