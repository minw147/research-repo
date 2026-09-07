import { Schema, type NodeSpec, type MarkSpec } from "prosemirror-model";
import MarkdownIt from "markdown-it";
import { MarkdownParser, MarkdownSerializer, type ParseSpec } from "prosemirror-markdown";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import type { Plugin } from "prosemirror-state";
import type { EditorView, NodeViewConstructor } from "prosemirror-view";
import type { Extension } from "./extension";
import type { NodeExtension } from "./node-extension";
import type { MarkExtension } from "./mark-extension";

function isNodeExtension(e: Extension): e is NodeExtension {
  return e.kind === "node";
}

function isMarkExtension(e: Extension): e is MarkExtension {
  return e.kind === "mark";
}

/**
 * Builds exactly one Schema, MarkdownSerializer and MarkdownParser from an ordered
 * list of extensions. This single instance is exported by `index.ts` and imported by
 * both the live editor and every test — the schema/serializer/parser can never drift
 * from what the editor actually runs, unlike a library's opaque internal parsing.
 */
export class ExtensionManager {
  readonly extensions: Extension[];
  readonly schema: Schema;
  readonly serializer: MarkdownSerializer;
  readonly parser: MarkdownParser;

  constructor(extensions: Extension[]) {
    this.extensions = extensions;
    const nodeExts = extensions.filter(isNodeExtension);
    const markExts = extensions.filter(isMarkExtension);

    const nodes: Record<string, NodeSpec> = {};
    for (const ext of nodeExts) nodes[ext.name] = ext.schema();

    const marks: Record<string, MarkSpec> = {};
    for (const ext of markExts) marks[ext.name] = ext.schema();

    this.schema = new Schema({ nodes, marks });

    const serializerNodes: Record<
      string,
      (state: import("prosemirror-markdown").MarkdownSerializerState, node: import("prosemirror-model").Node, parent: import("prosemirror-model").Node, index: number) => void
    > = {};
    for (const ext of nodeExts) {
      if (ext.toMarkdown) serializerNodes[ext.name] = (state, node, parent, index) => ext.toMarkdown!(state, node, parent, index);
    }
    const serializerMarks: Record<string, import("./mark-extension").MarkSerializerSpec> = {};
    for (const ext of markExts) {
      if (ext.toMarkdown) serializerMarks[ext.name] = ext.toMarkdown();
    }
    this.serializer = new MarkdownSerializer(serializerNodes, serializerMarks);

    // One shared markdown-it instance. "default" preset (not "commonmark") includes
    // GFM-style pipe tables natively — no extra plugin needed. html is disabled: nothing
    // in this schema needs raw HTML passthrough (quote/callout use dedicated block rules
    // + custom tokens, not an HTML bridge).
    const md = new MarkdownIt("default", { html: false });
    for (const ext of nodeExts) ext.configureMarkdownIt?.(md);

    const tokens: Record<string, ParseSpec> = {};
    for (const ext of [...nodeExts, ...markExts]) {
      const t = ext.tokens?.();
      if (t) Object.assign(tokens, t);
    }
    this.parser = new MarkdownParser(this.schema, md, tokens);
  }

  /** All plugins contributed by extensions, plus the standard history/dropcursor/gapcursor set. */
  plugins(extra: Plugin[] = []): Plugin[] {
    const keymapPlugins = this.extensions
      .filter((e) => e.keys)
      .map((e) => keymap(e.keys!(this.schema)));
    const nodePlugins = this.extensions.flatMap((e) => e.plugins?.(this.schema) ?? []);
    return [...keymapPlugins, history(), dropCursor(), gapCursor(), ...nodePlugins, ...extra];
  }

  /**
   * Collects every NodeExtension's `.view()` factory into the map EditorView actually
   * needs. Unlike Tiptap, raw ProseMirror does not discover custom node views from the
   * schema/extension objects on its own — they must be passed explicitly as the
   * `nodeViews` constructor option. Missing this wiring means the node silently falls
   * back to its bare `toDOM()` output (no NodeView, no React content) with no error.
   */
  nodeViews(): Record<string, NodeViewConstructor> {
    const out: Record<string, NodeViewConstructor> = {};
    for (const ext of this.extensions) {
      const nodeExt = ext as NodeExtension;
      if (ext.kind === "node" && nodeExt.view) {
        out[nodeExt.name] = (node, view: EditorView, getPos) => nodeExt.view!(node, view, getPos);
      }
    }
    return out;
  }
}
