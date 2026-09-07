import type { EditorState, Transaction } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";

interface TableContext {
  tablePos: number;
  table: PMNode;
  rowIndex: number;
  rowPos: number;
  row: PMNode;
  colIndex: number;
}

/** Locates the table/row/column the current selection is inside, if any. */
function findTableContext(state: EditorState): TableContext | null {
  const { $from } = state.selection;
  let rowDepth = -1;
  let tableDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "table_row" && rowDepth === -1) rowDepth = d;
    if (node.type.name === "table") {
      tableDepth = d;
      break;
    }
  }
  if (tableDepth < 0 || rowDepth < 0) return null;

  const table = $from.node(tableDepth);
  const tablePos = $from.before(tableDepth);
  const rowPos = $from.before(rowDepth);
  const row = $from.node(rowDepth);

  let rowIndex = -1;
  table.forEach((_child, childOffset, i) => {
    if (tablePos + 1 + childOffset === rowPos) rowIndex = i;
  });
  if (rowIndex === -1) return null;

  const cellDepth = rowDepth + 1;
  let colIndex = 0;
  if ($from.depth >= cellDepth) {
    const cellPos = $from.before(cellDepth);
    row.forEach((_child, childOffset, i) => {
      if (rowPos + 1 + childOffset === cellPos) colIndex = i;
    });
  }

  return { tablePos, table, rowIndex, rowPos, row, colIndex };
}

export function addRowAfter(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  if (dispatch) {
    const cellType = state.schema.nodes.table_cell;
    const newCells: PMNode[] = [];
    ctx.row.forEach(() => {
      newCells.push(cellType.createAndFill() ?? cellType.create());
    });
    const newRow = state.schema.nodes.table_row.create(null, newCells);
    let pos = ctx.tablePos + 1;
    for (let i = 0; i <= ctx.rowIndex; i++) pos += ctx.table.child(i).nodeSize;
    dispatch(state.tr.insert(pos, newRow));
  }
  return true;
}

export function deleteRow(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = findTableContext(state);
  if (!ctx || ctx.table.childCount <= 1) return false;
  if (dispatch) {
    dispatch(state.tr.delete(ctx.rowPos, ctx.rowPos + ctx.row.nodeSize));
  }
  return true;
}

export function addColumnAfter(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = findTableContext(state);
  if (!ctx) return false;
  if (dispatch) {
    let tr = state.tr;
    let offset = ctx.tablePos + 1;
    for (let i = 0; i < ctx.table.childCount; i++) {
      const rowNode = ctx.table.child(i);
      let insertPos = -1;
      let cellType = state.schema.nodes.table_cell;
      rowNode.forEach((cell, childOffset, idx) => {
        if (idx === ctx.colIndex) {
          insertPos = offset + 1 + childOffset + cell.nodeSize;
          if (cell.type.name === "table_header") cellType = state.schema.nodes.table_header;
        }
      });
      if (insertPos === -1) insertPos = offset + rowNode.nodeSize - 1;
      tr = tr.insert(tr.mapping.map(insertPos), cellType.createAndFill() ?? cellType.create());
      offset += rowNode.nodeSize;
    }
    dispatch(tr);
  }
  return true;
}

export function deleteColumn(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = findTableContext(state);
  if (!ctx || ctx.row.childCount <= 1) return false;
  if (dispatch) {
    let tr = state.tr;
    let offset = ctx.tablePos + 1;
    for (let i = 0; i < ctx.table.childCount; i++) {
      const rowNode = ctx.table.child(i);
      let delFrom = -1;
      let delTo = -1;
      rowNode.forEach((cell, childOffset, idx) => {
        if (idx === ctx.colIndex) {
          delFrom = offset + 1 + childOffset;
          delTo = delFrom + cell.nodeSize;
        }
      });
      if (delFrom !== -1) tr = tr.delete(tr.mapping.map(delFrom), tr.mapping.map(delTo));
      offset += rowNode.nodeSize;
    }
    dispatch(tr);
  }
  return true;
}

export function isInsideTable(state: EditorState): boolean {
  return findTableContext(state) !== null;
}

export function createTable(
  state: EditorState,
  rows: number,
  cols: number,
  withHeaderRow: boolean
): PMNode {
  const { table_row: rowType, table_cell: cellType, table_header: headerType, table: tableType } = state.schema.nodes;
  const rowNodes: PMNode[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: PMNode[] = [];
    for (let c = 0; c < cols; c++) {
      const type = withHeaderRow && r === 0 ? headerType : cellType;
      cells.push(type.createAndFill() ?? type.create());
    }
    rowNodes.push(rowType.create(null, cells));
  }
  return tableType.create(null, rowNodes);
}
