import { createRoot, type Root } from "react-dom/client";
import type { RefCallback, ReactNode } from "react";

/**
 * Ref callback for splicing a pre-existing, ProseMirror-owned DOM node (a NodeView's
 * `contentDOM`) into a React render tree. React can only render elements it created
 * itself, so a container node's NodeView (callout, table) renders its own chrome via
 * React and manually appends the real `contentDOM` (whose children ProseMirror manages
 * directly) into a wrapper element via this callback, once, on mount.
 */
export function mountContentDOMRef(contentDOM: HTMLElement): RefCallback<HTMLElement> {
  return (el) => {
    if (el && contentDOM.parentElement !== el) {
      el.appendChild(contentDOM);
    }
  };
}

export interface NodeViewRoot {
  render(node: ReactNode): void;
  unmount(): void;
}

/**
 * Wraps a React root scoped to a NodeView's DOM element. `unmount()` defers the actual
 * `Root.unmount()` call to a microtask rather than calling it synchronously.
 *
 * Why: a NodeView's `destroy()` runs synchronously inside `EditorView.destroy()`, which
 * itself typically runs synchronously inside a React effect cleanup (e.g.
 * RichMarkdownEditor remounting). Calling `root.unmount()` on a nested, independently-
 * created root while React's own reconciler is mid-cycle for the OUTER component tree
 * triggers "Attempted to synchronously unmount a root while React was already
 * rendering" and can leave stale content behind — most visible under StrictMode's
 * mount→cleanup→mount double-invoke in dev, where it manifested as every quote/table
 * NodeView rendering twice. Deferring to a microtask lets the in-flight render finish
 * first.
 */
export function createNodeViewRoot(dom: HTMLElement): NodeViewRoot {
  const root: Root = createRoot(dom);
  return {
    render: (node) => root.render(node),
    unmount: () => {
      queueMicrotask(() => root.unmount());
    },
  };
}
