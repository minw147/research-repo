import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { QuoteEditModal } from "./QuoteEditModal";
import { Codebook, ParsedQuote } from "@/types";

const mockCodebook: Codebook = {
  tags: [
    { id: "positive", label: "Positive", color: "#00ff00", category: "sentiment" },
    { id: "negative", label: "Negative", color: "#ff0000", category: "sentiment" },
    { id: "usability", label: "Usability", color: "#0000ff", category: "ux" },
  ],
  categories: ["sentiment", "ux"],
};

const mockQuote: ParsedQuote = {
  text: "This is a great feature!",
  timestampDisplay: "01:23",
  startSeconds: 83,
  durationSeconds: 10,
  sessionIndex: 1,
  tags: ["positive"],
  rawLine: '- **"This is a great feature!"** @ 01:23 (83s) | duration: 10s | session: 1 | tags: positive',
};

const mockOnSave = vi.fn();
const mockOnClose = vi.fn();

describe("QuoteEditModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders correctly with quote data", () => {
    render(
      <QuoteEditModal
        quote={mockQuote}
        codebook={mockCodebook}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/edit quote/i)).toBeDefined();
    expect(screen.getByText(/this is a great feature!/i)).toBeDefined();
    expect(screen.getByText(/positive/i)).toBeDefined();
    expect(screen.getByDisplayValue("10")).toBeDefined();
  });

  it("can add and remove tags", () => {
    render(
      <QuoteEditModal
        quote={mockQuote}
        codebook={mockCodebook}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Initial tag
    expect(screen.getByText(/positive/i)).toBeDefined();

    // Add another tag
    const input = screen.getByPlaceholderText(/add a tag/i);
    fireEvent.change(input, { target: { value: "Usability" } });
    
    // Find suggestion and click
    const suggestion = screen.getByText(/usability/i);
    fireEvent.click(suggestion);

    expect(screen.getByText(/usability/i)).toBeDefined();

    // Remove first tag
    const removeButtons = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-x"));
    // The first X is the modal close button, the others are tag remove buttons
    // Actually our tag remove button has className "ml-1 text-slate-400 hover:text-slate-600"
    // Let's find it more specifically if needed, but let's try the first tag's remove button.
    fireEvent.click(removeButtons[1]); // Index 0 is modal close, 1 is first tag

    expect(screen.queryByText("Positive")).toBeNull();
  });

  it("can change duration", () => {
    render(
      <QuoteEditModal
        quote={mockQuote}
        codebook={mockCodebook}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByDisplayValue("10");
    fireEvent.change(input, { target: { value: "15" } });

    fireEvent.click(screen.getByText(/save changes/i));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 15,
      })
    );
  });

  it("can toggle hidden state", () => {
    render(
      <QuoteEditModal
        quote={mockQuote}
        codebook={mockCodebook}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const toggleButton = screen.getByText(/visible/i);
    fireEvent.click(toggleButton);

    expect(screen.getByRole("button", { name: /hidden/i })).toBeDefined();

    fireEvent.click(screen.getByText(/save changes/i));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        hidden: true,
      })
    );
  });

  it("calls onClose when Cancel is clicked", () => {
    render(
      <QuoteEditModal
        quote={mockQuote}
        codebook={mockCodebook}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText(/cancel/i));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
