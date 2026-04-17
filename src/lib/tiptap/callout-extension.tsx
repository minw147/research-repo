"use client";

import { Node, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import React from "react";
import { Callout } from "@/components/shared/Callout";
import type { NodeViewProps } from "@tiptap/react";
import type MarkdownIt from "markdown-it";

type CalloutVariant = "info" | "tip" | "warning" | "insight";

function CalloutNodeView({ node }: NodeViewProps) {
  const variant = (node.attrs.calloutType as CalloutVariant) || "info";
  return (
    <NodeViewWrapper>
      <Callout variant={variant}>
        <NodeViewContent />
      </Callout>
    </NodeViewWrapper>
  );
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-callout-type") ?? "info",
        renderHTML: (attrs: { calloutType: string }) => ({ "data-callout-type": attrs.calloutType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout-type]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: {
            write: (s: string) => void;
            ensureNewLine: () => void;
            closeBlock: (n: unknown) => void;
            renderContent: (n: unknown) => void;
          },
          node: { attrs: { calloutType: string } }
        ) {
          const type = node.attrs.calloutType ?? "info";
          state.write(`:::${type}\n`);
          state.renderContent(node);
          state.ensureNewLine();
          state.write(":::");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            // Block rule: parse :::type ... ::: directives into callout HTML
            markdownit.block.ruler.before(
              "fence",
              "callout_directive",
              (state, startLine, endLine, silent) => {
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

                const openToken = state.push("html_block", "", 0);
                openToken.content = `<div data-callout-type="${calloutType}">`;

                state.md.block.tokenize(state, startLine + 1, nextLine);

                const closeToken = state.push("html_block", "", 0);
                closeToken.content = `</div>`;

                state.line = nextLine + 1;
                return true;
              },
              { alt: ["paragraph", "reference", "blockquote"] }
            );
          },
        },
      },
    };
  },
});
