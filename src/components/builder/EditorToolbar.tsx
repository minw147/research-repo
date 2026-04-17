"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Code, Link2, List, ListOrdered, Quote,
  Heading, Table, Minus, Undo, Redo, ChevronDown,
  Info, Lightbulb, AlertTriangle, Sparkles,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
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
          ? "bg-primary/15 text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-slate-200 mx-0.5" aria-hidden />;
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLevel = [1, 2, 3].find((l) => editor.isActive("heading", { level: l }));

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
          activeLevel ? "bg-primary/15 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        ].join(" ")}
      >
        <Heading className="h-3.5 w-3.5" />
        {activeLevel ? activeLevel : ""}
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[80px]">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
                setOpen(false);
              }}
              className={[
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer",
                editor.isActive("heading", { level }) ? "text-primary font-semibold" : "text-slate-700",
              ].join(" ")}
            >
              <span className="font-bold" style={{ fontSize: 18 - (level - 1) * 3 }}>H{level}</span>
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setParagraph().run();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Normal
          </button>
        </div>
      )}
    </div>
  );
}

function CalloutDropdown({ editor }: { editor: Editor }) {
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

  const isActive = editor.isActive("callout");

  function insertCallout(type: string) {
    editor.chain().focus()
      .insertContent({
        type: "callout",
        attrs: { calloutType: type },
        content: [{ type: "paragraph" }],
      })
      .run();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Callout"
        className={[
          "flex items-center gap-0.5 h-7 px-1.5 rounded text-xs font-semibold transition-colors cursor-pointer",
          isActive ? "bg-primary/15 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        ].join(" ")}
      >
        <Info className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
          {types.map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertCallout(type); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
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

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  function normalizeHref(input: string): string | null {
    const raw = input.trim();
    if (!raw) return null;

    // Common incomplete protocols that browsers normalize weirdly (e.g. https:// -> https:)
    if (raw === "https://" || raw === "http://" || raw === "https:" || raw === "http:") return null;

    const withProtocol = (() => {
      if (/^https?:\/\//i.test(raw)) return raw;
      if (/^www\./i.test(raw)) return `https://${raw}`;
      // If user typed a scheme without slashes, try to fix it.
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

  useEffect(() => {
    function close(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function openPopover() {
    const prev = editor.getAttributes("link").href as string | undefined;
    setValue(prev ?? "");
    setOpen(true);
  }

  function apply() {
    const href = normalizeHref(value);
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setOpen(false);
  }

  function remove() {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <ToolbarButton onClick={openPopover} active={editor.isActive("link")} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[320px] rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                normalizeHref(value) ? "bg-primary text-white hover:bg-primary/90" : "bg-slate-100 text-slate-400 cursor-not-allowed",
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
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Remove link
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
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

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b bg-slate-50/80 min-h-[40px]">
      {/* History */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <HeadingDropdown editor={editor} />

      <Divider />

      {/* Inline formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <LinkButton editor={editor} />

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Blocks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <CalloutDropdown editor={editor} />
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert table"
      >
        <Table className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
