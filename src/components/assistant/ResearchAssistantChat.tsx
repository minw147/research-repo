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
          <p className="text-center text-xs text-amber-700 mt-4">
            Ask {botName} anything about your research.
          </p>
        )}

        {visibleHistory.map((msg, i) => (
          <MessageBubble key={i} msg={msg} botName={botName} />
        ))}

        {streaming && (
          <div
            aria-busy="true"
            className="max-w-[85%] self-start rounded-lg bg-[#1c1108] px-3 py-2"
          >
            {streamingContent ? (
              <p className="text-sm text-amber-100 italic opacity-60 whitespace-pre-wrap">
                {streamingContent}
              </p>
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}

        {connectionError && (
          <div role="alert" className="rounded border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-400">
            Connection lost —{" "}
            <button
              onClick={onRetry}
              className="underline hover:text-amber-200"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="border-t border-[#4a3520]/60 px-3 py-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={streaming}
            className="min-h-[44px] flex-1 resize-none rounded border border-[#4a3520] bg-[#1c1108] px-3 py-2 text-sm text-amber-50 placeholder:text-amber-900/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            aria-label="Send message"
            className="min-h-[44px] min-w-[44px] rounded bg-primary px-3 text-white hover:bg-primary/90 disabled:opacity-40 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
          >
            ↑
          </button>
        </div>
        <button
          onClick={onClear}
          className="mt-1 text-xs text-amber-700 hover:text-amber-500 focus:ring-2 focus:ring-primary"
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
            ? "bg-primary/80 text-white"
            : "bg-[#1c1108] text-amber-100"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
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
          className="h-1.5 w-1.5 rounded-full bg-amber-400/60 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
