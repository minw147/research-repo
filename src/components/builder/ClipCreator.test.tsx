import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClipCreator } from "./ClipCreator";
import { TranscriptLine, Codebook } from "@/types";

describe("ClipCreator", () => {
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

    // Simulate selection in TranscriptViewer
    // We need to trigger handleMouseUp in TranscriptViewer with a valid selection
    
    // Mock window.getSelection()
    const mockSelection = {
      toString: () => "selected text",
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => ({
        startContainer: { parentElement: document.createElement("div") },
        endContainer: { parentElement: document.createElement("div") },
        getBoundingClientRect: () => ({ top: 100, left: 200, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    };
    vi.stubGlobal("getSelection", () => mockSelection);

    // Find the transcript container and trigger mouseup
    const container = screen.getByText("Line 1").parentElement?.parentElement?.parentElement;
    if (!container) throw new Error("Could not find container");
    
    // We also need to mock data-timestamp on parent elements since getAttr uses them
    const line1 = screen.getByText("Line 1").parentElement;
    line1?.setAttribute("data-timestamp", "10");
    line1?.setAttribute("data-duration", "2");

    mockSelection.getRangeAt = () => ({
      startContainer: { parentElement: line1 },
      endContainer: { parentElement: line1 },
      getBoundingClientRect: () => ({ top: 100, left: 200, width: 50, height: 20 }),
    });

    fireEvent.mouseUp(container);

    // Button should appear
    const clipButton = await screen.findByText("Clip");
    expect(clipButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(clipButton);

    // A QuoteCard should now appear with the text
    expect(screen.getByText("“selected text”")).toBeInTheDocument();
    
    // The floating button should be gone
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

    const line1 = screen.getByText("Line 1").parentElement;
    line1?.setAttribute("data-timestamp", "10");

    const mockSelection = {
      toString: () => "selected text",
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => ({
        parentElement: line1,
        startContainer: { parentElement: line1 },
        endContainer: { parentElement: line1 },
        getBoundingClientRect: () => ({ top: 100, left: 200, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    };
    vi.stubGlobal("getSelection", () => mockSelection);

    const container = screen.getByText("Line 1").parentElement?.parentElement?.parentElement;
    if (!container) throw new Error("Could not find container");

    fireEvent.mouseUp(container);

    const clipButton = await screen.findByText("Clip");
    expect(clipButton).toBeInTheDocument();

    // Click outside of the button
    fireEvent.click(container);

    // Button should be gone
    expect(screen.queryByText("Clip")).not.toBeInTheDocument();
  });
});
