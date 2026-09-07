import type { NodeSpec, Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import type MarkdownIt from "markdown-it";
import type { ParseSpec, MarkdownSerializerState } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";
import { CalloutNodeView } from "./callout-node-view";

export type CalloutType = "info" | "tip" | "warning" | "insight";

/**
 * The `callout` node: a `:::type ... :::` fenced directive wrapping block content.
 *
 * Ports the existing (already-correct) markdown-it block rule almost unchanged — same
 * fence-matching regex, same "find matching close line, recursively tokenize the
 * content between" logic, same locked-in edge cases (unclosed fence falls through as
 * plain text; bare `:::` with no type token doesn't match). The only change from the
 * previous Tiptap implementation is what gets pushed: custom `callout_open`/
 * `callout_close` tokens instead of literal `<div>`/`</div>` HTML strings, since this
 * schema has no HTML-passthrough bridge to lean on any more.
 */
export class CalloutExtension extends NodeExtension {
  name = "callout";

  view(node: PMNode, _view: EditorView, _getPos: () => number | undefined): NodeView {
    return new CalloutNodeView(node);
  }

  schema(): NodeSpec {
    return {
      group: "block",
      content: "block+",
      defining: true,
      attrs: { calloutType: { default: "info" } },
      toDOM(node) {
        return ["div", { "data-callout-type": node.attrs.calloutType as string }, 0];
      },
      parseDOM: [
        {
          tag: "div[data-callout-type]",
          getAttrs(dom) {
            return { calloutType: (dom as HTMLElement).getAttribute("data-callout-type") ?? "info" };
          },
        },
      ],
    };
  }

  configureMarkdownIt(md: MarkdownIt) {
    md.block.ruler.before(
      "fence",
      "callout_directive",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state: any, startLine: number, endLine: number, silent: boolean) => {
        const pos = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const firstLine = state.src.slice(pos, max).trimEnd();
        const openMatch = firstLine.match(/^:::(\w+)\s*$/);
        if (!openMatch) return false;
        if (silent) return true;

        const calloutType = openMatch[1];
        let nextLine = startLine + 1;
        let found = false;
        while (nextLine < endLine) {
          const ls = state.bMarks[nextLine] + state.tShift[nextLine];
          const le = state.eMarks[nextLine];
          if (state.src.slice(ls, le).trimEnd() === ":::") {
            found = true;
            break;
          }
          nextLine++;
        }
        if (!found) return false;

        const openToken = state.push("callout_open", "div", 1);
        openToken.meta = { calloutType };
        openToken.map = [startLine, startLine + 1];

        state.md.block.tokenize(state, startLine + 1, nextLine);

        const closeToken = state.push("callout_close", "div", -1);
        closeToken.map = [nextLine, nextLine + 1];

        state.line = nextLine + 1;
        return true;
      },
      { alt: ["paragraph", "reference", "blockquote"] }
    );
  }

  tokens(): Record<string, ParseSpec> {
    return {
      callout: {
        block: "callout",
        getAttrs: (tok) => ({ calloutType: (tok.meta as { calloutType?: string } | undefined)?.calloutType ?? "info" }),
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: PMNode) {
    const type = (node.attrs.calloutType as string) || "info";
    state.write(`:::${type}\n`);
    state.renderContent(node);
    // renderContent's last child leaves a deferred "blank line" close pending (the
    // default block separator, size 2). Flush it as a single newline instead so the
    // closing fence sits directly under the content — `:::type\n...\n:::`, not
    // `:::type\n...\n\n:::`. flushClose isn't part of the public d.ts but is a real,
    // stable method on the class; there's no other documented way to collapse a
    // pending block-close into a single newline.
    (state as unknown as { flushClose: (size?: number) => void }).flushClose(1);
    state.write(":::");
    state.closeBlock(node);
  }
}
