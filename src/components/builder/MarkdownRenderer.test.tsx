import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Codebook } from "@/types";

// Mock remark-gfm because ESM can be tricky in Vitest
vi.mock("remark-gfm", () => ({
  default: () => {},
}));

const mockCodebook: Codebook = {
  tags: [
    { id: "positive", label: "Positive", color: "#00ff00", category: "sentiment" },
    { id: "ux", label: "UX", color: "#0000ff", category: "domain" },
  ],
  categories: ["sentiment", "domain"],
};

const mockOnQuoteClick = vi.fn();
const mockOnQuoteDoubleClick = vi.fn();

describe("MarkdownRenderer", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders basic markdown correctly", () => {
    const content = "# Title\n\nThis is a paragraph.";
    render(
      <MarkdownRenderer
        content={content}
        codebook={mockCodebook}
        onQuoteClick={mockOnQuoteClick}
        onQuoteDoubleClick={mockOnQuoteDoubleClick}
      />
    );

    expect(screen.getByRole("heading", { name: /title/i })).toBeDefined();
    expect(screen.getByText(/this is a paragraph/i)).toBeDefined();
  });

  it("renders a QuoteCard when it detects a quote", () => {
    const quoteLine = '- **"I love this!"** @ 01:23 (83s) | duration: 5s | session: 1 | tags: positive, ux';
    const content = `# Findings\n\n${quoteLine}\n\nMore text.`;

    render(
      <MarkdownRenderer
        content={content}
        codebook={mockCodebook}
        onQuoteClick={mockOnQuoteClick}
        onQuoteDoubleClick={mockOnQuoteDoubleClick}
      />
    );

    // Should render the QuoteCard
    const quoteCard = screen.getByTestId("quote-card");
    expect(quoteCard).toBeDefined();
    expect(screen.getByText(/I love this!/i)).toBeDefined();
    
    // Check that regular content is also rendered
    expect(screen.getByRole("heading", { name: /findings/i })).toBeDefined();
    expect(screen.getByText(/more text/i)).toBeDefined();
  });

  it("handles clicks on QuoteCard", () => {
    const quoteLine = '- **"Click me"** @ 00:00 (0s) | duration: 10s | session: 1';
    render(
      <MarkdownRenderer
        content={quoteLine}
        codebook={mockCodebook}
        onQuoteClick={mockOnQuoteClick}
        onQuoteDoubleClick={mockOnQuoteDoubleClick}
      />
    );

    const quoteCard = screen.getByTestId("quote-card");
    fireEvent.click(quoteCard);

    expect(mockOnQuoteClick).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Click me",
        startSeconds: 0,
        durationSeconds: 10,
        sessionIndex: 1,
      })
    );
  });

  it("handles double clicks on QuoteCard", () => {
    const quoteLine = '- **"Double click me"** @ 00:00 (0s) | duration: 10s | session: 1';
    render(
      <MarkdownRenderer
        content={quoteLine}
        codebook={mockCodebook}
        onQuoteClick={mockOnQuoteClick}
        onQuoteDoubleClick={mockOnQuoteDoubleClick}
      />
    );

    const quoteCard = screen.getByTestId("quote-card");
    fireEvent.doubleClick(quoteCard);

    expect(mockOnQuoteDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Double click me",
      })
    );
  });

  it("renders normal list items normally", () => {
    const content = "- Normal item 1\n- Normal item 2";
    render(
      <MarkdownRenderer
        content={content}
        codebook={mockCodebook}
        onQuoteClick={mockOnQuoteClick}
        onQuoteDoubleClick={mockOnQuoteDoubleClick}
      />
    );

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(screen.getByText(/normal item 1/i)).toBeDefined();
    expect(screen.queryByTestId("quote-card")).toBeNull();
  });
});
