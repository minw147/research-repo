import type { NodeSpec } from "prosemirror-model";
import type { ParseSpec } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";

export class TableHeaderExtension extends NodeExtension {
  name = "table_header";

  schema(): NodeSpec {
    return {
      content: "inline*",
      toDOM() {
        return ["th", 0];
      },
      parseDOM: [{ tag: "th" }],
    };
  }

  tokens(): Record<string, ParseSpec> {
    return {
      th: { block: "table_header" },
    };
  }
}
