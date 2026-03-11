import React, { useCallback, useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import CodeMirror, { ReactCodeMirrorRef, Extension } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { keymap, EditorView } from "@codemirror/view";
import { parseQuote, parseQuotesFromMarkdown } from "@/lib/quote-parser";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: (content: string) => void;
}

export interface MarkdownEditorHandle {
  save: () => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(function MarkdownEditor({
  content,
  onChange,
  onSave,
}, ref) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestContentRef = useRef(content);
  const [containerHeight, setContainerHeight] = useState<number>(400);
  const [internalContent, setInternalContent] = useState(content);


  // Measure container so CodeMirror gets an explicit pixel height (required for internal scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setContainerHeight(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    save: () => {
      const fromView = editorRef.current?.view?.state.doc.toString();
      onSave(fromView ?? latestContentRef.current ?? content);
    },
  }), [onSave, content]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from prop (file load / watcher). Only this updates internalContent so we only re-render when content prop changes.
  useEffect(() => {
    latestContentRef.current = content;
    setInternalContent(content);
  }, [content]);

  // Handle cleanup of debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleContentChange = useCallback(
    (value: string) => {
      latestContentRef.current = value;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 6000);
    },
    [onChange]
  );

  const handleSaveKey = useCallback(() => {
    const fromView = editorRef.current?.view?.state.doc.toString();
    onSave(fromView ?? latestContentRef.current ?? content);
    return true;
  }, [onSave, content]);

  const saveKeymap: Extension = keymap.of([
    {
      key: "Mod-s",
      run: handleSaveKey,
    },
  ]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      const data = event.dataTransfer.getData("text/plain");
      if (!data || !editorRef.current?.view) return;

      event.preventDefault();

      const view = editorRef.current.view;
      const currentContent = view.state.doc.toString();

      // Dropped data is typically a single quote line; parse to dedupe
      const droppedLine = data.trim().split("\n")[0];
      const droppedQuote = parseQuote(droppedLine);
      if (droppedQuote) {
        const existingQuotes = parseQuotesFromMarkdown(currentContent);
        const alreadyInFile = existingQuotes.some(
          (q) =>
            q.text === droppedQuote.text &&
            q.startSeconds === droppedQuote.startSeconds &&
            q.sessionIndex === droppedQuote.sessionIndex
        );
        if (alreadyInFile) return; // skip insert to avoid duplicate quote line
      }

      const coords = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (coords === null) return;

      const line = view.state.doc.lineAt(coords);
      const insertPos = line.to;
      const textToInsert = "\n\n" + data;

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert: textToInsert },
        selection: { anchor: insertPos + textToInsert.length },
      });
      view.focus();

      const newContent = view.state.doc.toString();
      setInternalContent(newContent);
      onSave(newContent);
    },
    [onSave]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div 
      className="min-h-0 flex-1 w-full border border-gray-200 rounded-md overflow-hidden bg-white flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-testid="markdown-editor-container"
      role="region"
      aria-label="Markdown editor drop zone"
    >
      {/* Ref + ResizeObserver so we pass an explicit pixel height; CodeMirror needs this to enable internal scroll */}
      <div ref={containerRef} className="min-h-0 flex-1 flex flex-col overflow-hidden">
        <CodeMirror
          ref={editorRef}
          value={internalContent}
          height={`${containerHeight}px`}
          width="100%"
        theme="light"
        extensions={[
          markdown({ base: markdownLanguage }),
          EditorView.lineWrapping,
          saveKeymap,
        ]}
        onChange={handleContentChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          dropCursor: true,
        }}
        />
      </div>
    </div>
  );
});
