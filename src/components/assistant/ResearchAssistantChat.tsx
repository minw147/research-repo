"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/hooks/useResearchChat";

const PLACEHOLDERS = [
  "Ask about trends…",
  "Cross-reference sessions…",
  "Find participant quotes…",
];

interface ResearchAssistantChatProps {
  visibleHistory: ChatMessage[];
  streaming: boolean;
  streamingContent: string;
  connectionError: string | null;
  botName: string;
  onSend: (text: string) => void;
  onClear: () => void;
  onRetry: () => void;
}

export function ResearchAssistantChat({
  visibleHistory,
  streaming,
  streamingContent,
  connectionError,
  botName,
  onSend,
  onClear,
  onRetry,
}: ResearchAssistantChatProps) {
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length),
      3000
    );
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [visibleHistory, streamingContent]);

  function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    onSend(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
      >
        {visibleHistory.length === 0 && !streaming && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Ask {botName} anything about your research.
          </p>
        )}

        {visibleHistory.map((msg, i) => (
          <MessageBubble key={i} msg={msg} botName={botName} />
        ))}

        {streaming && (
          <div
            aria-busy="true"
            className="max-w-[85%] self-start rounded-lg bg-slate-50 px-3 py-2"
          >
            {streamingContent ? (
              <p className="text-sm text-slate-600 italic opacity-70 whitespace-pre-wrap">
                {streamingContent}
              </p>
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}

        {connectionError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Connection lost —{" "}
            <button
              onClick={onRetry}
              className="underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="border-t border-slate-100 px-3 py-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={streaming}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            aria-label="Send message"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-primary px-3 text-white hover:bg-primary-dark disabled:opacity-40 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            ↑
          </button>
        </div>
        <button
          onClick={onClear}
          className="mt-1 text-xs text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary"
        >
          Clear history
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, botName }: { msg: ChatMessage; botName: string }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-white"
            : "bg-slate-50 text-slate-900 border border-slate-100"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {botName}
          </p>
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
