import type { NodeSpec } from "prosemirror-model";
import type { ParseSpec } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";

export class TableRowExtension extends NodeExtension {
  name = "table_row";

  schema(): NodeSpec {
    return {
      content: "(table_cell | table_header)+",
      toDOM() {
        return ["tr", 0];
      },
      parseDOM: [{ tag: "tr" }],
    };
  }

  tokens(): Record<string, ParseSpec> {
    return {
      tr: { block: "table_row" },
    };
  }
}
