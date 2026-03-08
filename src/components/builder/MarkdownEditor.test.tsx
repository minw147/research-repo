import React from "react";
import { render, screen, fireEvent, cleanup, createEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

// Mock CodeMirror because JSDOM doesn't support it well for testing
const mockDispatch = vi.fn();
const mockFocus = vi.fn();
const mockPosAtCoords = vi.fn().mockReturnValue(0);
let capturedExtensions: any[] = [];

vi.mock("@uiw/react-codemirror", () => {
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { value, onChange, extensions } = props;
      capturedExtensions = extensions;
      
      const mockView = {
        posAtCoords: mockPosAtCoords,
        dispatch: mockDispatch,
        focus: mockFocus,
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
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    capturedExtensions = [];
  });

  const mockProps = {
    content: "# Initial Content",
    onChange: vi.fn(),
    onSave: vi.fn(),
  };

  it("renders with initial content", () => {
    render(<MarkdownEditor {...mockProps} />);
    const editor = screen.getByTestId("mock-codemirror");
    expect(editor).toHaveValue("# Initial Content");
  });

  it("calls onChange when content changes", () => {
    render(<MarkdownEditor {...mockProps} />);
    const editor = screen.getByTestId("mock-codemirror");
    fireEvent.change(editor, { target: { value: "# Changed Content" } });
    expect(mockProps.onChange).toHaveBeenCalledWith("# Changed Content");
  });

  it("handles drop events and inserts markdown", () => {
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
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      changes: { from: 0, to: 0, insert: dropData }
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

  it("passes extensions including markdown and keymap", () => {
    render(<MarkdownEditor {...mockProps} />);
    // Check if we have at least 2 extensions (markdown and keymap)
    expect(capturedExtensions.length).toBeGreaterThanOrEqual(2);
  });
});
