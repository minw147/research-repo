"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { useAgentSettings } from "@/hooks/useAgentSettings";
import type { AgentSettings } from "@/lib/agent-settings";

interface AgentRunnerProps {
  prompt: string;
  onRefreshFile: () => void;
  /** Extra buttons rendered on the right side of the controls row (e.g. a Done button). */
  sideActions?: React.ReactNode;
  /** Called whenever the run state changes — lets the parent collapse/expand content. */
  onRunStateChange?: (isActive: boolean) => void;
}

type RunState = "idle" | "running" | "done" | "error";

type LogEntry =
  | { kind: "text"; content: string }
  | { kind: "tool"; name: string; summary: string }
  | { kind: "stderr"; content: string }
  | { kind: "info"; content: string };

function AgentSettingsPanel({
  settings,
  onSave,
}: {
  settings: AgentSettings;
  onSave: (s: AgentSettings) => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 space-y-2">
      <label className="block text-xs font-medium text-slate-600">CLI tool</label>
      <select
        className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        value={settings.cli}
        onChange={(e) =>
          onSave({ ...settings, cli: e.target.value as AgentSettings["cli"] })
        }
      >
        <option value="claude">Claude Code (claude)</option>
        <option value="custom">Custom CLI</option>
      </select>
      {settings.cli === "custom" && (
        <>
          <label className="block text-xs font-medium text-slate-600 mt-2">
            Command template — use {"{prompt}"} as placeholder
          </label>
          <input
            value={settings.customTemplate ?? ""}
            onChange={(e) =>
              onSave({ ...settings, customTemplate: e.target.value })
            }
            placeholder="opencode run {prompt}"
            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          />
        </>
      )}
    </div>
  );
}

export function AgentRunner({ prompt, onRefreshFile, sideActions, onRunStateChange }: AgentRunnerProps) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [logLines, setLogLines] = useState<LogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { settings, save } = useAgentSettings();

  useEffect(() => {
    if (typeof logEndRef.current?.scrollIntoView === "function") {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logLines]);

  const runAgent = useCallback(
    async (promptText: string, resumeId?: string) => {
      setRunState("running");
      setLogLines([]);
      onRunStateChange?.(true);
      const abort = new AbortController();
      abortRef.current = abort;
      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText, sessionId: resumeId }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error ?? `Agent run failed (HTTP ${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "text")
                setLogLines((p) => [...p, { kind: "text", content: evt.content }]);
              if (evt.type === "tool")
                setLogLines((p) => [...p, { kind: "tool", name: evt.name, summary: evt.summary }]);
              if (evt.type === "session") setSessionId(evt.id);
              if (evt.type === "done") setRunState("done");
              if (evt.type === "error") {
                setLogLines((p) => [...p, { kind: "stderr", content: `Error: ${evt.message}` }]);
                setRunState("error");
              }
            } catch {
              /* skip */
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setLogLines((p) => [...p, { kind: "info", content: "Stopped." }]);
          setRunState("idle");
          onRunStateChange?.(false);
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        setLogLines((p) => [...p, { kind: "stderr", content: message }]);
        setRunState("error");
      }
    },
    []
  );

  const handleSendFollowUp = useCallback(() => {
    const text = followUp.trim();
    if (!text || !sessionId) return;
    setFollowUp("");
    runAgent(text, sessionId);
  }, [followUp, sessionId, runAgent]);

  const isActive = runState !== "idle";

  return (
    <div className="flex flex-col">
      {/* Settings panel — expands above controls */}
      {showSettings && (
        <AgentSettingsPanel settings={settings} onSave={save} />
      )}

      {/* Output log — expands above controls when active */}
      {isActive && (
        <div className="border-t border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-3 py-1.5 text-xs text-slate-400 flex justify-between items-center">
            <span>Agent output</span>
            <div className="flex items-center gap-3">
              {runState === "running" && (
                <div className="flex items-center gap-2">
                  <span className="animate-pulse text-green-400">● Running...</span>
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="px-2 py-0.5 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              )}
              {(runState === "done" || runState === "error") && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshFile}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh file
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={() => {
                      setRunState("idle");
                      setLogLines([]);
                      setSessionId(null);
                      abortRef.current = null;
                      onRunStateChange?.(false);
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Run again
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 font-mono text-xs p-3 max-h-48 overflow-y-auto">
            {logLines.map((entry, i) => (
              <div key={i}>
                {entry.kind === "tool" ? (
                  <span className="text-slate-400">
                    <span className="text-yellow-500">⚙</span>{" "}
                    <span className="text-yellow-400">{entry.name}</span>
                    {entry.summary ? (
                      <span className="text-slate-500"> {entry.summary}</span>
                    ) : null}
                  </span>
                ) : entry.kind === "stderr" ? (
                  <span className="text-red-400">{entry.content}</span>
                ) : entry.kind === "info" ? (
                  <span className="text-slate-500 italic">{entry.content}</span>
                ) : (
                  <span className="text-green-300">{entry.content}</span>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Follow-up input — inline below log when session available */}
          {runState === "done" && sessionId && (
            <div className="bg-slate-900 border-t border-slate-700 px-3 pb-2 flex gap-2">
              <input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && followUp.trim()) handleSendFollowUp();
                }}
                placeholder="Follow-up message..."
                className="flex-1 text-xs bg-slate-800 text-slate-200 border border-slate-600 rounded px-2 py-1.5 focus:outline-none focus:border-primary placeholder:text-slate-500"
              />
              <button
                onClick={handleSendFollowUp}
                disabled={!followUp.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Controls row — always visible at bottom */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => runAgent(prompt)}
            disabled={runState === "running"}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {runState === "running" ? "Running..." : "▶ Run in Agent"}
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="CLI settings"
            className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer ${
              showSettings
                ? "bg-primary/10 text-primary"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
        {sideActions && <div>{sideActions}</div>}
      </div>
    </div>
  );
}
