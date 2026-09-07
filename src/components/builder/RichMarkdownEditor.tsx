"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Fragment, Slice } from "prosemirror-model";
import { dropPoint } from "prosemirror-transform";
import { pmSchema, pmSerializer, pmParser, buildPlugins, pmNodeViews, quoteViewContext } from "@/lib/prosemirror";
import { createAutosaveController, type AutosaveController } from "@/lib/prosemirror/autosave";
import { EditorToolbar } from "@/components/builder/EditorToolbar";
import { parseQuote, quotesMatch } from "@/lib/quote-parser";
import { quoteFromAttrs, type QuoteAttrs } from "@/lib/prosemirror/nodes/quote";
import type { ParsedQuote, Codebook } from "@/types";

interface RichMarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: (content: string) => void;
  codebook?: Codebook;
  onQuoteClick?: (q: ParsedQuote) => void;
  onQuoteDoubleClick?: (q: ParsedQuote) => void;
  onQuoteDelete?: (q: ParsedQuote) => void;
  /**
   * Fired when the `content` prop changes while mounted and does NOT match our own
   * last-known-saved markdown — i.e. a real external change (another process editing the
   * file, or the file-watcher's echo of some other client's save). The editor never
   * auto-resyncs itself in response to this; the parent decides whether/when to show a
   * "reload?" affordance and call the `reload()` handle below.
   */
  onExternalChangePending?: () => void;
}

export interface RichMarkdownEditorHandle {
  save: () => void;
  /** Remounts the editor from the current `content` prop, discarding any unsaved edits. */
  reload: () => void;
  /**
   * Removes every `quote` node in the live doc matching `target` (see `quotesMatch`) in one
   * transaction, then writes to disk immediately. Needed because the editor never resyncs
   * from the `content` prop — a plain disk-level edit wouldn't be reflected here.
   */
  removeQuoteInstances: (target: ParsedQuote) => void;
}

const EMPTY_CODEBOOK: Codebook = { tags: [], categories: [] };
const AUTOSAVE_DEBOUNCE_MS = 500;

export const RichMarkdownEditor = forwardRef<RichMarkdownEditorHandle, RichMarkdownEditorProps>(
  function RichMarkdownEditor(
    { content, onChange, onSave, codebook = EMPTY_CODEBOOK, onQuoteClick, onQuoteDoubleClick, onQuoteDelete, onExternalChangePending },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const autosaveRef = useRef<AutosaveController | null>(null);
    const latestMarkdownRef = useRef(content);
    const onChangeRef = useRef(onChange);
    const onSaveRef = useRef(onSave);
    const [version, setVersion] = useState(0);

    onChangeRef.current = onChange;
    onSaveRef.current = onSave;

    // Keep the quote NodeView's shared context (codebook + callbacks) current without
    // rebuilding the schema or remounting the editor — QuoteExtension holds this object
    // by reference (see src/lib/prosemirror/index.ts).
    useEffect(() => {
      quoteViewContext.codebook = codebook;
      quoteViewContext.onQuoteClick = onQuoteClick ?? (() => {});
      quoteViewContext.onQuoteDoubleClick = onQuoteDoubleClick ?? (() => {});
      quoteViewContext.onQuoteDelete = onQuoteDelete ?? (() => {});
      // Force existing quote NodeViews to re-render (e.g. tag colors changed) even
      // though no ProseMirror transaction happened, by dispatching a no-op transaction.
      const view = viewRef.current;
      if (view) view.dispatch(view.state.tr);
    }, [codebook, onQuoteClick, onQuoteDoubleClick, onQuoteDelete]);

    const mount = useCallback((markdown: string) => {
      const container = containerRef.current;
      if (!container) return;

      autosaveRef.current?.dispose();
      viewRef.current?.destroy();
      container.innerHTML = "";

      const autosave = createAutosaveController({
        debounceMs: AUTOSAVE_DEBOUNCE_MS,
        serialize: () => pmSerializer.serialize(viewRef.current!.state.doc),
        onDebouncedChange: (md) => {
          latestMarkdownRef.current = md;
          onChangeRef.current(md);
        },
        onWrite: (md) => {
          latestMarkdownRef.current = md;
          onSaveRef.current(md);
        },
      });
      autosave.noteExternalKnownGood(markdown);
      autosaveRef.current = autosave;
      latestMarkdownRef.current = markdown;

      const doc = pmParser.parse(markdown);

      const view = new EditorView(container, {
        state: EditorState.create({ schema: pmSchema, doc, plugins: buildPlugins() }),
        nodeViews: pmNodeViews,
        attributes: { class: "prose prose-stone max-w-none focus:outline-none px-8 py-6 min-h-full" },
        dispatchTransaction(tr) {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          autosave.onTransaction(tr.docChanged);
          setVersion((v) => v + 1);
        },
        handleClickOn(_view, _pos, _node, _nodePos, event) {
          // Never navigate on link clicks inside the editor — the toolbar's Link button
          // is the intended way to create/edit links.
          const target = event.target as Element | null;
          if (target?.closest?.("a")) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        handleDOMEvents: {
          blur: () => {
            const result = autosave.flushAndWrite("blur");
            if (result.blocked) {
              // eslint-disable-next-line no-console
              console.warn(
                "Autosave blocked: the new content looks suspiciously empty compared to what's saved on disk. Use Save to force it, or Revert."
              );
            }
            return false;
          },
        },
        // Dedicated hook, not handleDOMEvents.drop: this is the one ProseMirror checks
        // BEFORE running its own default drop-slice insertion, and it hands us the
        // pre-parsed `slice`/`moved` PM already computed. handleDOMEvents.drop is a
        // generic catch-all that fires alongside PM's own native drop handling rather
        // than pre-empting it, which was silently fighting with our own insert.
        handleDrop(view, event, _slice, moved) {
          return handleQuoteDrop(view, event, autosave, moved);
        },
      });
      viewRef.current = view;
      setVersion((v) => v + 1);
    }, []);

    // Mount once. `content` at mount time seeds the editor; later prop changes never
    // resync a mounted editor (see onExternalChangePending below) — only an explicit
    // reload() (via the imperative handle) remounts it.
    useEffect(() => {
      mount(content);
      return () => {
        autosaveRef.current?.dispose();
        viewRef.current?.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // An external content change (file watcher, including an echo of our own save) never
    // auto-resyncs the mounted editor — that reset cursor/scroll/undo-history on every
    // autosave in the previous implementation. Just flag it; DocumentWorkspace decides
    // whether to show a "reload?" affordance and calls reload() if the user wants it.
    useEffect(() => {
      if (content === latestMarkdownRef.current) return;
      onExternalChangePending?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    useImperativeHandle(
      ref,
      () => ({
        save: () => {
          autosaveRef.current?.flushAndWrite("manual-save");
        },
        reload: () => {
          mount(content);
        },
        removeQuoteInstances: (target: ParsedQuote) => {
          const view = viewRef.current;
          if (!view) return;
          const positions: number[] = [];
          view.state.doc.descendants((node, pos) => {
            if (node.type.name === "quote" && quotesMatch(quoteFromAttrs(node.attrs as QuoteAttrs), target)) {
              positions.push(pos);
            }
          });
          if (positions.length === 0) return;
          let tr = view.state.tr;
          for (const pos of positions.sort((a, b) => b - a)) {
            const node = tr.doc.nodeAt(pos);
            if (node) tr = tr.delete(pos, pos + node.nodeSize);
          }
          view.dispatch(tr);
          autosaveRef.current?.flushAndWrite("delete");
        },
      }),
      [content, mount]
    );

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {viewRef.current && <EditorToolbar view={viewRef.current} version={version} />}
        <div className="flex-1 min-h-0 overflow-y-auto" ref={containerRef} />
      </div>
    );
  }
);

/**
 * Handles an external drop (a quote-citation line dragged from the transcript panel's
 * QuoteCard). The actual fix for the corruption bug this used to trigger lives in the
 * quote NodeView's ignoreMutation/stopEvent (src/lib/prosemirror/nodes/quote-node-view.tsx)
 * — this handler's own logic is close to what existed before.
 *
 * Deliberately does NOT dedupe against quotes already elsewhere in the document: the
 * same clip is allowed to be cited multiple times in the report (e.g. under different
 * thematic sections), matching how this app's own real documents are actually written.
 */
function handleQuoteDrop(view: EditorView, event: DragEvent, autosave: AutosaveController, moved?: boolean): boolean {
  // An internal drag (moving an existing node within the doc) — let ProseMirror's own
  // native move handling take it, this hook is only for drops originating outside the editor.
  if (moved) return false;

  const data = event.dataTransfer?.getData("text/plain");
  if (!data) return false;

  const droppedLine = data.trim().split("\n")[0];
  const droppedQuote = parseQuote(droppedLine);
  if (!droppedQuote) return false;

  // Suppress the browser's own native drop-insert explicitly, rather than relying solely
  // on returning true from this handler.
  event.preventDefault();

  const quoteNode = view.state.schema.nodes.quote.create({
    text: droppedQuote.text,
    startSeconds: droppedQuote.startSeconds,
    durationSeconds: droppedQuote.durationSeconds,
    sessionIndex: droppedQuote.sessionIndex,
    tags: droppedQuote.tags,
    hidden: droppedQuote.hidden,
  });

  const atCoords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  let insertPos = atCoords?.pos ?? view.state.selection.$anchor.pos;
  // Snap to the nearest valid block boundary — inserting a block atom at a raw
  // posAtCoords result (which can land mid-way through inline text) would otherwise
  // split whatever text is at that position instead of cleanly inserting a new block.
  const slice = new Slice(Fragment.from(quoteNode), 0, 0);
  const fitted = dropPoint(view.state.doc, insertPos, slice);
  if (fitted != null) insertPos = fitted;
  view.dispatch(view.state.tr.insert(insertPos, quoteNode));

  // Silent autosave on drop: serialize + write to disk immediately, bypassing the
  // debounce entirely (not just clearing its pending timer).
  autosave.flushAndWrite("drop");
  return true;
}
