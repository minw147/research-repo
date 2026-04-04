"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useResearcherProfile } from "@/hooks/useResearcherProfile";
import { useResearchChat } from "@/hooks/useResearchChat";
import { usePatternDetector, type PatternNudgeState } from "@/hooks/usePatternDetector";
import { ResearchAssistantChat } from "./ResearchAssistantChat";
import { ResearchOnboarding } from "./ResearchOnboarding";
import { ResearchAssistantSettings } from "./ResearchAssistantSettings";
import { PatternNudge } from "./PatternNudge";

/** Parse bot name from researcher.md content. */
function parseBotName(content: string | null): string {
  if (!content) return "Sage";
  const match = content.match(/^- Bot name:\s*(.+)$/m);
  return match?.[1]?.trim() || "Sage";
}

/** Parse preferred name from researcher.md content. */
function parsePreferredName(content: string | null): string {
  if (!content) return "";
  const match = content.match(/^- Preferred name:\s*(.+)$/m);
  return match?.[1]?.trim() || "";
}

/** Parse suppressed patterns list from researcher.md. */
function parseSuppressed(content: string | null): string[] {
  if (!content) return [];
  const section = content.match(/## Suppressed Patterns([\s\S]*?)(?=^##|\z)/m)?.[1] ?? "";
  return [...section.matchAll(/^- keyword:\s*(.+)$/gm)].map((m) => m[1].trim());
}

/** Build a fresh blank researcher.md content from onboarding data. */
function buildProfileContent(data: {
  name: string;
  preferredName: string;
  role: string;
  botName: string;
}): string {
  return `# Researcher Profile

## Identity
- Name: ${data.name}
- Preferred name: ${data.preferredName}
- Role: ${data.role}
- Bot name: ${data.botName}

## Work Scope
<!-- What kinds of research do you do? Products, industries, methods? -->

## Research Habits
<!-- Documented by the bot over time. Example:
- Cross-references prior sessions at the start of each new session (3x observed)
-->

## Suppressed Patterns
<!-- Patterns the bot should stop asking to document. Format:
- keyword: cross-reference sessions
- keyword: compare with previous
-->

## References
<!-- Paths the bot should know about but not load by default -->
- data/research-index.json
- (add product/company background files here)

## Notes
<!-- Anything else you want the bot to know -->
`;
}

type CliStatus = "checking" | "ok" | "error";

export function ResearchAssistantBot() {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nudge, setNudge] = useState<PatternNudgeState | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [cliStatus, setCliStatus] = useState<CliStatus>("checking");
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { profile, state, save, reload, invalidateCache } = useResearcherProfile();

  const profileContent = profile?.content ?? null;
  const botName = parseBotName(profileContent);
  const preferredName = parsePreferredName(profileContent);
  const suppressed = parseSuppressed(profileContent);

  const chat = useResearchChat({ profileContent, pathname });

  const handleNudge = useCallback((s: PatternNudgeState) => setNudge(s), []);
  const { analyze, resetCounts } = usePatternDetector({
    sessionId: chat.history[chat.history.length - 1]?.ts.toString() ?? "default",
    suppressed,
    onNudge: handleNudge,
  });

  // Analyze each new user message for patterns
  useEffect(() => {
    const lastMsg = chat.history[chat.history.length - 1];
    if (lastMsg?.role === "user") {
      analyze(lastMsg.content);
    }
  }, [chat.history, analyze]);

  // Mount portal target
  useEffect(() => {
    const el = document.getElementById("ra-portal");
    if (el) setPortalEl(el);
  }, []);

  // CLI health check on mount
  useEffect(() => {
    fetch("/api/agent/health")
      .then((r) => r.json())
      .then((data) => {
        setCliStatus(data.ok ? "ok" : "error");
        setCliVersion(data.version ?? null);
      })
      .catch(() => setCliStatus("error"));
  }, []);

  // Apply/remove docked body class so pages can respond
  useEffect(() => {
    if (docked && open) {
      document.body.classList.add("ra-docked");
    } else {
      document.body.classList.remove("ra-docked");
    }
    return () => document.body.classList.remove("ra-docked");
  }, [docked, open]);

  // Escape key closes panel
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Focus panel on open
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  async function handleOnboardingComplete(data: Parameters<typeof buildProfileContent>[0]) {
    const content = buildProfileContent(data);
    const ok = await save(content);
    if (!ok) {
      setSaveError(true);
    }
  }

  function handleDocumentNudge() {
    if (!nudge || !profileContent) return;
    const newContent = profileContent.replace(
      /## Research Habits\n/,
      `## Research Habits\n- ${nudge.label} (observed)\n`
    );
    save(newContent);
    setNudge(null);
  }

  function handleSuppressNudge() {
    if (!nudge || !profileContent) return;
    const newContent = profileContent.replace(
      /## Suppressed Patterns\n/,
      `## Suppressed Patterns\n- keyword: ${nudge.keyword}\n`
    );
    save(newContent);
    setNudge(null);
  }

  function handleSettingsSave(newPreferredName: string, newBotName: string) {
    if (!profileContent) return;
    let updated = profileContent
      .replace(/^- Preferred name:.*$/m, `- Preferred name: ${newPreferredName}`)
      .replace(/^- Bot name:.*$/m, `- Bot name: ${newBotName}`);
    save(updated);
  }

  function handleResetProfile() {
    invalidateCache();
    setSaveError(false);
    setShowSettings(false);
    reload();
  }

  function handleClearHistory() {
    chat.clearHistory();
    resetCounts();
  }

  if (!portalEl) return null;

  const panelClass = docked && open
    ? "fixed right-0 top-0 z-[9999] flex h-screen w-[380px] flex-col border-l border-slate-200 bg-white shadow-xl"
    : "relative flex h-[500px] w-[100vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:w-[min(400px,100vw-3rem)]";

  return createPortal(
    <div className={docked && open ? "contents" : "fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3"}>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="ra-bot-name"
          aria-modal="true"
          tabIndex={-1}
          className={panelClass}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-3 py-2">
            <div className="flex items-center gap-2">
              {state === "loading" ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
              <h2
                id="ra-bot-name"
                className="text-sm font-semibold text-slate-900"
              >
                {botName}
                {preferredName ? ` — Hi, ${preferredName}` : ""}
              </h2>
            </div>
            <div className="flex items-center gap-0.5">
              {/* CLI status — dot only, tooltip carries the detail */}
              <span
                title={
                  cliStatus === "checking"
                    ? "Checking Claude Code CLI…"
                    : cliStatus === "ok"
                    ? `Claude Code CLI ready${cliVersion ? ` — ${cliVersion}` : ""}`
                    : "Claude Code CLI not found — check PATH"
                }
                className="flex h-7 w-7 items-center justify-center"
              >
                <span className={`h-2 w-2 rounded-full ${
                  cliStatus === "ok"
                    ? "bg-emerald-400"
                    : cliStatus === "error"
                    ? "bg-red-400"
                    : "bg-slate-300 animate-pulse"
                }`} />
              </span>
              {/* Dock toggle — panel-right icon */}
              <button
                onClick={() => setDocked((v) => !v)}
                aria-label={docked ? "Float panel" : "Dock to sidebar"}
                title={docked ? "Float panel" : "Dock to right sidebar"}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {docked ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="1" y="1" width="12" height="12" rx="1.5" />
                    <line x1="5" y1="1" x2="5" y2="13" />
                    <path d="M8 5l2 2-2 2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="1" y="1" width="12" height="12" rx="1.5" />
                    <line x1="9" y1="1" x2="9" y2="13" />
                    <rect x="9.5" y="1" width="3.5" height="12" rx="0" fill="currentColor" stroke="none" opacity="0.15" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Settings"
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="4" x2="12" y2="4" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                  <line x1="2" y1="10" x2="12" y2="10" />
                  <circle cx="9" cy="4" r="1.5" fill="white" />
                  <circle cx="5" cy="7" r="1.5" fill="white" />
                  <circle cx="8" cy="10" r="1.5" fill="white" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>
          </div>

          {/* Context strip */}
          {state === "ready" && (
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-1 text-[10px] text-slate-400">
              {pathname}
            </div>
          )}

          {/* Pattern nudge */}
          {nudge && (
            <PatternNudge
              nudge={nudge}
              onDocument={handleDocumentNudge}
              onDismiss={() => setNudge(null)}
              onNever={handleSuppressNudge}
            />
          )}

          {/* Body */}
          <div className="relative flex-1 overflow-hidden">
            {state === "loading" && (
              <div className="flex h-full items-center justify-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {(state === "onboarding") && (
              <ResearchOnboarding
                onComplete={handleOnboardingComplete}
                saveError={saveError}
              />
            )}

            {(state === "ready" || state === "error") && (
              <ResearchAssistantChat
                visibleHistory={chat.visibleHistory}
                streaming={chat.streaming}
                streamingContent={chat.streamingContent}
                connectionError={
                  state === "error"
                    ? "Couldn't load researcher profile — chat is still available."
                    : chat.connectionError
                }
                botName={botName}
                onSend={chat.sendMessage}
                onClear={handleClearHistory}
                onRetry={() => chat.sendMessage("")}
              />
            )}

            {/* Settings overlay */}
            {showSettings && (
              <ResearchAssistantSettings
                preferredName={preferredName}
                botName={botName}
                onSave={handleSettingsSave}
                onClose={() => setShowSettings(false)}
                onResetProfile={handleResetProfile}
              />
            )}
          </div>
        </div>
      )}

      {/* FAB — hidden when docked (panel is always visible on the side) */}
      {!docked && (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close research assistant" : "Open research assistant"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white"
        >
          {open ? "✕" : "✦"}
        </button>
      )}
    </div>,
    portalEl
  );
}
