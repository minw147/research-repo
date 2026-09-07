import type { NodeSpec, MarkSpec } from "prosemirror-model";
import { schema as basicSchema, defaultMarkdownParser, defaultMarkdownSerializer, type ParseSpec } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";
import { MarkExtension } from "../mark-extension";
import type { MarkSerializerSpec } from "../mark-extension";

/**
 * Thin wrappers around prosemirror-markdown's own basic-schema node/mark specs and its
 * default parser/serializer mappings — these are already-correct CommonMark mappings,
 * reused as-is rather than hand-rolled. Only quote/callout/table (see sibling files)
 * have real custom logic.
 */

function tokensForNode(nodeName: string): Record<string, ParseSpec> {
  const out: Record<string, ParseSpec> = {};
  for (const [tokenName, spec] of Object.entries(defaultMarkdownParser.tokens)) {
    if (spec.node === nodeName || spec.block === nodeName) out[tokenName] = spec;
  }
  return out;
}

function tokensForMark(markName: string): Record<string, ParseSpec> {
  const out: Record<string, ParseSpec> = {};
  for (const [tokenName, spec] of Object.entries(defaultMarkdownParser.tokens)) {
    if (spec.mark === markName) out[tokenName] = spec;
  }
  return out;
}

class StockNode extends NodeExtension {
  constructor(public name: string, private spec: NodeSpec) {
    super();
  }
  schema(): NodeSpec {
    return this.spec;
  }
  toMarkdown(...args: Parameters<NonNullable<NodeExtension["toMarkdown"]>>) {
    return defaultMarkdownSerializer.nodes[this.name](...args);
  }
  tokens() {
    return tokensForNode(this.name);
  }
}

class StockMark extends MarkExtension {
  constructor(public name: string, private spec: MarkSpec) {
    super();
  }
  schema(): MarkSpec {
    return this.spec;
  }
  toMarkdown(): MarkSerializerSpec {
    return defaultMarkdownSerializer.marks[this.name] as MarkSerializerSpec;
  }
  tokens() {
    return tokensForMark(this.name);
  }
}

// doc/text carry no token mapping (markdown-it "text" tokens are handled internally by
// MarkdownParser regardless of the tokens map) and doc has no serializer entry (the
// top-level node is never itself passed through the node-serializer map).
class DocNode extends NodeExtension {
  name = "doc";
  schema(): NodeSpec {
    return basicSchema.spec.nodes.get("doc")!;
  }
}

class TextNode extends NodeExtension {
  name = "text";
  schema(): NodeSpec {
    return basicSchema.spec.nodes.get("text")!;
  }
  toMarkdown(...args: Parameters<NonNullable<NodeExtension["toMarkdown"]>>) {
    return defaultMarkdownSerializer.nodes.text(...args);
  }
}

export function createStockNodeExtensions(): NodeExtension[] {
  const names = [
    "paragraph",
    "blockquote",
    "horizontal_rule",
    "heading",
    "code_block",
    "ordered_list",
    "bullet_list",
    "list_item",
    "hard_break",
    "image",
  ];

  // bullet_list gets one override: default the "-" marker (matching the current editor's
  // `bulletListMarker: "-"` config) instead of prosemirror-markdown's default "*".
  //
  // IMPORTANT: bullet_list must stay registered in its normal position within `names`
  // (after paragraph), NOT hoisted before the loop. ProseMirror's automatic content-fill
  // search (used e.g. when parsing an empty document, or via createAndFill) picks the
  // FIRST "block"-group node type in schema registration order that satisfies a "block+"
  // requirement, without considering whether that type's own content can be filled
  // cheaply. bullet_list's content is "list_item+", and list_item's content is "block+"
  // again — if bullet_list were the first "block"-group candidate, filling doc's
  // top-level "block+" would pick bullet_list, which needs a list_item, which needs to
  // fill "block+" again, which (still being first) picks bullet_list again... an
  // infinite mutual recursion that blows the stack. This was found the hard way: parsing
  // an empty string crashed once bullet_list was accidentally registered before
  // paragraph. Keeping paragraph (content "inline*", trivially empty-fillable) as the
  // first "block"-group candidate is what makes auto-fill terminate immediately.
  const baseBulletListSpec = basicSchema.spec.nodes.get("bullet_list")!;
  const bulletListSpec: NodeSpec = {
    ...baseBulletListSpec,
    attrs: { ...baseBulletListSpec.attrs, bullet: { default: "-" } },
  };

  return [
    new DocNode(),
    new TextNode(),
    ...names.map((name) =>
      name === "bullet_list" ? new StockNode("bullet_list", bulletListSpec) : new StockNode(name, basicSchema.spec.nodes.get(name)!)
    ),
  ];
}

export function createStockMarkExtensions(): MarkExtension[] {
  const names = ["strong", "em", "code", "link"];
  return names.map((name) => new StockMark(name, basicSchema.spec.marks.get(name)!));
}
