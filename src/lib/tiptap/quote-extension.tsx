"use client";

import { Node, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";
import { QuoteCard } from "@/components/builder/QuoteCard";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";
import { escapeQuoteAttr, unescapeQuoteAttr } from "@/lib/tiptap/markdown-bridge";
import type { ParsedQuote, Codebook } from "@/types";
import type { NodeViewProps } from "@tiptap/react";

interface QuoteNodeViewProps extends NodeViewProps {
  codebook: Codebook;
  onQuoteClick: (q: ParsedQuote) => void;
  onQuoteDoubleClick: (q: ParsedQuote) => void;
  onQuoteDelete: (q: ParsedQuote) => void;
}

// Inner component rendered inside the editor for each quote node.
function QuoteNodeView({ node, deleteNode, codebook, onQuoteClick, onQuoteDoubleClick, onQuoteDelete }: QuoteNodeViewProps) {
  const { text, startSeconds, durationSeconds, sessionIndex, tags, hidden } = node.attrs as {
    text: string;
    startSeconds: number;
    durationSeconds: number;
    sessionIndex: number;
    tags: string[];
    hidden: boolean;
  };

  const quote: ParsedQuote = {
    text,
    timestampDisplay: (() => {
      const m = Math.floor(startSeconds / 60).toString().padStart(2, "0");
      const s = (startSeconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    })(),
    startSeconds,
    durationSeconds,
    sessionIndex,
    tags,
    hidden,
    rawLine: formatQuoteAsMarkdown(text, startSeconds, durationSeconds, sessionIndex, tags, hidden),
  };

  return (
    <NodeViewWrapper contentEditable={false} data-drag-handle>
      <QuoteCard
        quote={quote}
        codebook={codebook}
        onClick={onQuoteClick}
        onDoubleClick={onQuoteDoubleClick}
        onDelete={() => {
          onQuoteDelete(quote);
          deleteNode();
        }}
      />
    </NodeViewWrapper>
  );
}

export interface QuoteExtensionOptions {
  codebook: Codebook;
  onQuoteClick: (q: ParsedQuote) => void;
  onQuoteDoubleClick: (q: ParsedQuote) => void;
  onQuoteDelete: (q: ParsedQuote) => void;
}

export const QuoteExtension = Node.create<QuoteExtensionOptions>({
  name: "quote",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      codebook: { tags: [], categories: [] },
      onQuoteClick: () => {},
      onQuoteDoubleClick: () => {},
      onQuoteDelete: () => {},
    };
  },

  addAttributes() {
    return {
      text: {
        default: "",
        // Required: preprocessMarkdownForEditor emits data-text="…"; without parseHTML, text stayed "" and serialized as **""**.
        parseHTML: (el) => {
          const raw = el.getAttribute("data-text");
          if (raw == null || raw === "") return "";
          return unescapeQuoteAttr(raw);
        },
        renderHTML: (attrs: { text: string }) => ({
          "data-text": escapeQuoteAttr(attrs.text ?? ""),
        }),
      },
      startSeconds: { default: 0, parseHTML: (el) => parseInt(el.getAttribute("data-start-seconds") ?? "0", 10) },
      durationSeconds: { default: 20, parseHTML: (el) => parseInt(el.getAttribute("data-duration-seconds") ?? "20", 10) },
      sessionIndex: { default: 1, parseHTML: (el) => parseInt(el.getAttribute("data-session-index") ?? "1", 10) },
      tags: {
        default: [],
        parseHTML: (el) => {
          const raw = el.getAttribute("data-tags") ?? "";
          return raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : [];
        },
        renderHTML: (attrs: { tags: string[] }) => ({ "data-tags": (attrs.tags ?? []).join(",") }),
      },
      hidden: { default: false, parseHTML: (el) => el.getAttribute("data-hidden") === "true" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="quote"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": "quote", ...HTMLAttributes }];
  },

  addNodeView() {
    const opts = this.options;
    return ReactNodeViewRenderer((props: NodeViewProps) =>
      React.createElement(QuoteNodeView, {
        ...props,
        codebook: opts.codebook,
        onQuoteClick: opts.onQuoteClick,
        onQuoteDoubleClick: opts.onQuoteDoubleClick,
        onQuoteDelete: opts.onQuoteDelete,
      } as QuoteNodeViewProps)
    );
  },

  // tiptap-markdown serialization spec
  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (s: string) => void; ensureNewLine: () => void; closeBlock: (n: unknown) => void },
          node: { attrs: { text: string; startSeconds: number; durationSeconds: number; sessionIndex: number; tags: string[]; hidden: boolean } }
        ) {
          const { text, startSeconds, durationSeconds, sessionIndex, tags, hidden } = node.attrs;
          state.write(formatQuoteAsMarkdown(text, startSeconds, durationSeconds, sessionIndex, tags ?? [], hidden));
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});
