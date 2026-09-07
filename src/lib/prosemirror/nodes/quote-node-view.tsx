import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import { createNodeViewRoot } from "../react-node-view";
import { QuoteCard } from "@/components/builder/QuoteCard";
import { quoteFromAttrs, type QuoteAttrs, type QuoteViewContext } from "./quote";

/**
 * NodeView for the `quote` atom node. The `ignoreMutation`/`stopEvent` overrides here
 * are the actual fix for the drag-drop corruption bug found while debugging the
 * previous Tiptap implementation (which had neither): a quote card's rendered DOM has
 * decorative elements (an absolutely-positioned timestamp badge, tag pills, a delete
 * button) that visually overlap neighboring content but correspond to no real
 * ProseMirror document position. Without `ignoreMutation`, PM's DOMObserver can try to
 * reconcile React's own re-renders of that decorative DOM as document edits at a
 * guessed position — this hardens the NodeView boundary instead.
 */
export class QuoteNodeView implements NodeView {
  dom: HTMLElement;
  private root: ReturnType<typeof createNodeViewRoot>;
  private node: PMNode;

  constructor(
    node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined,
    private ctx: QuoteViewContext
  ) {
    this.node = node;
    this.dom = document.createElement("div");
    this.dom.setAttribute("data-type", "quote");
    this.dom.setAttribute("data-drag-handle", "");
    this.dom.contentEditable = "false";
    this.root = createNodeViewRoot(this.dom);
    this.render();
  }

  private render() {
    const attrs = this.node.attrs as QuoteAttrs;
    const quote = quoteFromAttrs(attrs);
    this.root.render(
      <QuoteCard
        quote={quote}
        codebook={this.ctx.codebook}
        onClick={this.ctx.onQuoteClick}
        onDoubleClick={this.ctx.onQuoteDoubleClick}
        onDelete={() => {
          this.ctx.onQuoteDelete(quote);
          this.deleteSelf();
        }}
      />
    );
  }

  private deleteSelf() {
    const pos = this.getPos();
    if (pos == null) return;
    const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
    this.view.dispatch(tr);
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  // Nothing under `this.dom` is PM-managed content (this is an atom node — no
  // contentDOM at all). Every mutation is React re-rendering its own DOM: the badge,
  // the tag-pill row (which re-renders whenever the `codebook` prop's color/label
  // mapping changes — a mutation driven purely by React props, with no PM transaction
  // involved at all), the delete button's hover classes. None of it is a document edit.
  ignoreMutation(): boolean {
    return true;
  }

  // Let these bubble to (a) QuoteCard's own onClick/onDoubleClick/onDelete handlers on
  // the DOM, and (b) ProseMirror's native handlers (node selection on mousedown/click,
  // native drag machinery on drag*/drop). PM resolves the *position* of a drag/drop
  // target by walking UP from event.target via nearestDesc(target, true) to the nearest
  // NodeView-owned DOM ancestor (this.dom, which PM tracks) — it does not need the
  // innermost decorative element itself to be position-mapped. Everything else is
  // swallowed: nothing here is contentEditable, so PM has no legitimate reason to
  // interpret other event types itself.
  stopEvent(event: Event): boolean {
    const PASSTHROUGH = new Set(["mousedown", "click", "dblclick", "dragstart", "dragover", "dragend", "drop"]);
    return !PASSTHROUGH.has(event.type);
  }

  selectNode() {
    this.dom.classList.add("ring-2", "ring-primary");
  }

  deselectNode() {
    this.dom.classList.remove("ring-2", "ring-primary");
  }

  destroy() {
    this.root.unmount();
  }
}
