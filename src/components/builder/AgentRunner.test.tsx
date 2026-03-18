import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { AgentRunner } from "./AgentRunner";

afterEach(cleanup);

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeSSEStream(events: object[]): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      for (const e of events)
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      ctrl.close();
    },
  });
  return new Response(stream, { status: 200 });
}

const defaultProps = {
  prompt: "Analyze findings",
  onRefreshFile: vi.fn(),
};

describe("AgentRunner", () => {
  it("1. renders 'Run in Agent' button in idle state", () => {
    // Need to mock the settings fetch
    mockFetch.mockResolvedValue({ json: async () => ({ cli: "claude" }) });
    render(<AgentRunner {...defaultProps} />);
    expect(screen.getByRole("button", { name: /run in agent/i })).toBeDefined();
  });

  it("2. clicking 'Run in Agent' POSTs to /api/agent/run with the prompt", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) }) // settings
      .mockResolvedValueOnce(makeSSEStream([{ type: "done" }])); // run

    render(<AgentRunner {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() => {
      const runCall = mockFetch.mock.calls.find((c) => c[0] === "/api/agent/run");
      expect(runCall).toBeDefined();
      const body = JSON.parse(runCall![1].body);
      expect(body.prompt).toBe("Analyze findings");
    });
  });

  it("3. text events appear as lines in the log panel", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) })
      .mockResolvedValueOnce(
        makeSSEStream([
          { type: "text", content: "First line" },
          { type: "text", content: "Second line" },
          { type: "done" },
        ])
      );

    render(<AgentRunner {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() => expect(screen.getByText("First line")).toBeDefined());
    expect(screen.getByText("Second line")).toBeDefined();
  });

  it("4. done + session event → follow-up input appears", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) })
      .mockResolvedValueOnce(
        makeSSEStream([
          { type: "session", id: "sess-abc" },
          { type: "done" },
        ])
      );

    render(<AgentRunner {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/follow-up/i)).toBeDefined()
    );
  });

  it("5. error event → error state, no follow-up input", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) })
      .mockResolvedValueOnce(
        makeSSEStream([{ type: "error", message: "Something went wrong" }])
      );

    render(<AgentRunner {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeDefined()
    );
    expect(screen.queryByPlaceholderText(/follow-up/i)).toBeNull();
  });

  it("6. follow-up Send POSTs with follow-up text and session_id", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) }) // settings
      .mockResolvedValueOnce(
        makeSSEStream([{ type: "session", id: "sess-xyz" }, { type: "done" }])
      ) // initial run
      .mockResolvedValueOnce(makeSSEStream([{ type: "done" }])); // follow-up run

    render(<AgentRunner {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/follow-up/i)).toBeDefined()
    );

    const input = screen.getByPlaceholderText(/follow-up/i);
    fireEvent.change(input, { target: { value: "Tell me more" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      const runCalls = mockFetch.mock.calls.filter(
        (c) => c[0] === "/api/agent/run"
      );
      expect(runCalls).toHaveLength(2);
      const body = JSON.parse(runCalls[1][1].body);
      expect(body.prompt).toBe("Tell me more");
      expect(body.sessionId).toBe("sess-xyz");
    });
  });

  it("7. Enter key in follow-up input triggers send", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) })
      .mockResolvedValueOnce(
        makeSSEStream([{ type: "session", id: "sess-enter" }, { type: "done" }])
      )
      .mockResolvedValueOnce(makeSSEStream([{ type: "done" }]));

    render(<AgentRunner {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /run in agent/i }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/follow-up/i)).toBeDefined()
    );

    const input = screen.getByPlaceholderText(/follow-up/i);
    fireEvent.change(input, { target: { value: "Another question" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      const runCalls = mockFetch.mock.calls.filter(
        (c) => c[0] === "/api/agent/run"
      );
      expect(runCalls).toHaveLength(2);
    });
  });

  it("8. gear icon toggles settings panel visibility", async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ cli: "claude" }) });

    render(<AgentRunner {...defaultProps} />);

    // Settings panel not visible initially
    expect(screen.queryByText("CLI tool")).toBeNull();

    const gearBtn = screen.getByTitle(/cli settings/i);
    fireEvent.click(gearBtn);

    await waitFor(() => expect(screen.getByText("CLI tool")).toBeDefined());

    // Click again to hide
    fireEvent.click(gearBtn);
    await waitFor(() => expect(screen.queryByText("CLI tool")).toBeNull());
  });

  it("9. switching CLI to 'custom' shows template input", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ cli: "claude" }) }) // initial settings load
      .mockResolvedValue({ json: async () => ({ success: true }) }); // save calls

    render(<AgentRunner {...defaultProps} />);

    fireEvent.click(screen.getByTitle(/cli settings/i));

    await waitFor(() => expect(screen.getByText("CLI tool")).toBeDefined());

    // Template input should not be shown yet
    expect(screen.queryByPlaceholderText(/opencode run/i)).toBeNull();

    // Change select to "custom"
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "custom" } });

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/opencode run/i)).toBeDefined()
    );
  });
});
