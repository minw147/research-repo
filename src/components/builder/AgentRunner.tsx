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
}

type RunState = "idle" | "running" | "done" | "error";

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

export function AgentRunner({ prompt, onRefreshFile, sideActions }: AgentRunnerProps) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
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
      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText, sessionId: resumeId }),
        });
        if (!res.ok || !res.body) throw new Error("Agent run failed");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "text") setLogLines((p) => [...p, evt.content]);
              if (evt.type === "session") setSessionId(evt.id);
              if (evt.type === "done") setRunState("done");
              if (evt.type === "error") {
                setLogLines((p) => [...p, `Error: ${evt.message}`]);
                setRunState("error");
              }
            } catch {
              /* skip */
            }
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setLogLines((p) => [...p, message]);
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
                <span className="animate-pulse text-green-400">● Running...</span>
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
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Run again
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 text-green-300 font-mono text-xs p-3 max-h-48 overflow-y-auto">
            {logLines.map((line, i) => (
              <div key={i}>{line}</div>
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
