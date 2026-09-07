import type { MarkSpec, Mark, Node as PMNode } from "prosemirror-model";
import type { ParseSpec, MarkdownSerializerState } from "prosemirror-markdown";
import { Extension } from "./extension";

export interface MarkSerializerSpec {
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: PMNode, index: number) => string);
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: PMNode, index: number) => string);
  mixable?: boolean;
  expelEnclosingWhitespace?: boolean;
  escape?: boolean;
}

export abstract class MarkExtension<
  Options extends Record<string, unknown> = Record<string, unknown>
> extends Extension<Options> {
  readonly kind = "mark" as const;

  abstract schema(): MarkSpec;
  toMarkdown?(): MarkSerializerSpec;
  tokens?(): Record<string, ParseSpec>;
}
