import type { NodeSpec } from "prosemirror-model";
import type { ParseSpec } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";

/**
 * Cell content is `inline*`, not `paragraph+` — markdown-it's native GFM pipe-table
 * rule emits cell bodies as a bare `inline` token (no nested `paragraph_open`/`_close`),
 * matching how raw pipe-table syntax actually works (single-line inline content only,
 * no block content possible inside a `| cell |`). This also matches the existing
 * hand-rolled serializer, which flattens cells via `.textContent` regardless.
 */
export class TableCellExtension extends NodeExtension {
  name = "table_cell";

  schema(): NodeSpec {
    return {
      content: "inline*",
      toDOM() {
        return ["td", 0];
      },
      parseDOM: [{ tag: "td" }],
    };
  }

  tokens(): Record<string, ParseSpec> {
    return {
      td: { block: "table_cell" },
    };
  }
}
