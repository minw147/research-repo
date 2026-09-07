import type { EditorState, Transaction } from "prosemirror-state";
import type { MarkType, NodeType } from "prosemirror-model";
import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import { wrapInList, liftListItem } from "prosemirror-schema-list";
import { createTable } from "./nodes/table-commands";

type Dispatch = ((tr: Transaction) => void) | undefined;
type Command = (state: EditorState, dispatch?: Dispatch) => boolean;

export function isMarkActive(state: EditorState, type: MarkType): boolean {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks ?? $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

export function isNodeActive(state: EditorState, type: NodeType, attrs: Record<string, unknown> = {}): boolean {
  const { $from, to } = state.selection;
  const nodeSelection = state.selection as unknown as { node?: import("prosemirror-model").Node };
  if (nodeSelection.node) return nodeSelection.node.hasMarkup(type, attrs);
  return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
}

export function isNodeActiveAnyAncestor(state: EditorState, type: NodeType): boolean {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type === type) return true;
  }
  return false;
}

export function toggleHeading(level: 1 | 2 | 3): Command {
  return (state, dispatch) => {
    const isActive = isNodeActive(state, state.schema.nodes.heading, { level });
    const target = isActive ? state.schema.nodes.paragraph : state.schema.nodes.heading;
    const attrs = isActive ? undefined : { level };
    return setBlockType(target, attrs)(state, dispatch);
  };
}

export function setParagraph(): Command {
  return (state, dispatch) => setBlockType(state.schema.nodes.paragraph)(state, dispatch);
}

export function toggleBulletList(): Command {
  return (state, dispatch) => {
    const { bullet_list, list_item } = state.schema.nodes;
    if (isNodeActiveAnyAncestor(state, bullet_list)) {
      return liftListItem(list_item)(state, dispatch);
    }
    return wrapInList(bullet_list)(state, dispatch);
  };
}

export function toggleOrderedList(): Command {
  return (state, dispatch) => {
    const { ordered_list, list_item } = state.schema.nodes;
    if (isNodeActiveAnyAncestor(state, ordered_list)) {
      return liftListItem(list_item)(state, dispatch);
    }
    return wrapInList(ordered_list)(state, dispatch);
  };
}

export function toggleBlockquote(): Command {
  return (state, dispatch) => {
    const { blockquote } = state.schema.nodes;
    if (isNodeActiveAnyAncestor(state, blockquote)) {
      return lift(state, dispatch);
    }
    return wrapIn(blockquote)(state, dispatch);
  };
}

export function setHorizontalRule(): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const hr = state.schema.nodes.horizontal_rule.create();
      dispatch(state.tr.replaceSelectionWith(hr).scrollIntoView());
    }
    return true;
  };
}

export function insertCallout(calloutType: string): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const { callout, paragraph } = state.schema.nodes;
      const node = callout.create({ calloutType }, paragraph.create());
      dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
    }
    return true;
  };
}

export function insertTable(rows: number, cols: number, withHeaderRow: boolean): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const table = createTable(state, rows, cols, withHeaderRow);
      dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
    }
    return true;
  };
}

export function toggleBold(): Command {
  return (state, dispatch) => toggleMark(state.schema.marks.strong)(state, dispatch);
}
export function toggleItalic(): Command {
  return (state, dispatch) => toggleMark(state.schema.marks.em)(state, dispatch);
}
export function toggleCode(): Command {
  return (state, dispatch) => toggleMark(state.schema.marks.code)(state, dispatch);
}

/** Mirrors Tiptap's `extendMarkRange("link").setLink({href})`: expands the selection to
 * cover the whole existing link (if the cursor/selection sits inside one) before
 * applying the new href, so editing a link's URL doesn't create two adjacent links. */
export function setLink(href: string): Command {
  return (state, dispatch) => {
    const { link } = state.schema.marks;
    const { $from, from, to } = state.selection;
    let rangeFrom = from;
    let rangeTo = to;

    if (link.isInSet($from.marks())) {
      const parentStart = $from.start();
      const parentEnd = $from.end();
      let start = from;
      let end = to;
      // rangeHasMark on a single character avoids the boundary ambiguity of
      // $pos.marks() (which reports the *preceding* node's marks at a node boundary).
      while (start > parentStart && state.doc.rangeHasMark(start - 1, start, link)) start--;
      while (end < parentEnd && state.doc.rangeHasMark(end, end + 1, link)) end++;
      rangeFrom = start;
      rangeTo = end;
    }

    if (dispatch) {
      const tr = state.tr.removeMark(rangeFrom, rangeTo, link).addMark(rangeFrom, rangeTo, link.create({ href }));
      dispatch(tr);
    }
    return true;
  };
}

export function unsetLink(): Command {
  return (state, dispatch) => toggleMark(state.schema.marks.link)(state, dispatch);
}
