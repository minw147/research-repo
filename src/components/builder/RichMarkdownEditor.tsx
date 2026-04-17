"use client";

import React, { useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import { Fragment, Slice } from "@tiptap/pm/model";
import { dropPoint } from "@tiptap/pm/transform";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Table as BaseTable,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import { EditorToolbar } from "@/components/builder/EditorToolbar";
import { QuoteExtension } from "@/lib/tiptap/quote-extension";
import { CalloutExtension } from "@/lib/tiptap/callout-extension";
import { preprocessMarkdownForEditor } from "@/lib/tiptap/markdown-bridge";
import { parseQuote, parseQuotesFromMarkdown, formatQuoteAsMarkdown } from "@/lib/quote-parser";
import type { ParsedQuote, Codebook } from "@/types";
import { Columns, Rows, Trash2 } from "lucide-react";

function TableHoverControls({ editor }: { editor: Editor }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(editor.isActive("table"));
    update();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const canAddRow = editor.can().addRowAfter?.() ?? false;
  const canAddCol = editor.can().addColumnAfter?.() ?? false;
  const canDelRow = editor.can().deleteRow?.() ?? false;
  const canDelCol = editor.can().deleteColumn?.() ?? false;

  const show = active;

  return (
    <div
      className={[
        "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20",
        "opacity-0 transition-opacity duration-150",
        show ? "opacity-100" : "",
        "group-hover:opacity-100",
      ].join(" ")}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur px-1.5 py-1">
        <button
          type="button"
          disabled={!canAddRow}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addRowAfter().run();
          }}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canAddRow ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
          ].join(" ")}
          title="Add row"
        >
          <Rows className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!canDelRow}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().deleteRow().run();
          }}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canDelRow ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
          ].join(" ")}
          title="Delete row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-200 mx-0.5" aria-hidden />

        <button
          type="button"
          disabled={!canAddCol}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addColumnAfter().run();
          }}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canAddCol ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
          ].join(" ")}
          title="Add column"
        >
          <Columns className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!canDelCol}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().deleteColumn().run();
          }}
          className={[
            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
            canDelCol ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
          ].join(" ")}
          title="Delete column"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TableNodeView({ editor }: { editor: Editor }) {
  return (
    <NodeViewWrapper className="relative group my-4">
      <TableHoverControls editor={editor} />
      <div className="overflow-x-auto">
        <NodeViewContent as="table" />
      </div>
    </NodeViewWrapper>
  );
}

interface RichMarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: (content: string) => void;
  codebook?: Codebook;
  onQuoteClick?: (q: ParsedQuote) => void;
  onQuoteDoubleClick?: (q: ParsedQuote) => void;
  onQuoteDelete?: (q: ParsedQuote) => void;
}

export interface RichMarkdownEditorHandle {
  save: () => void;
}

const EMPTY_CODEBOOK: Codebook = { tags: [], categories: [] };

export const RichMarkdownEditor = forwardRef<RichMarkdownEditorHandle, RichMarkdownEditorProps>(
  function RichMarkdownEditor(
    { content, onChange, onSave, codebook = EMPTY_CODEBOOK, onQuoteClick, onQuoteDoubleClick, onQuoteDelete },
    ref
  ) {
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const latestMarkdownRef = useRef<string>(content);
    /** Set in onCreate so handleDrop can call tiptap-markdown after dispatch (editorProps only receive EditorView). */
    const tiptapEditorRef = useRef<Editor | null>(null);

    const getMarkdown = useCallback((editor: ReturnType<typeof useEditor>) => {
      if (!editor) return latestMarkdownRef.current;
      const storage = editor.storage as unknown as { markdown: { getMarkdown: () => string } };
      return storage.markdown.getMarkdown();
    }, []);

    const triggerOnChange = useCallback(
      (md: string) => {
        latestMarkdownRef.current = md;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          onChange(md);
        }, 1500);
      },
      [onChange]
    );

    const Table = useMemo(() => BaseTable.extend({
      addNodeView() {
        return ReactNodeViewRenderer((props) => <TableNodeView editor={props.editor as unknown as Editor} />);
      },
      addStorage() {
        return {
          markdown: {
            serialize(
              state: { write: (s: string) => void; ensureNewLine: () => void; closeBlock: (n: unknown) => void },
              node: {
                childCount: number;
                child: (i: number) => { childCount: number; child: (j: number) => { textContent: string } };
              }
            ) {
              const escapeCell = (text: string) =>
                text.replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, " ").trim();

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
            },
            parse: {},
          },
        };
      },
    }).configure({ resizable: false }), []);

    const editor = useEditor({
      immediatelyRender: false,
      onCreate({ editor: ed }) {
        tiptapEditorRef.current = ed;
      },
      onDestroy() {
        tiptapEditorRef.current = null;
      },
      extensions: [
        StarterKit.configure({
          // We supply heading/list/etc via StarterKit defaults
          codeBlock: false, // avoid conflict with our markdown code block handling
        }),
        Placeholder.configure({ placeholder: "Start writing your findings…" }),
        Table,
        TableRow,
        TableCell,
        TableHeader,
        // tiptap-markdown bundles `table` + `link` and related markdown parsing/serialization.
        // Avoid registering duplicates (can make tables appear as plain text lines and become non-editable).
        Markdown.configure({ html: true, tightLists: true, bulletListMarker: "-", linkify: false }),
        QuoteExtension.configure({
          codebook,
          onQuoteClick: onQuoteClick ?? (() => {}),
          onQuoteDoubleClick: onQuoteDoubleClick ?? (() => {}),
          onQuoteDelete: onQuoteDelete ?? (() => {}),
        }),
        CalloutExtension,
      ],
      content: preprocessMarkdownForEditor(content),
      editorProps: {
        attributes: {
          class:
            "prose prose-slate max-w-none focus:outline-none px-8 py-6 min-h-full",
        },
        handleClick(_view, _pos, event) {
          // Never navigate on link clicks inside the editor.
          // The toolbar is the intended way to create/edit links.
          const target = event.target as Element | null;
          const link = target?.closest?.("a");
          if (link) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        handleDrop(view, event, _slice, moved) {
          if (moved) return false;
          const data = event.dataTransfer?.getData("text/plain");
          if (!data) return false;

          const droppedLine = data.trim().split("\n")[0];
          const droppedQuote = parseQuote(droppedLine);
          if (!droppedQuote) return false;

          // Deduplicate against existing doc quotes
          const currentMd = latestMarkdownRef.current;
          const existing = parseQuotesFromMarkdown(currentMd);
          const alreadyPresent = existing.some(
            (q) =>
              q.text === droppedQuote.text &&
              q.startSeconds === droppedQuote.startSeconds &&
              q.sessionIndex === droppedQuote.sessionIndex
          );
          if (alreadyPresent) return true;

          const quoteNode = view.state.schema.nodes.quote.create({
            text: droppedQuote.text,
            startSeconds: droppedQuote.startSeconds,
            durationSeconds: droppedQuote.durationSeconds,
            sessionIndex: droppedQuote.sessionIndex,
            tags: droppedQuote.tags,
            hidden: droppedQuote.hidden,
          });
          const slice = new Slice(Fragment.from(quoteNode), 0, 0);

          // Prefer drop coordinates; when null (common during DnD), use caret — not doc end.
          const atCoords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          let insertPos = atCoords?.pos ?? view.state.selection.$anchor.pos;
          const fitted = dropPoint(view.state.doc, insertPos, slice);
          if (fitted != null) insertPos = fitted;

          view.dispatch(view.state.tr.insert(insertPos, quoteNode));

          // Serialize full document — never append a quote line to the file string (that forced inserts to the end).
          const ed = tiptapEditorRef.current;
          if (ed?.view === view) {
            const storage = ed.storage as unknown as { markdown: { getMarkdown: () => string } };
            const md = storage.markdown.getMarkdown();
            latestMarkdownRef.current = md;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            onSave(md);
          } else {
            const md = formatQuoteAsMarkdown(
              droppedQuote.text,
              droppedQuote.startSeconds,
              droppedQuote.durationSeconds,
              droppedQuote.sessionIndex,
              droppedQuote.tags,
              droppedQuote.hidden
            );
            const updated = `${currentMd}\n\n${md}`;
            latestMarkdownRef.current = updated;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            onSave(updated);
          }
          return true;
        },
      },
      onUpdate({ editor: ed }) {
        const md = getMarkdown(ed);
        triggerOnChange(md);
      },
    });

    // Sync content from prop (file watcher / external load)
    const prevContentRef = useRef(content);
    useEffect(() => {
      if (!editor || content === prevContentRef.current) return;
      prevContentRef.current = content;
      latestMarkdownRef.current = content;
      editor.commands.setContent(preprocessMarkdownForEditor(content));
    }, [content, editor]);

    // Expose save() to parent (DocumentWorkspace toolbar save button)
    useImperativeHandle(
      ref,
      () => ({
        save: () => {
          const md = editor ? getMarkdown(editor) : latestMarkdownRef.current;
          onSave(md);
        },
      }),
      [editor, getMarkdown, onSave]
    );

    // Cleanup debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, []);

    if (!editor) return null;

    return (
      <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden">
        <EditorToolbar editor={editor} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  }
);
