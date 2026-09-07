import { describe, it, expect } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import { ExtensionManager } from "../extension-manager";
import { createStockNodeExtensions, createStockMarkExtensions } from "./stock";
import { TableExtension } from "./table";
import { TableRowExtension } from "./table-row";
import { TableCellExtension } from "./table-cell";
import { TableHeaderExtension } from "./table-header";
import { addRowAfter, deleteRow, addColumnAfter, deleteColumn, createTable } from "./table-commands";

function makeManager() {
  return new ExtensionManager([
    ...createStockNodeExtensions(),
    ...createStockMarkExtensions(),
    new TableExtension(),
    new TableRowExtension(),
    new TableCellExtension(),
    new TableHeaderExtension(),
  ]);
}

describe("table nodes", () => {
  it("parses a GFM pipe table into table/table_row/table_header/table_cell nodes", () => {
    const { parser, schema } = makeManager();
    const md = "| Theme | So what |\n| --- | --- |\n| A | B |\n";
    const doc = parser.parse(md);
    const table = doc.child(0);
    expect(table.type).toBe(schema.nodes.table);
    expect(table.childCount).toBe(2);
    const headerRow = table.child(0);
    expect(headerRow.child(0).type).toBe(schema.nodes.table_header);
    expect(headerRow.child(0).textContent).toBe("Theme");
    expect(headerRow.child(1).textContent).toBe("So what");
    const bodyRow = table.child(1);
    expect(bodyRow.child(0).type).toBe(schema.nodes.table_cell);
    expect(bodyRow.child(0).textContent).toBe("A");
  });

  it("serializes with the hand-rolled pipe-table serializer, escaping and padding columns", () => {
    const { schema, serializer } = makeManager();
    const table = schema.nodes.table.create(null, [
      schema.nodes.table_row.create(null, [
        schema.nodes.table_header.create(null, schema.text("A | B")),
        schema.nodes.table_header.create(null, schema.text("C")),
      ]),
      schema.nodes.table_row.create(null, [schema.nodes.table_cell.create(null, schema.text("only one cell"))]),
    ]);
    const doc = schema.nodes.doc.create(null, [table]);
    const md = serializer.serialize(doc);
    expect(md).toContain("| A \\| B | C |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| only one cell |  |"); // padded to column count
  });

  it("round-trips a pipe table through parse + serialize", () => {
    const { parser, serializer } = makeManager();
    const md = "| Theme | So what |\n| --- | --- |\n| Hardware-first framing | Treat silicon constraints as leading indicators. |\n";
    expect(serializer.serialize(parser.parse(md))).toBe(md);
  });

  it("addRowAfter inserts a row with the same column count", () => {
    const { schema } = makeManager();
    const doc = createDocWithTable(schema, 2, 3);
    const state = EditorState.create({ schema, doc, selection: undefined });
    const sel = firstCellSelection(state);
    const stateAtCell = state.apply(state.tr.setSelection(sel));
    let applied = false;
    addRowAfter(stateAtCell, (tr) => {
      applied = true;
      const newState = stateAtCell.apply(tr);
      expect(newState.doc.child(0).childCount).toBe(3); // 2 -> 3 rows
      expect(newState.doc.child(0).child(1).childCount).toBe(3); // new row keeps col count
    });
    expect(applied).toBe(true);
  });

  it("deleteColumn refuses to remove the last remaining column", () => {
    const { schema } = makeManager();
    const doc = createDocWithTable(schema, 2, 1);
    const state = EditorState.create({ schema, doc });
    const sel = firstCellSelection(state);
    const stateAtCell = state.apply(state.tr.setSelection(sel));
    expect(deleteColumn(stateAtCell)).toBe(false);
  });

  it("createTable helper builds the expected grid with a header row", () => {
    const { schema } = makeManager();
    // Seed a minimal explicit doc rather than schema.topNodeType.createAndFill() — with
    // this many mutually-recursive "block" node types registered, ProseMirror's
    // automatic content-fill search is not something to lean on for a top-level doc.
    const doc = schema.node("doc", null, [schema.node("paragraph")]);
    const state = EditorState.create({ schema, doc });
    const table = createTable(state, 3, 3, true);
    expect(table.childCount).toBe(3);
    expect(table.child(0).child(0).type).toBe(schema.nodes.table_header);
    expect(table.child(1).child(0).type).toBe(schema.nodes.table_cell);
  });
});

function createDocWithTable(schema: ReturnType<typeof makeManager>["schema"], rows: number, cols: number) {
  const rowNodes = [];
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      cells.push(schema.nodes.table_cell.createAndFill()!);
    }
    rowNodes.push(schema.nodes.table_row.create(null, cells));
  }
  const table = schema.nodes.table.create(null, rowNodes);
  return schema.nodes.doc.create(null, [table]);
}

function firstCellSelection(state: EditorState) {
  // Position 3 lands inside the doc's first table's first row's first cell for the
  // fixtures built above (doc -> table -> row -> cell, each opening tag is +1).
  return TextSelection.create(state.doc, 3);
}
