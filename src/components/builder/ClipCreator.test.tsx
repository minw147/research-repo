import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ClipCreator } from "./ClipCreator";
import { TranscriptLine, Codebook } from "@/types";

describe("ClipCreator", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const mockLines: TranscriptLine[] = [
    { sec: 10, text: "Line 1" },
    { sec: 20, text: "Line 2" },
  ];
  const mockQuotes = [];
  const mockCodebook: Codebook = { tags: [], categories: [] };
  const mockHandlers = {
    onTimestampClick: vi.fn(),
    onQuoteClick: vi.fn(),
    onQuoteDoubleClick: vi.fn(),
  };

  it("shows the floating +Clip button when text is selected", async () => {
    render(
      <ClipCreator
        lines={mockLines}
        quotes={mockQuotes}
        codebook={mockCodebook}
        activeSecond={0}
        sessionIndex={1}
        {...mockHandlers}
      />
    );

    const textNode = screen.getByText("Line 1").firstChild;
    if (!textNode) throw new Error("DOM structure missing");

    const mockSelection = {
      toString: () => "selected text",
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => ({
        startContainer: textNode,
        endContainer: textNode,
        commonAncestorContainer: textNode,
        getBoundingClientRect: () => ({ top: 100, left: 200, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    };
    vi.stubGlobal("getSelection", () => mockSelection);

    const container = screen.getByText("Line 1").closest(".overflow-y-auto");
    if (!container) throw new Error("Could not find container");

    fireEvent.mouseUp(container);

    const clipButton = await screen.findByRole("button", { name: /Create Clip/i });
    expect(clipButton).toBeInTheDocument();
    expect(clipButton.className).toContain("fixed");

    fireEvent.click(clipButton);

    expect(screen.getByText("“selected text”")).toBeInTheDocument();
    expect(screen.queryByText("Clip")).not.toBeInTheDocument();
  });

  it("clears selection when clicking away", async () => {
    render(
      <ClipCreator
        lines={mockLines}
        quotes={mockQuotes}
        codebook={mockCodebook}
        activeSecond={0}
        sessionIndex={1}
        {...mockHandlers}
      />
    );

    const textNode = screen.getByText("Line 1").firstChild;
    if (!textNode) throw new Error("DOM structure missing");

    const mockSelection = {
      toString: () => "selected text",
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => ({
        startContainer: textNode,
        endContainer: textNode,
        commonAncestorContainer: textNode,
        getBoundingClientRect: () => ({ top: 100, left: 200, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    };
    vi.stubGlobal("getSelection", () => mockSelection);

    const container = screen.getByText("Line 1").closest(".overflow-y-auto");
    if (!container) throw new Error("Could not find container");

    fireEvent.mouseUp(container);

    const clipButton = await screen.findByRole("button", { name: /Create Clip/i });
    expect(clipButton).toBeInTheDocument();

    // Click the outer ClipCreator wrapper (outside [data-transcript-root]) to clear selection
    const outerWrapper = container.closest(".relative");
    if (!outerWrapper) throw new Error("Could not find outer wrapper");
    fireEvent.click(outerWrapper);

    expect(screen.queryByText("Clip")).not.toBeInTheDocument();
  });
});
