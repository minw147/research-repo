import { describe, it, expect, vi } from "vitest";
import { QuoteExtension } from "./quote-extension";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";

// Invoke addStorage directly on the extension's config.
// This mirrors what tiptap does internally when the node is registered.
function getMarkdownSpec() {
  const addStorage = QuoteExtension.config.addStorage as (this: unknown) => {
    markdown: {
      serialize: (state: unknown, node: unknown) => void;
      parse: Record<string, unknown>;
    };
  };
  return addStorage.call({});
}

describe("QuoteExtension", () => {
  it("is a block-level atom node with the expected name", () => {
    expect(QuoteExtension.name).toBe("quote");
    expect(QuoteExtension.config.group).toBe("block");
    expect(QuoteExtension.config.atom).toBe(true);
    expect(QuoteExtension.config.draggable).toBe(true);
  });

  describe("markdown serialize", () => {
    it("produces the canonical quote markdown line and closes the block", () => {
      const { markdown } = getMarkdownSpec();
      const writeSpy = vi.fn();
      const closeSpy = vi.fn();
      const state = { write: writeSpy, ensureNewLine: vi.fn(), closeBlock: closeSpy };

      const attrs = {
        text: "At a really fundamental level we think about this",
        startSeconds: 128,
        durationSeconds: 16,
        sessionIndex: 1,
        tags: ["mental-model"],
        hidden: false,
      };

      markdown.serialize(state, { attrs });

      expect(writeSpy).toHaveBeenCalledTimes(1);
      const written = writeSpy.mock.calls[0][0] as string;
      expect(written).toBe(formatQuoteAsMarkdown(
        attrs.text, attrs.startSeconds, attrs.durationSeconds, attrs.sessionIndex, attrs.tags, attrs.hidden
      ));
      expect(written).toContain('- **"At a really fundamental level');
      expect(written).toContain("@ 02:08 (128s)");
      expect(written).toContain("duration: 16s");
      expect(written).toContain("session: 1");
      expect(written).toContain("tags: mental-model");
      expect(closeSpy).toHaveBeenCalledWith({ attrs });
    });

    it("serializes with hidden flag when hidden is true", () => {
      const { markdown } = getMarkdownSpec();
      const writeSpy = vi.fn();
      const state = { write: writeSpy, ensureNewLine: vi.fn(), closeBlock: vi.fn() };

      markdown.serialize(state, {
        attrs: {
          text: "Hidden quote",
          startSeconds: 30,
          durationSeconds: 20,
          sessionIndex: 2,
          tags: [],
          hidden: true,
        },
      });

      const written = writeSpy.mock.calls[0][0] as string;
      expect(written).toContain("| hidden: true");
    });

    it("tolerates a missing tags array", () => {
      const { markdown } = getMarkdownSpec();
      const writeSpy = vi.fn();
      const state = { write: writeSpy, ensureNewLine: vi.fn(), closeBlock: vi.fn() };

      markdown.serialize(state, {
        attrs: {
          text: "No tags",
          startSeconds: 0,
          durationSeconds: 20,
          sessionIndex: 1,
          // Intentionally omit tags to simulate a partially-initialised node
          tags: undefined as unknown as string[],
          hidden: false,
        },
      });

      const written = writeSpy.mock.calls[0][0] as string;
      expect(written).toContain("tags: ");
      expect(writeSpy).toHaveBeenCalledOnce();
    });
  });

  describe("attributes parse/renderHTML", () => {
    it("round-trips a quote attribute set via tags renderHTML", () => {
      const addAttrs = QuoteExtension.config.addAttributes as (this: unknown) => Record<string, {
        renderHTML?: (attrs: { tags: string[] }) => Record<string, string>;
      }>;
      const attrs = addAttrs.call({});
      const rendered = attrs.tags.renderHTML?.({ tags: ["tag-a", "tag-b"] });
      expect(rendered).toEqual({ "data-tags": "tag-a,tag-b" });

      const renderedEmpty = attrs.tags.renderHTML?.({ tags: [] as string[] });
      expect(renderedEmpty).toEqual({ "data-tags": "" });
    });

    it("parses data-tags attribute into a trimmed tag array", () => {
      const addAttrs = QuoteExtension.config.addAttributes as (this: unknown) => Record<string, {
        parseHTML?: (el: { getAttribute: (n: string) => string | null }) => unknown;
      }>;
      const attrs = addAttrs.call({});
      const fakeEl = {
        getAttribute(name: string) {
          if (name === "data-tags") return " tag-a , tag-b ,  ";
          return null;
        },
      };
      expect(attrs.tags.parseHTML?.(fakeEl)).toEqual(["tag-a", "tag-b"]);
    });

    it("parses data-text into the quote body (fixes empty **\"\"** round-trip)", () => {
      const addAttrs = QuoteExtension.config.addAttributes as (this: unknown) => Record<string, {
        parseHTML?: (el: { getAttribute: (n: string) => string | null }) => unknown;
        renderHTML?: (attrs: { text: string }) => Record<string, string>;
      }>;
      const attrs = addAttrs.call({});
      const el = {
        getAttribute(name: string) {
          if (name === "data-text") return "She said &quot;hello&quot; to the team";
          return null;
        },
      };
      expect(attrs.text.parseHTML?.(el)).toBe('She said "hello" to the team');

      const rendered = attrs.text.renderHTML?.({ text: 'Say "hi" & bye' });
      expect(rendered).toEqual({
        "data-text": "Say &quot;hi&quot; &amp; bye",
      });
    });

    it("parses numeric attributes with sensible defaults when missing", () => {
      const addAttrs = QuoteExtension.config.addAttributes as (this: unknown) => Record<string, {
        parseHTML?: (el: { getAttribute: (n: string) => string | null }) => unknown;
      }>;
      const attrs = addAttrs.call({});
      const emptyEl = { getAttribute: () => null };
      // Missing attributes fall back to 0 via the `?? "0"` default in parseHTML
      expect(attrs.startSeconds.parseHTML?.(emptyEl)).toBe(0);
      expect(attrs.durationSeconds.parseHTML?.(emptyEl)).toBe(20);
      expect(attrs.sessionIndex.parseHTML?.(emptyEl)).toBe(1);
      expect(attrs.hidden.parseHTML?.(emptyEl)).toBe(false);

      const validEl = {
        getAttribute(name: string) {
          if (name === "data-start-seconds") return "42";
          if (name === "data-duration-seconds") return "18";
          if (name === "data-session-index") return "3";
          if (name === "data-hidden") return "true";
          return null;
        },
      };
      expect(attrs.startSeconds.parseHTML?.(validEl)).toBe(42);
      expect(attrs.durationSeconds.parseHTML?.(validEl)).toBe(18);
      expect(attrs.sessionIndex.parseHTML?.(validEl)).toBe(3);
      expect(attrs.hidden.parseHTML?.(validEl)).toBe(true);
    });
  });

  describe("parseHTML rule", () => {
    it("matches the div[data-type=quote] selector used by preprocessMarkdownForEditor", () => {
      const parseHTML = QuoteExtension.config.parseHTML as (this: unknown) => Array<{ tag: string }>;
      const rules = parseHTML.call({});
      expect(rules).toEqual([{ tag: 'div[data-type="quote"]' }]);
    });
  });
});
