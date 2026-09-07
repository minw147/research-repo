import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark, chainCommands } from "prosemirror-commands";
import { splitListItem, liftListItem, sinkListItem } from "prosemirror-schema-list";
import { undo, redo } from "prosemirror-history";
import { ExtensionManager } from "./extension-manager";
import { createStockNodeExtensions, createStockMarkExtensions } from "./nodes/stock";
import { QuoteExtension, type QuoteViewContext } from "./nodes/quote";
import { CalloutExtension } from "./nodes/callout";
import { TableExtension } from "./nodes/table";
import { TableRowExtension } from "./nodes/table-row";
import { TableCellExtension } from "./nodes/table-cell";
import { TableHeaderExtension } from "./nodes/table-header";
import type { Extension } from "./extension";

/**
 * Mutable, stable-by-reference context for the `quote` node's NodeView (codebook +
 * click/delete callbacks). `QuoteExtension` stores this object by reference (not
 * spread), so `RichMarkdownEditor` can update its fields in place as props change,
 * without rebuilding the extension list, reconstructing the schema, or remounting the
 * editor. Schema/serializer/parser shape is completely unaffected by this context
 * (it only feeds the NodeView's rendering), so this stays a true singleton for every
 * test and every editor mount alike.
 */
export const quoteViewContext: QuoteViewContext = {
  codebook: { tags: [], categories: [] },
  onQuoteClick: () => {},
  onQuoteDoubleClick: () => {},
  onQuoteDelete: () => {},
};

export const extensions: Extension[] = [
  ...createStockNodeExtensions(),
  ...createStockMarkExtensions(),
  new QuoteExtension(quoteViewContext),
  new CalloutExtension(),
  new TableExtension(),
  new TableRowExtension(),
  new TableCellExtension(),
  new TableHeaderExtension(),
];

export const manager = new ExtensionManager(extensions);
export const pmSchema = manager.schema;
export const pmSerializer = manager.serializer;
export const pmParser = manager.parser;

/**
 * `prosemirror-commands`' `baseKeymap` (Enter/Backspace/Delete/arrow-selection
 * behavior) was never wired up anywhere — no extension registered it, so pressing
 * Enter did nothing. Tiptap's StarterKit bundled this kind of default keymap
 * automatically; raw ProseMirror requires it explicitly. `Enter`/`Tab`/`Shift-Tab` are
 * overridden with list-aware versions first, falling back to the base command inside
 * `chainCommands`-equivalent behavior only when not inside a list item. Undo/redo and
 * bold/italic keyboard shortcuts are added here too, for the same reason — `history()`
 * itself doesn't bind Mod-z/Mod-y, and StarterKit used to.
 */
function baseEditingKeymap() {
  const { list_item } = pmSchema.nodes;
  const { strong, em } = pmSchema.marks;
  return keymap({
    ...baseKeymap,
    Enter: chainCommands(splitListItem(list_item), baseKeymap.Enter),
    Tab: sinkListItem(list_item),
    "Shift-Tab": liftListItem(list_item),
    "Mod-z": undo,
    "Mod-y": redo,
    "Mod-Shift-z": redo,
    "Mod-b": toggleMark(strong),
    "Mod-i": toggleMark(em),
  });
}

export function buildPlugins(): ReturnType<ExtensionManager["plugins"]> {
  return manager.plugins([baseEditingKeymap()]);
}

export const pmNodeViews = manager.nodeViews();
