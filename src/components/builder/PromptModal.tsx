"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { AgentRunner } from "./AgentRunner";
import { Codebook, Project } from "@/types";
import {
  buildAnalyzeTranscriptsPrompt,
  buildAnalyzeFindingsPrompt,
  buildGenerateTagsPrompt,
  buildGenerateReportPrompt,
  buildOtherTemplatePrompt,
  getOtherTemplatesForContext,
  getOtherTemplateTargetFile,
  type OtherTemplateContext,
  type OtherTemplateId,
} from "@/lib/prompts";
import { buildColorThemePrompt, COLOR_THEMES } from "@/lib/color-themes";

export type AIAction =
  | "thematic-transcripts"
  | "thematic-findings"
  | "tagging-findings"
  | "tagging-transcripts"
  | "report-generation"
  | "change-theme"
  | "other-templates";

interface PromptModalProps {
  project: Project;
  codebook: Codebook;
  onClose: () => void;
  initialAction?: AIAction;
  /** Which actions to show. Default: findings-only (Initial, Refine, Suggest Tags). Report page can pass ["report-generation", "other-templates"]. */
  actions?: AIAction[];
  reportStyle?: "blog" | "slides";
  /** Context for "Other templates" (findings, tags, or report). Required when actions include "other-templates". */
  otherTemplateContext?: OtherTemplateContext;
  /** Called when the user clicks "Refresh file" in the AgentRunner. */
  onRefreshFile?: () => void;
}

const FINDINGS_ACTIONS: AIAction[] = ["thematic-transcripts", "thematic-findings", "tagging-findings", "tagging-transcripts", "other-templates"];

function getTargetFile(action: AIAction, selectedTemplateId: OtherTemplateId | null, otherTemplateContext: OtherTemplateContext | undefined): string {
  if (action === "other-templates" && selectedTemplateId && otherTemplateContext) {
    return getOtherTemplateTargetFile(selectedTemplateId, otherTemplateContext);
  }
  if (action === "report-generation" || action === "change-theme") return "findings.html";
  if (action === "tagging-findings" || action === "tagging-transcripts") return "tags.md";
  return "findings.md";
}

export const PromptModal: React.FC<PromptModalProps> = ({
  project,
  codebook,
  onClose,
  initialAction = "thematic-findings",
  actions = FINDINGS_ACTIONS,
  reportStyle = "blog",
  otherTemplateContext = "findings",
  onRefreshFile,
}) => {
  const [selectedAction, setSelectedAction] = useState<AIAction>(() =>
    actions.includes(initialAction) ? initialAction : actions[0]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<OtherTemplateId | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [agentActive, setAgentActive] = useState(false);

  const otherTemplates = otherTemplateContext ? getOtherTemplatesForContext(otherTemplateContext) : [];

  const generatePrompt = useCallback(() => {
    if (selectedAction === "other-templates") {
      if (selectedTemplateId && otherTemplateContext) {
        return buildOtherTemplatePrompt(project, selectedTemplateId, otherTemplateContext, codebook);
      }
      return "";
    }
    if (selectedAction === "change-theme") {
      if (selectedThemeId) {
        const theme = COLOR_THEMES.find((t) => t.id === selectedThemeId);
        return theme ? buildColorThemePrompt(project, theme) : "";
      }
      return "";
    }
    if (selectedAction === "thematic-transcripts") {
      return buildAnalyzeTranscriptsPrompt(project, codebook);
    }
    if (selectedAction === "thematic-findings") {
      return buildAnalyzeFindingsPrompt(project, codebook);
    }
    if (selectedAction === "tagging-findings") {
      return buildGenerateTagsPrompt(project, codebook, "findings");
    }
    if (selectedAction === "tagging-transcripts") {
      return buildGenerateTagsPrompt(project, codebook, "transcripts");
    }
    return buildGenerateReportPrompt(project, reportStyle);
  }, [selectedAction, selectedTemplateId, selectedThemeId, otherTemplateContext, project, codebook, reportStyle]);

  const prompt = generatePrompt();
  const [editablePrompt, setEditablePrompt] = useState(prompt);

  useEffect(() => {
    setEditablePrompt(prompt);
  }, [prompt]);

  const targetFile = getTargetFile(selectedAction, selectedTemplateId, otherTemplateContext);

  const handleCopy = () => {
    navigator.clipboard.writeText(editablePrompt);
    setCopied(true);
    setToast(`Paste into Cursor and run the agent. The AI will create or update \`${targetFile}\`. Refresh this page to see changes.`);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setToast(null), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">AI Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${agentActive ? "max-h-0 !p-0 opacity-0 pointer-events-none" : "p-4 space-y-4"}`}>
          <div className={`grid gap-2 ${actions.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {[
              { id: "thematic-transcripts" as const, label: "Initial Findings", sub: "Create or rewrite findings.md" },
              { id: "thematic-findings" as const, label: "Refine Findings", sub: "Modify findings.md" },
              { id: "tagging-findings" as const, label: "Tag Findings", sub: "Group existing findings by tag" },
              { id: "tagging-transcripts" as const, label: "Tag Transcripts", sub: "Scan all transcripts for tags" },
              { id: "report-generation" as const, label: "AI synthesis", sub: "Generate report" },
              { id: "change-theme" as const, label: "Change color theme", sub: "Pick a palette for the report" },
              { id: "other-templates" as const, label: "Other templates", sub: "Streamline, add question, notes, etc." },
            ]
              .filter(({ id }) => actions.includes(id))
              .map(({ id, label, sub }) => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedAction(id);
                    if (id !== "other-templates") setSelectedTemplateId(null);
                    if (id !== "change-theme") setSelectedThemeId(null);
                  }}
                  className={`p-2.5 rounded-lg border transition-colors duration-200 text-left cursor-pointer ${selectedAction === id
                      ? "border-primary bg-primary/10 text-primary-dark"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                >
                  <span className="block text-xs font-medium leading-tight">{label}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">{sub}</span>
                </button>
              ))}
          </div>

          {selectedAction === "other-templates" && otherTemplates.length > 0 && (
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-2">Choose a template</span>
              <div className="flex flex-wrap gap-2">
                {otherTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`px-3 py-1.5 rounded-lg border text-left transition-colors duration-200 cursor-pointer ${selectedTemplateId === t.id
                        ? "border-primary bg-primary/10 text-primary-dark"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                  >
                    <span className="block text-xs font-medium leading-tight">{t.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedAction === "change-theme" && (
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-2">Choose a theme</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors duration-200 cursor-pointer ${selectedThemeId === theme.id
                        ? "border-primary bg-primary/10 text-primary-dark"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                  >
                    <span className="block text-xs font-medium leading-tight">{theme.name}</span>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {[
                        theme.colors.primary,
                        theme.colors.accent,
                        theme.colors.background,
                        theme.colors.accentLight,
                        theme.colors.text,
                      ].map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-full border border-slate-200 shrink-0"
                          style={{ backgroundColor: hex }}
                          title={hex}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500">Generated prompt</span>
              <span className="text-[10px] text-slate-500">
                {selectedAction === "other-templates" && !selectedTemplateId ? (
                  "Select a template above"
                ) : selectedAction === "change-theme" && !selectedThemeId ? (
                  "Select a theme above"
                ) : (
                  <>Will update <code className="bg-slate-100 px-1 rounded">{targetFile}</code></>
                )}
              </span>
            </div>
            <div className="relative">
              <textarea
                className="w-full min-h-[220px] p-3 pr-24 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-slate-700 resize-y max-h-[50vh]"
                value={(selectedAction === "other-templates" && !selectedTemplateId) || (selectedAction === "change-theme" && !selectedThemeId) ? "" : editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                aria-label="Generated prompt (editable)"
                placeholder={(selectedAction === "other-templates" && !selectedTemplateId) ? "Select a template to generate the prompt…" : (selectedAction === "change-theme" && !selectedThemeId) ? "Select a theme to generate the prompt…" : "Edit the prompt before copying…"}
                disabled={(selectedAction === "other-templates" && !selectedTemplateId) || (selectedAction === "change-theme" && !selectedThemeId)}
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={(selectedAction === "other-templates" && !selectedTemplateId) || (selectedAction === "change-theme" && !selectedThemeId)}
                className="absolute top-2 right-10 p-1.5 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">How it works:</span>{" "}
              {(selectedAction === "other-templates" && !selectedTemplateId) ? (
                "Select a template above to generate the prompt."
              ) : (selectedAction === "change-theme" && !selectedThemeId) ? (
                "Select a theme above to generate the prompt."
              ) : (
                <>
                  <span className="font-medium text-slate-600">▶ Run in Agent</span> — runs the prompt directly using your local{" "}
                  <code className="bg-slate-100 px-1 rounded">claude</code> CLI and streams output here.{" "}
                  <span className="font-medium text-slate-600">Copy</span> — paste into Cursor or another AI tool manually.{" "}
                  Either way the AI will create or update{" "}
                  <code className="bg-slate-100 px-1 rounded">{targetFile}</code>.
                </>
              )}
            </p>
            {toast && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary-dark"
              >
                {toast}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 shrink-0">
          <AgentRunner
            prompt={(selectedAction === "other-templates" && !selectedTemplateId) || (selectedAction === "change-theme" && !selectedThemeId) ? "" : editablePrompt}
            onRefreshFile={onRefreshFile ?? (() => {})}
            onRunStateChange={setAgentActive}
            sideActions={
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors duration-200 cursor-pointer"
              >
                Done
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
};
