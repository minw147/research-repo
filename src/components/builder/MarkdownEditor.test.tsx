import React from "react";
import { render, screen, fireEvent, cleanup, createEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

// Mock CodeMirror because JSDOM doesn't support it well for testing
const mockDispatch = vi.fn();
const mockFocus = vi.fn();
const mockPosAtCoords = vi.fn().mockReturnValue(0);
let capturedExtensions: any[] = [];

vi.mock("@uiw/react-codemirror", () => {
  return {
    default: React.forwardRef(function MockCodeMirror(props: any, ref: any) {
      const { value, onChange, extensions } = props;
      capturedExtensions = extensions;

      const mockView = {
        posAtCoords: mockPosAtCoords,
        dispatch: mockDispatch,
        focus: mockFocus,
        state: {
          doc: {
            lineAt: vi.fn().mockReturnValue({ to: 10 }),
            toString: () => value, // Return current editor value so valueToPass logic stays correct
          },
        },
      };

      React.useImperativeHandle(ref, () => ({
        view: mockView,
      }));

      return (
        <textarea
          data-testid="mock-codemirror"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }),
  };
});

describe("MarkdownEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    capturedExtensions = [];
  });

  const mockProps = {
    content: "# Initial Content",
    onChange: vi.fn(),
    onSave: vi.fn(),
  };

  it("renders with initial content and accessibility attributes", () => {
    render(<MarkdownEditor {...mockProps} />);
    const container = screen.getByTestId("markdown-editor-container");
    expect(container).toHaveAttribute("role", "region");
    expect(container).toHaveAttribute("aria-label", "Markdown editor drop zone");

    const editor = screen.getByTestId("mock-codemirror");
    expect(editor).toHaveValue("# Initial Content");
  });

  it("debounces onChange calls by 1.5 seconds", () => {
    render(<MarkdownEditor {...mockProps} />);
    const editor = screen.getByTestId("mock-codemirror");

    fireEvent.change(editor, { target: { value: "# Changed Content" } });

    // Should not be called immediately
    expect(mockProps.onChange).not.toHaveBeenCalled();

    // Fast-forward 750ms — still within debounce window
    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(mockProps.onChange).not.toHaveBeenCalled();

    // Fast-forward another 800ms — past the 1.5s debounce
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(mockProps.onChange).toHaveBeenCalledWith("# Changed Content");
  });

  it("resets debounce timer on subsequent changes", () => {
    render(<MarkdownEditor {...mockProps} />);
    const editor = screen.getByTestId("mock-codemirror");

    fireEvent.change(editor, { target: { value: "first" } });

    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(mockProps.onChange).not.toHaveBeenCalled();

    fireEvent.change(editor, { target: { value: "second" } });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // 1s since second change, timer reset, not called yet
    expect(mockProps.onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(mockProps.onChange).toHaveBeenCalledWith("second");
    expect(mockProps.onChange).toHaveBeenCalledTimes(1);
  });

  it("syncs internal state when content prop changes", () => {
    const { rerender } = render(<MarkdownEditor {...mockProps} />);
    const editor = screen.getByTestId("mock-codemirror");
    expect(editor).toHaveValue("# Initial Content");

    rerender(<MarkdownEditor {...mockProps} content="# New External Content" />);
    expect(editor).toHaveValue("# New External Content");
  });

  it("handles drop events, snaps to line end, and adds newlines", () => {
    render(<MarkdownEditor {...mockProps} />);
    const container = screen.getByTestId("markdown-editor-container");

    const dropData = "> Quoted text";
    const dropEvent = createEvent.drop(container);

    Object.defineProperty(dropEvent, 'clientX', { value: 100 });
    Object.defineProperty(dropEvent, 'clientY', { value: 100 });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: (format: string) => (format === "text/plain" ? dropData : ""),
      },
    });

    fireEvent(container, dropEvent);

    expect(mockPosAtCoords).toHaveBeenCalledWith({ x: 100, y: 100 });
    // In our mock, posAtCoords returns 0, lineAt returns line with .to = 10
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      changes: {
        from: 10,
        to: 10,
        insert: "\n\n" + dropData
      }
    }));
    expect(mockFocus).toHaveBeenCalled();
  });

  it("handles dragOver and sets copy effect", () => {
    render(<MarkdownEditor {...mockProps} />);
    const container = screen.getByTestId("markdown-editor-container");

    const dragEvent = createEvent.dragOver(container);
    const dropEffectWrapper = { dropEffect: "none" };

    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: dropEffectWrapper,
    });

    fireEvent(container, dragEvent);

    expect(dropEffectWrapper.dropEffect).toBe("copy");
  });
});
