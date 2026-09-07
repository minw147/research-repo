import type { NodeSpec, Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView, ViewMutationRecord } from "prosemirror-view";
import { Plugin } from "prosemirror-state";
import type { ParseSpec, MarkdownSerializerState } from "prosemirror-markdown";
import { NodeExtension } from "../node-extension";
import { createNodeViewRoot, mountContentDOMRef } from "../react-node-view";
import { TableHoverControls } from "@/components/builder/TableHoverControls";

/**
 * ProseMirror only calls a NodeView's `update()` when that node's own content/position
 * needs reconciling — a pure selection change (e.g. clicking from one cell into
 * another, with no edit) does not trigger it. TableHoverControls' enabled/disabled
 * state depends on the CURRENT SELECTION, so without this, clicking around inside a
 * table left the controls frozen at whatever they showed when the table was first
 * mounted (all disabled, since the cursor started outside it). Every live TableNodeView
 * registers itself here; a plugin `view.update()` — which fires on every transaction,
 * selection-only included — re-renders all of them.
 */
const activeTableViews = new Set<TableNodeView>();

/**
 * Minimal hand-rolled table: 3x3 insert + add/delete row/column, no resize/merge —
 * deliberately not pulling in `prosemirror-tables` for a feature set this small (see
 * plan). `draggable: true` is declared at the schema level even though drag-to-reorder
 * tables isn't wired up: ProseMirror's native `dragstart` reads this schema flag via
 * `nearestDesc`, a custom NodeView alone does not substitute for it.
 */
export class TableExtension extends NodeExtension {
  name = "table";

  schema(): NodeSpec {
    return {
      group: "block",
      content: "table_row+",
      isolating: true,
      draggable: true,
      toDOM() {
        return ["table", 0];
      },
      parseDOM: [{ tag: "table" }],
    };
  }

  tokens(): Record<string, ParseSpec> {
    return {
      // markdown-it's default preset has native GFM pipe-table tokenization — no plugin
      // needed. thead/tbody are structural wrappers markdown-it emits that this schema
      // has no corresponding node for, so they're explicitly ignored (unregistered
      // token types otherwise throw).
      table: { block: "table" },
      thead: { ignore: true },
      tbody: { ignore: true },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: PMNode) {
    const escapeCell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, " ").trim();

    const rows: string[][] = [];
    for (let r = 0; r < node.childCount; r++) {
      const row = node.child(r);
      const cells: string[] = [];
      for (let c = 0; c < row.childCount; c++) {
        cells.push(escapeCell(row.child(c).textContent ?? ""));
      }
      rows.push(cells);
    }

    const colCount = Math.max(1, ...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      const out = r.slice(0, colCount);
      while (out.length < colCount) out.push("");
      return out;
    });

    const header = normalized[0] ?? new Array(colCount).fill("");
    const body = normalized.slice(1);

    state.ensureNewLine();
    state.write(`| ${header.join(" | ")} |\n`);
    state.write(`| ${new Array(colCount).fill("---").join(" | ")} |\n`);
    for (const row of body) {
      state.write(`| ${row.join(" | ")} |\n`);
    }
    state.ensureNewLine();
    state.closeBlock(node);
  }

  view(_node: PMNode, view: EditorView, getPos: () => number | undefined): NodeView {
    return new TableNodeView(view, getPos);
  }

  plugins(): Plugin[] {
    return [
      new Plugin({
        view() {
          return {
            update() {
              activeTableViews.forEach((tv) => tv.refresh());
            },
          };
        },
      }),
    ];
  }
}

class TableNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private root: ReturnType<typeof createNodeViewRoot>;

  constructor(
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement("div");
    this.dom.className = "relative group my-4";
    this.contentDOM = document.createElement("table");
    this.root = createNodeViewRoot(this.dom);
    activeTableViews.add(this);
    this.render();
  }

  private render() {
    this.root.render(
      <>
        <TableHoverControls view={this.view} getPos={this.getPos} />
        <div className="overflow-x-auto" ref={mountContentDOMRef(this.contentDOM)} />
      </>
    );
  }

  /** Called by the plugin-level view.update() on every transaction, selection-only included. */
  refresh() {
    this.render();
  }

  update(): boolean {
    // Re-render the chrome (hover-controls enabled state); contentDOM's children are
    // managed by ProseMirror directly and are never touched by this render.
    this.render();
    return true;
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    // Only ignore mutations OUTSIDE contentDOM (the hover-controls chrome). Mutations
    // inside contentDOM are real row/cell edits ProseMirror must see.
    return !this.contentDOM.contains(mutation.target as Node);
  }

  destroy() {
    activeTableViews.delete(this);
    this.root.unmount();
  }
}
