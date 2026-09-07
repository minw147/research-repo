import type { NodeSpec, Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import type MarkdownIt from "markdown-it";
import type { ParseSpec, MarkdownSerializerState } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";
import { parseQuote, formatQuoteAsMarkdown } from "@/lib/quote-parser";
import type { ParsedQuote, Codebook } from "@/types";
import { QuoteNodeView } from "./quote-node-view";

export interface QuoteAttrs {
  text: string;
  startSeconds: number;
  durationSeconds: number;
  sessionIndex: number;
  tags: string[];
  hidden: boolean;
}

export function quoteFromAttrs(attrs: QuoteAttrs): ParsedQuote {
  const m = Math.floor(attrs.startSeconds / 60).toString().padStart(2, "0");
  const s = (attrs.startSeconds % 60).toString().padStart(2, "0");
  return {
    text: attrs.text,
    timestampDisplay: `${m}:${s}`,
    startSeconds: attrs.startSeconds,
    durationSeconds: attrs.durationSeconds,
    sessionIndex: attrs.sessionIndex,
    tags: attrs.tags,
    hidden: attrs.hidden,
    rawLine: formatQuoteAsMarkdown(
      attrs.text,
      attrs.startSeconds,
      attrs.durationSeconds,
      attrs.sessionIndex,
      attrs.tags,
      attrs.hidden
    ),
  };
}

/**
 * The `quote` node: an atom node holding one citation line
 * (`- **"text"** @ MM:SS (Ns) | duration: Ns | session: N | tags: a, b`).
 *
 * Markdown parsing goes through a dedicated markdown-it block rule (registered in
 * `configureMarkdownIt`) that matches a line via `parseQuote` directly and emits a
 * single custom token carrying the parsed result as `token.meta` — there is no HTML
 * bridge/DOM round-trip involved (unlike the previous Tiptap implementation's
 * `data-type="quote"` div indirection), which removes a whole class of "did the
 * DOM round-trip preserve this attribute" bug.
 */
export interface QuoteViewContext {
  codebook: Codebook;
  onQuoteClick: (q: ParsedQuote) => void;
  onQuoteDoubleClick: (q: ParsedQuote) => void;
  onQuoteDelete: (q: ParsedQuote) => void;
}

const EMPTY_CTX: QuoteViewContext = {
  codebook: { tags: [], categories: [] },
  onQuoteClick: () => {},
  onQuoteDoubleClick: () => {},
  onQuoteDelete: () => {},
};

export class QuoteExtension extends NodeExtension {
  name = "quote";

  /**
   * `ctx` is stored by reference, not spread into `this.options` — the caller (
   * `RichMarkdownEditor`) keeps a stable mutable object here (via a ref) and updates its
   * fields in place as `codebook`/callback props change, without needing to rebuild the
   * extension list or remount the editor.
   */
  constructor(private ctx: QuoteViewContext = EMPTY_CTX) {
    super();
  }

  view(node: PMNode, view: EditorView, getPos: () => number | undefined): NodeView {
    return new QuoteNodeView(node, view, getPos, this.ctx);
  }

  schema(): NodeSpec {
    return {
      group: "block",
      atom: true,
      selectable: true,
      draggable: true,
      attrs: {
        text: { default: "" },
        startSeconds: { default: 0 },
        durationSeconds: { default: 20 },
        sessionIndex: { default: 1 },
        tags: { default: [] as string[] },
        hidden: { default: false },
      },
      // toDOM/parseDOM exist only for copy/paste and NodeView bookkeeping — markdown
      // parsing never goes through this. Kept minimal on purpose.
      toDOM(node) {
        const a = node.attrs as QuoteAttrs;
        return ["div", { "data-type": "quote", "data-start-seconds": String(a.startSeconds) }];
      },
      parseDOM: [{ tag: 'div[data-type="quote"]' }],
    };
  }

  configureMarkdownIt(md: MarkdownIt) {
    md.block.ruler.before(
      "list",
      "quote_line",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state: any, startLine: number, _endLine: number, silent: boolean) => {
        const pos = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const line = state.src.slice(pos, max);
        const parsed = parseQuote(line);
        if (!parsed) return false;
        if (silent) return true;

        const token = state.push("quote_line", "", 0);
        token.meta = parsed;
        token.map = [startLine, startLine + 1];
        state.line = startLine + 1;
        return true;
      },
      { alt: [] }
    );
  }

  tokens(): Record<string, ParseSpec> {
    return {
      quote_line: {
        node: "quote",
        noCloseToken: true,
        getAttrs: (tok) => {
          const q = tok.meta as ParsedQuote;
          return {
            text: q.text,
            startSeconds: q.startSeconds,
            durationSeconds: q.durationSeconds,
            sessionIndex: q.sessionIndex,
            tags: q.tags,
            hidden: !!q.hidden,
          };
        },
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: PMNode) {
    const a = node.attrs as QuoteAttrs;
    state.write(formatQuoteAsMarkdown(a.text, a.startSeconds, a.durationSeconds, a.sessionIndex, a.tags, a.hidden));
    state.closeBlock(node);
  }
}
