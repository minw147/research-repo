"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { EditorView } from "prosemirror-view";
import { Columns, Rows, Trash2 } from "lucide-react";
import { addRowAfter, deleteRow, addColumnAfter, deleteColumn, isInsideTable } from "@/lib/prosemirror/nodes/table-commands";

interface TableHoverControlsProps {
  view: EditorView;
  getPos: () => number | undefined;
}

export function TableHoverControls({ view }: TableHoverControlsProps) {
  const [, forceRender] = useState(0);

  // Re-check applicability whenever the selection/doc changes. There's no more
  // `editor.on("selectionUpdate"/"transaction")` event emitter (raw EditorView has no
  // such API) — RichMarkdownEditor bumps a version counter on every dispatched
  // transaction and this component is simply re-rendered by its parent as a result,
  // but it also needs to react to view.state changing between its own renders, so we
  // poll the view's current state directly on each render rather than subscribing.
  const state = view.state;
  const active = isInsideTable(state);

  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const run = useCallback(
    (cmd: (state: typeof view.state, dispatch: typeof view.dispatch) => boolean) => (e: React.MouseEvent) => {
      e.preventDefault();
      cmd(view.state, view.dispatch);
      view.focus();
      rerender();
    },
    [view, rerender]
  );

  const canAddRow = addRowAfter(state);
  const canDeleteRow = deleteRow(state);
  const canAddCol = addColumnAfter(state);
  const canDeleteCol = deleteColumn(state);

  return (
    <div
      className={[
        "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20",
        "opacity-0 transition-opacity duration-150",
        active ? "opacity-100" : "",
        "group-hover:opacity-100",
      ].join(" ")}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-black/[.08] bg-white/95 shadow-dialog backdrop-blur px-1.5 py-1">
        <button
          type="button"
          disabled={!canAddRow}
          onMouseDown={run(addRowAfter)}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canAddRow ? "text-black/70 hover:bg-black/[.08] hover:text-black" : "text-black/[.24] cursor-not-allowed",
          ].join(" ")}
          title="Add row"
        >
          <Rows className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!canDeleteRow}
          onMouseDown={run(deleteRow)}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canDeleteRow ? "text-black/70 hover:bg-black/[.08] hover:text-black" : "text-black/[.24] cursor-not-allowed",
          ].join(" ")}
          title="Delete row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <span className="w-px h-4 bg-black/[.08] mx-0.5" aria-hidden />

        <button
          type="button"
          disabled={!canAddCol}
          onMouseDown={run(addColumnAfter)}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canAddCol ? "text-black/70 hover:bg-black/[.08] hover:text-black" : "text-black/[.24] cursor-not-allowed",
          ].join(" ")}
          title="Add column"
        >
          <Columns className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!canDeleteCol}
          onMouseDown={run(deleteColumn)}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canDeleteCol ? "text-black/70 hover:bg-black/[.08] hover:text-black" : "text-black/[.24] cursor-not-allowed",
          ].join(" ")}
          title="Delete column"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
