"use client";

import React, { useState, useRef, useEffect } from "react";
import type { EditorView } from "prosemirror-view";
import {
  Bold, Italic, Code, Link2, List, ListOrdered, Quote,
  Heading, Table, Minus, Undo, Redo, ChevronDown,
  Info, Lightbulb, AlertTriangle, Sparkles,
} from "lucide-react";
import { undo, redo } from "prosemirror-history";
import {
  isMarkActive,
  isNodeActive,
  isNodeActiveAnyAncestor,
  toggleHeading,
  setParagraph,
  toggleBold,
  toggleItalic,
  toggleCode,
  toggleBulletList,
  toggleOrderedList,
  toggleBlockquote,
  insertCallout,
  insertTable,
  setHorizontalRule,
  setLink,
  unsetLink,
} from "@/lib/prosemirror/commands";

interface EditorToolbarProps {
  view: EditorView;
  /** Bumped by the parent on every dispatched transaction, forcing this toolbar to
   * re-evaluate active/disabled state — there is no more `editor.on("transaction")`
   * event emitter with a raw EditorView. */
  version: number;
}

function ToolbarButton({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={[
        "flex items-center justify-center h-7 w-7 rounded transition-colors duration-100 cursor-pointer",
        active
          ? "bg-[#e6f3fe] text-[#0075de]"
          : "text-black/54 hover:bg-black/[.08] hover:text-black",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-black/[.08] mx-0.5" aria-hidden />;
}

function runCommand(view: EditorView, cmd: (state: EditorView["state"], dispatch: EditorView["dispatch"]) => boolean) {
  cmd(view.state, view.dispatch);
  view.focus();
}

function HeadingDropdown({ view }: { view: EditorView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLevel = [1, 2, 3].find((l) => isNodeActive(view.state, view.state.schema.nodes.heading, { level: l }));

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Heading"
        className={[
          "flex items-center gap-0.5 h-7 px-1.5 rounded text-xs font-semibold transition-colors cursor-pointer",
          activeLevel ? "bg-[#e6f3fe] text-[#0075de]" : "text-black/54 hover:bg-black/[.08] hover:text-black",
        ].join(" ")}
      >
        <Heading className="h-3.5 w-3.5" />
        {activeLevel ? activeLevel : ""}
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-black/[.08] rounded-lg shadow-dialog py-1 z-50 min-w-[80px]">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                runCommand(view, toggleHeading(level as 1 | 2 | 3));
                setOpen(false);
              }}
              className={[
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-black/[.04] cursor-pointer",
                isNodeActive(view.state, view.state.schema.nodes.heading, { level }) ? "text-primary font-semibold" : "text-slate-700",
              ].join(" ")}
            >
              <span className="font-bold" style={{ fontSize: 18 - (level - 1) * 3 }}>H{level}</span>
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              runCommand(view, setParagraph());
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-black/[.04] cursor-pointer"
          >
            Normal
          </button>
        </div>
      )}
    </div>
  );
}

function CalloutDropdown({ view }: { view: EditorView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const types: { type: string; label: string; Icon: React.ElementType }[] = [
    { type: "info", label: "Info", Icon: Info },
    { type: "tip", label: "Tip", Icon: Lightbulb },
    { type: "warning", label: "Warning", Icon: AlertTriangle },
    { type: "insight", label: "Insight", Icon: Sparkles },
  ];

  const isActive = isNodeActiveAnyAncestor(view.state, view.state.schema.nodes.callout);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Callout"
        className={[
          "flex items-center gap-0.5 h-7 px-1.5 rounded text-xs font-semibold transition-colors cursor-pointer",
          isActive ? "bg-[#e6f3fe] text-[#0075de]" : "text-black/54 hover:bg-black/[.08] hover:text-black",
        ].join(" ")}
      >
        <Info className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-black/[.08] rounded-lg shadow-dialog py-1 z-50 min-w-[120px]">
          {types.map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                runCommand(view, insertCallout(type));
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-black/[.04] cursor-pointer"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Pure — no ProseMirror dependency. Ported unchanged. */
export function normalizeHref(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (raw === "https://" || raw === "http://" || raw === "https:" || raw === "http:") return null;

  const withProtocol = (() => {
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^www\./i.test(raw)) return `https://${raw}`;
    if (/^https?:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
      const rest = raw.replace(/^https?:/i, "");
      return `${raw.slice(0, raw.indexOf(":") + 1)}//${rest.replace(/^\/+/, "")}`;
    }
    return `https://${raw}`;
  })();

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function LinkButton({ view }: { view: EditorView }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function openPopover() {
    const { $from } = view.state.selection;
    const linkMark = view.state.schema.marks.link.isInSet($from.marks());
    setValue((linkMark?.attrs.href as string) ?? "");
    setOpen(true);
  }

  function apply() {
    const href = normalizeHref(value);
    if (!href) return;
    runCommand(view, setLink(href));
    setOpen(false);
  }

  function remove() {
    runCommand(view, unsetLink());
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <ToolbarButton onClick={openPopover} active={isMarkActive(view.state, view.state.schema.marks.link)} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[320px] rounded-xl border border-black/[.08] bg-white shadow-dialog p-2">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-8 rounded-lg border border-black/[.08] bg-white px-2 text-sm text-slate-900 placeholder:text-black/54 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://example.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                apply();
              }}
              disabled={!normalizeHref(value)}
              className={[
                "h-8 px-3 rounded-lg text-sm font-semibold transition-colors",
                normalizeHref(value) ? "bg-primary text-white hover:bg-primary/90" : "bg-black/[.08] text-black/54 cursor-not-allowed",
              ].join(" ")}
            >
              Apply
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                remove();
              }}
              className="text-xs font-semibold text-black/54 hover:text-black"
            >
              Remove link
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="text-xs font-semibold text-black/54 hover:text-black"
            >
              Close
            </button>
          </div>
          {!normalizeHref(value) && value.trim() !== "" && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              Enter a full URL like <span className="font-mono">https://example.com</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({ view }: EditorToolbarProps) {
  const { state } = view;
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b bg-[#f6f5f4]/80 min-h-[40px]">
      <ToolbarButton onClick={() => runCommand(view, undo)} disabled={!undo(state)} title="Undo">
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => runCommand(view, redo)} disabled={!redo(state)} title="Redo">
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <HeadingDropdown view={view} />

      <Divider />

      <ToolbarButton onClick={() => runCommand(view, toggleBold())} active={isMarkActive(state, state.schema.marks.strong)} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => runCommand(view, toggleItalic())} active={isMarkActive(state, state.schema.marks.em)} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => runCommand(view, toggleCode())} active={isMarkActive(state, state.schema.marks.code)} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <LinkButton view={view} />

      <Divider />

      <ToolbarButton
        onClick={() => runCommand(view, toggleBulletList())}
        active={isNodeActiveAnyAncestor(state, state.schema.nodes.bullet_list)}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(view, toggleOrderedList())}
        active={isNodeActiveAnyAncestor(state, state.schema.nodes.ordered_list)}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => runCommand(view, toggleBlockquote())}
        active={isNodeActiveAnyAncestor(state, state.schema.nodes.blockquote)}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <CalloutDropdown view={view} />
      <ToolbarButton onClick={() => runCommand(view, insertTable(3, 3, true))} title="Insert table">
        <Table className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => runCommand(view, setHorizontalRule())} title="Horizontal rule">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
