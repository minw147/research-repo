import type { NodeSpec, Node as PMNode } from "prosemirror-model";
import type { NodeView, EditorView } from "prosemirror-view";
import type { ParseSpec, MarkdownSerializerState } from "prosemirror-markdown";
import type MarkdownIt from "markdown-it";
import { Extension } from "./extension";

export abstract class NodeExtension<
  Options extends Record<string, unknown> = Record<string, unknown>
> extends Extension<Options> {
  readonly kind = "node" as const;

  /** The node's ProseMirror schema spec. */
  abstract schema(): NodeSpec;

  /** Serialize a node of this type to markdown. Matches prosemirror-markdown's node-serializer signature. */
  toMarkdown?(state: MarkdownSerializerState, node: PMNode, parent: PMNode, index: number): void;

  /**
   * Maps markdown-it token name(s) produced for this node to a ProseMirror ParseSpec.
   * A node may own more than one token name (e.g. both `fence` and `code_block`).
   */
  tokens?(): Record<string, ParseSpec>;

  /** Register any custom markdown-it rules this node needs (e.g. a custom block rule). */
  configureMarkdownIt?(md: MarkdownIt): void;

  /** Optional custom NodeView factory. */
  view?(node: PMNode, view: EditorView, getPos: () => number | undefined): NodeView;
}
