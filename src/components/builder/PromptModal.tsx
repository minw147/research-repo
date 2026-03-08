"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Sparkles, Copy, Check, Plus, Terminal, AlertCircle } from "lucide-react";
import { Codebook, Project } from "@/types";
import {
  buildAnalyzeTranscriptsPrompt,
  buildAnalyzeFindingsPrompt,
  buildGenerateTagsPrompt,
} from "@/lib/prompts";

interface PromptModalProps {
  project: Project;
  codebook: Codebook;
  onAppend: (content: string) => void;
  onClose: () => void;
}

type AIAction = "thematic-transcripts" | "thematic-findings" | "tagging";

export const PromptModal: React.FC<PromptModalProps> = ({
  project,
  codebook,
  onAppend,
  onClose,
}) => {
  const projectSlug = project.id;
  const [selectedAction, setSelectedAction] = useState<AIAction>("thematic-findings");
  const [isDetecting, setIsDetecting] = useState(true);
  const [cliAvailable, setCliAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Detect Claude CLI on mount
  useEffect(() => {
    async function detectCLI() {
      try {
        const res = await fetch("/api/ai/detect");
        const data = await res.json();
        setCliAvailable(data.available);
      } catch (err) {
        console.error("Failed to detect Claude CLI:", err);
        setCliAvailable(false);
      } finally {
        setIsDetecting(false);
      }
    }
    detectCLI();
  }, []);

  // 2. Generate Prompt based on action
  const generatePrompt = useCallback(() => {
    if (selectedAction === "thematic-transcripts") {
      return buildAnalyzeTranscriptsPrompt(project, codebook);
    } else if (selectedAction === "thematic-findings") {
      return buildAnalyzeFindingsPrompt(project, codebook);
    } else {
      return buildGenerateTagsPrompt(project, codebook, "findings");
    }
  }, [selectedAction, project, codebook]);

  const prompt = generatePrompt();

  // 3. Handle Run with Claude
  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          projectSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to run analysis");
      
      setResult(data.output);
    } catch (err: any) {
      console.error("AI Run Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAppend = () => {
    if (result) {
      onAppend(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Analysis</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Generate insights from your findings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Selection */}
          {!result && !isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedAction("thematic-transcripts")}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedAction === "thematic-transcripts"
                      ? "border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <h3 className={`font-bold text-xs ${selectedAction === "thematic-transcripts" ? "text-indigo-700" : "text-slate-700"}`}>
                    Initial Findings
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Analyze raw transcripts to generate initial themes.
                  </p>
                </button>
                <button
                  onClick={() => setSelectedAction("thematic-findings")}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedAction === "thematic-findings"
                      ? "border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <h3 className={`font-bold text-xs ${selectedAction === "thematic-findings" ? "text-indigo-700" : "text-slate-700"}`}>
                    Refine Findings
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Analyze existing findings to identify key patterns.
                  </p>
                </button>
                <button
                  onClick={() => setSelectedAction("tagging")}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedAction === "tagging"
                      ? "border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <h3 className={`font-bold text-xs ${selectedAction === "tagging" ? "text-indigo-700" : "text-slate-700"}`}>
                    Suggest Tags
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Analyze excerpts and suggest codebook tags.
                  </p>
                </button>
              </div>

              {/* Prompt Preview / Fallback */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Generated Prompt
                  </label>
                  {!cliAvailable && !isDetecting && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      CLI Not Detected
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <textarea
                    readOnly
                    className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-600 resize-none"
                    value={prompt}
                  />
                  {!cliAvailable && (
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs font-medium text-slate-600"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                  )}
                </div>
                {!cliAvailable && !isDetecting && (
                  <p className="text-xs text-slate-500 italic">
                    Claude CLI was not detected. Copy the prompt above and run it in your terminal, then paste the results back here.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900">Claude is analyzing...</h3>
                <p className="text-sm text-slate-500">This may take a moment depending on the amount of data.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-900">Analysis Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRun}
                  className="mt-3 text-sm font-bold text-red-900 underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Result Preview */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Analysis Result
                </label>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                  Complete
                </span>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-lg prose prose-slate prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {result ? "Discard" : "Cancel"}
          </button>
          
          {!result && !isLoading && cliAvailable && (
            <button
              onClick={handleRun}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              Run with Claude
            </button>
          )}

          {result && (
            <button
              onClick={handleAppend}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Append to Findings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
