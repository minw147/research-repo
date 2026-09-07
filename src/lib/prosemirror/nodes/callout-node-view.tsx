import type { Node as PMNode } from "prosemirror-model";
import type { NodeView, ViewMutationRecord } from "prosemirror-view";
import { createNodeViewRoot, mountContentDOMRef } from "../react-node-view";
import { Callout } from "@/components/shared/Callout";
import type { CalloutType } from "./callout";

/**
 * NodeView for the `callout` container node. Renders the same `<Callout>` component the
 * old Tiptap implementation used (colored background/border/icon by variant), splicing
 * ProseMirror's own `contentDOM` into its children slot so PM keeps managing the actual
 * block content (paragraphs, etc.) directly — this component only supplies the chrome.
 */
export class CalloutNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private root: ReturnType<typeof createNodeViewRoot>;
  private node: PMNode;

  constructor(node: PMNode) {
    this.node = node;
    this.dom = document.createElement("div");
    this.contentDOM = document.createElement("div");
    this.root = createNodeViewRoot(this.dom);
    this.render();
  }

  private render() {
    const variant = ((this.node.attrs.calloutType as CalloutType) || "info") as CalloutType;
    this.root.render(
      <Callout variant={variant}>
        <div ref={mountContentDOMRef(this.contentDOM)} />
      </Callout>
    );
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  // Only ignore mutations OUTSIDE contentDOM (the Callout chrome — icon, background,
  // border re-rendering when calloutType/props change). Mutations inside contentDOM are
  // real block-content edits ProseMirror must see.
  ignoreMutation(mutation: ViewMutationRecord): boolean {
    return !this.contentDOM.contains(mutation.target as Node);
  }

  destroy() {
    this.root.unmount();
  }
}
