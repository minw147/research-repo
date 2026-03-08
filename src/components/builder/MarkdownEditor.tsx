import React, { useCallback, useRef, useState, useEffect } from "react";
import CodeMirror, { ReactCodeMirrorRef, Extension } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: (content: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [internalContent, setInternalContent] = useState(content);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with content prop (e.g. from file watcher)
  useEffect(() => {
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
      setInternalContent(value);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 2000);
    },
    [onChange]
  );

  const handleSaveKey = useCallback(() => {
    onSave(internalContent);
    return true; // indicate that the key event was handled
  }, [onSave, internalContent]);

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
      const coords = view.posAtCoords({ x: event.clientX, y: event.clientY });

      if (coords !== null) {
        // Snap to line end
        const line = view.state.doc.lineAt(coords);
        const insertPos = line.to;

        // Ensure there is a newline before the quote
        const textToInsert = "\n\n" + data;

        view.dispatch({
          changes: { from: insertPos, to: insertPos, insert: textToInsert },
          selection: { anchor: insertPos + textToInsert.length },
        });
        view.focus();
      }
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div 
      className="h-full w-full border border-gray-200 rounded-md overflow-hidden bg-white"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-testid="markdown-editor-container"
      role="region"
      aria-label="Markdown editor drop zone"
    >
      <CodeMirror
        ref={editorRef}
        value={internalContent}
        height="100%"
        width="100%"
        theme="light"
        extensions={[
          markdown({ base: markdownLanguage }),
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
  );
};
