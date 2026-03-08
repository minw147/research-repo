import React, { useCallback, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef, Extension } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const handleSaveKey = useCallback(() => {
    onSave();
    return true; // indicate that the key event was handled
  }, [onSave]);

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
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });

      if (pos !== null) {
        view.dispatch({
          changes: { from: pos, to: pos, insert: data },
          selection: { anchor: pos + data.length },
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
    >
      <CodeMirror
        ref={editorRef}
        value={content}
        height="100%"
        width="100%"
        theme="light"
        extensions={[
          markdown({ base: markdownLanguage }),
          saveKeymap,
        ]}
        onChange={onChange}
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
