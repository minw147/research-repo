"use client";
import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
  signal?: boolean;
}

const HISTORY_KEY = "ra-history";
const SESSION_KEY = "ra-session-id";
const RING_SIZE = 50;

// ─── Ring buffer helpers ───────────────────────────────────────────────────────

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs));
}

function appendToRing(msgs: ChatMessage[], next: ChatMessage): ChatMessage[] {
  const updated = [...msgs, next];
  if (updated.length > RING_SIZE) {
    console.warn("[ra] ring buffer evicted oldest message");
    return updated.slice(updated.length - RING_SIZE);
  }
  return updated;
}

// ─── Tier 1 context builder ───────────────────────────────────────────────────

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_TIER1_BYTES = 50_000;

export function buildTier1Context(opts: {
  profileContent: string | null;
  pathname: string;
  history: ChatMessage[];
}): string {
  const parts: string[] = [];

  if (opts.profileContent) {
    // Cap researcher.md at 2000 Unicode chars
    const profCapped = [...opts.profileContent].slice(0, 2000).join("");
    parts.push(`<researcher_profile>\n${profCapped}\n</researcher_profile>`);
  }

  parts.push(`<page_context>${opts.pathname}</page_context>`);

  // Last 10 non-signal messages
  const recent = opts.history
    .filter((m) => !m.signal)
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  if (recent) {
    parts.push(`<recent_messages>\n${recent}\n</recent_messages>`);
  }

  return parts.join("\n\n");
}

/** Sanitize user input: escape signal-looking prefixes so the bot can't be tricked. */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/\[DOCUMENT_HABIT:/g, "\\[DOCUMENT_HABIT:")
    .replace(/\[SUPPRESS_PATTERN:/g, "\\[SUPPRESS_PATTERN:");
}

/** Return true if the message is a bot signal (not shown in UI). */
export function isSignalMessage(content: string): boolean {
  return (
    content.startsWith("[DOCUMENT_HABIT:") ||
    content.startsWith("[SUPPRESS_PATTERN:")
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseResearchChatOptions {
  profileContent: string | null;
  pathname: string;
}

export function useResearchChat({ profileContent, pathname }: UseResearchChatOptions) {
  const [history, setHistory] = useState<ChatMessage[]>(() => loadHistory());
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getSessionId = useCallback((): string | null => {
    const id = localStorage.getItem(SESSION_KEY);
    return id && SESSION_ID_RE.test(id) ? id : null;
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setHistory((prev) => {
      const next = appendToRing(prev, msg);
      saveHistory(next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (rawInput: string) => {
      const sanitized = sanitizeUserInput(rawInput.trim());
      if (!sanitized) return;

      setConnectionError(null);

      const tier1 = buildTier1Context({ profileContent, pathname, history });

      // Measure total prompt size; trim if needed
      let contextPrefix = tier1 ? `${tier1}\n\n---\n\n` : "";
      const combined = contextPrefix + sanitized;
      const byteLen = new TextEncoder().encode(combined).length;
      if (byteLen > MAX_TIER1_BYTES) {
        // Trim: drop history first, then truncate profile
        const minimalContext = buildTier1Context({
          profileContent: profileContent
            ? [...profileContent].slice(0, 500).join("")
            : null,
          pathname,
          history: [],
        });
        contextPrefix = minimalContext ? `${minimalContext}\n\n---\n\n` : "";
      }

      const fullPrompt = contextPrefix + sanitized;

      // Add user message to history
      const userMsg: ChatMessage = { role: "user", content: rawInput, ts: Date.now() };
      addMessage(userMsg);

      const sessionId = getSessionId();
      const body: Record<string, unknown> = { prompt: fullPrompt };
      if (sessionId) body.sessionId = sessionId;

      setStreaming(true);
      setStreamingContent("");

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let newSessionId: string | null = null;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "system" && event.session_id) {
                newSessionId = event.session_id;
                if (SESSION_ID_RE.test(newSessionId!)) {
                  localStorage.setItem(SESSION_KEY, newSessionId!);
                }
              }

              if (event.type === "assistant" && event.message?.content) {
                for (const block of event.message.content) {
                  if (block.type === "text") {
                    accumulated += block.text;
                    setStreamingContent(accumulated);
                  }
                }
              }

              if (event.type === "error") {
                // Dead session: clear sessionId, start fresh next time
                localStorage.removeItem(SESSION_KEY);
                throw new Error(event.message ?? "Agent error");
              }
            } catch (parseErr) {
              if ((parseErr as Error).message !== "Unexpected token") {
                throw parseErr;
              }
            }
          }
        }

        if (accumulated) {
          const signal = isSignalMessage(accumulated);
          const botMsg: ChatMessage = {
            role: "assistant",
            content: accumulated,
            ts: Date.now(),
            ...(signal ? { signal: true } : {}),
          };
          addMessage(botMsg);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setConnectionError(
            err instanceof Error ? err.message : "Connection lost"
          );
        }
      } finally {
        setStreaming(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [profileContent, pathname, history, addMessage, getSessionId]
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SESSION_KEY);
    setHistory([]);
    setConnectionError(null);
  }, []);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Visible messages: filter signal messages from UI
  const visibleHistory = history.filter((m) => !m.signal);

  return {
    history,
    visibleHistory,
    streaming,
    streamingContent,
    connectionError,
    sendMessage,
    clearHistory,
    cancelStream,
  };
}
