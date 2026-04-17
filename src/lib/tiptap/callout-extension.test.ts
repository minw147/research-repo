import { describe, it, expect, vi } from "vitest";
import MarkdownIt from "markdown-it";
import { CalloutExtension } from "./callout-extension";

function getMarkdownSpec() {
  const addStorage = CalloutExtension.config.addStorage as (this: unknown) => {
    markdown: {
      serialize: (state: unknown, node: unknown) => void;
      parse: { setup: (md: MarkdownIt) => void };
    };
  };
  return addStorage.call({});
}

describe("CalloutExtension", () => {
  it("is a block node that contains block-level children", () => {
    expect(CalloutExtension.name).toBe("callout");
    expect(CalloutExtension.config.group).toBe("block");
    expect(CalloutExtension.config.content).toBe("block+");
    expect(CalloutExtension.config.defining).toBe(true);
  });

  describe("markdown serialize", () => {
    it("writes :::type ... ::: fences around the rendered content", () => {
      const { markdown } = getMarkdownSpec();
      const writeSpy = vi.fn();
      const ensureNewLineSpy = vi.fn();
      const closeSpy = vi.fn();
      const renderContentSpy = vi.fn();

      const state = {
        write: writeSpy,
        ensureNewLine: ensureNewLineSpy,
        closeBlock: closeSpy,
        renderContent: renderContentSpy,
      };
      const node = { attrs: { calloutType: "warning" } };

      markdown.serialize(state, node);

      // Three write calls: open fence, (renderContent), close fence
      expect(writeSpy.mock.calls[0][0]).toBe(":::warning\n");
      expect(renderContentSpy).toHaveBeenCalledWith(node);
      expect(ensureNewLineSpy).toHaveBeenCalled();
      expect(writeSpy.mock.calls[1][0]).toBe(":::");
      expect(closeSpy).toHaveBeenCalledWith(node);
    });

    it("defaults to :::info when calloutType is missing", () => {
      const { markdown } = getMarkdownSpec();
      const writeSpy = vi.fn();
      const state = {
        write: writeSpy,
        ensureNewLine: vi.fn(),
        closeBlock: vi.fn(),
        renderContent: vi.fn(),
      };
      markdown.serialize(state, { attrs: {} as { calloutType?: string } });
      expect(writeSpy.mock.calls[0][0]).toBe(":::info\n");
    });
  });

  describe("markdown-it parse.setup", () => {
    function renderWithSetup(input: string): string {
      const md = new MarkdownIt({ html: true });
      const { markdown } = getMarkdownSpec();
      markdown.parse.setup(md);
      return md.render(input);
    }

    it("renders :::info ... ::: as a data-callout-type div wrapping the inner markdown", () => {
      const out = renderWithSetup(":::info\nSome insight.\n:::");
      expect(out).toContain('<div data-callout-type="info">');
      expect(out).toContain("Some insight.");
      expect(out.trim().endsWith("</div>")).toBe(true);
    });

    it("preserves block structure (paragraph tags) inside the callout", () => {
      const out = renderWithSetup(":::tip\nFirst paragraph.\n\nSecond paragraph.\n:::");
      expect(out).toContain('<div data-callout-type="tip">');
      expect(out).toMatch(/<p>First paragraph\.<\/p>/);
      expect(out).toMatch(/<p>Second paragraph\.<\/p>/);
    });

    it("supports different callout types (warning, insight)", () => {
      const warn = renderWithSetup(":::warning\nHeads up!\n:::");
      expect(warn).toContain('<div data-callout-type="warning">');

      const insight = renderWithSetup(":::insight\nAha moment.\n:::");
      expect(insight).toContain('<div data-callout-type="insight">');
    });

    it("does not match an unclosed directive", () => {
      const out = renderWithSetup(":::info\nNo closing fence here");
      expect(out).not.toContain('<div data-callout-type="info">');
    });

    it("does not match a line that only looks similar (no type)", () => {
      const out = renderWithSetup(":::\nBody.\n:::");
      expect(out).not.toContain("<div data-callout-type");
    });

    it("leaves unrelated markdown untouched", () => {
      const out = renderWithSetup("# Heading\n\nA paragraph.");
      expect(out).toMatch(/<h1>Heading<\/h1>/);
      expect(out).toMatch(/<p>A paragraph\.<\/p>/);
    });
  });

  describe("attributes", () => {
    it("parses data-callout-type attribute, defaulting to info", () => {
      const addAttrs = CalloutExtension.config.addAttributes as (this: unknown) => Record<string, {
        parseHTML?: (el: { getAttribute: (n: string) => string | null }) => unknown;
        renderHTML?: (attrs: { calloutType: string }) => Record<string, string>;
      }>;
      const attrs = addAttrs.call({});

      const fromTip = { getAttribute: (n: string) => (n === "data-callout-type" ? "tip" : null) };
      expect(attrs.calloutType.parseHTML?.(fromTip)).toBe("tip");

      const missing = { getAttribute: () => null };
      expect(attrs.calloutType.parseHTML?.(missing)).toBe("info");

      expect(attrs.calloutType.renderHTML?.({ calloutType: "warning" })).toEqual({
        "data-callout-type": "warning",
      });
    });
  });
});
