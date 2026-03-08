"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels";
import { 
  FileText, 
  RefreshCw, 
  Loader2, 
  Sparkles, 
  Save, 
  FileEdit, 
  Presentation, 
  Layout, 
  Check,
  AlertCircle
} from "lucide-react";

import { useFileContent } from "@/hooks/useFileContent";
import { MarkdownEditor } from "@/components/builder/MarkdownEditor";
import { MarkdownRenderer } from "@/components/builder/MarkdownRenderer";
import { PromptModal } from "@/components/builder/PromptModal";
import type { Project, Codebook } from "@/types";

interface ReportPageProps {
  params: {
    slug: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const { slug } = params;

  // 1. State
  const [project, setProject] = useState<Project | null>(null);
  const [reportStyle, setReportStyle] = useState<"blog" | "slides">("blog");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // 2. Fetch Project Metadata
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
      }
    }
    fetchProject();
  }, [slug]);

  // 3. Fetch report.mdx
  const {
    content: reportContent,
    loading: reportLoading,
    error: reportError,
    refetch: refetchReport,
    saveContent: saveReport,
  } = useFileContent(slug, "report.mdx");

  // 4. Callbacks
  const handleReportChange = useCallback(
    (newContent: string) => {
      // Just update local state if we had one, but useFileContent handles it
      // For now we'll just save on every change or on save button
    },
    []
  );

  const handleSave = useCallback(async (newContent?: string) => {
    const contentToSave = newContent !== undefined ? newContent : reportContent;
    if (contentToSave === null) return;
    setSaveStatus("saving");
    try {
      await saveReport(contentToSave);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [reportContent, saveReport]);

  const handleRefresh = useCallback(() => {
    refetchReport();
  }, [refetchReport]);

  const handleAiReplace = useCallback(
    (newContent: string) => {
      saveReport(newContent);
    },
    [saveReport]
  );

  // Mock codebook (will be fetched from project/global in Phase 4)
  const codebook: Codebook = project?.codebookData || {
    tags: [],
    categories: [],
  };

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header / Toolbar */}
      <div className="h-16 flex items-center justify-between px-6 border-b bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="font-bold text-slate-900 tracking-tight">Report Builder</h1>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setReportStyle("blog")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                reportStyle === "blog"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileEdit className="h-3.5 w-3.5" />
              Blog Post
            </button>
            <button
              onClick={() => setReportStyle("slides")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                reportStyle === "slides"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Presentation className="h-3.5 w-3.5" />
              Slide Deck
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-200"
          >
            <Sparkles className="h-4 w-4" />
            AI Synthesis
          </button>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
              saveStatus === "success" 
                ? "bg-green-50 border-green-200 text-green-600" 
                : saveStatus === "error"
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === "success" ? (
              <Check className="h-4 w-4" />
            ) : saveStatus === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save"}
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Manual refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Split Pane */}
      <div className="flex-1 overflow-hidden">
        {reportLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : reportError ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Report</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              We couldn't load report.mdx. Make sure the file exists in your project directory.
            </p>
            <button
              onClick={handleRefresh}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-white">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileEdit className="h-3 w-3" />
                    Editor
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MarkdownEditor
                    content={reportContent || ""}
                    onChange={saveReport}
                    onSave={handleSave}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-slate-50">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layout className="h-3 w-3" />
                    Preview
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-3xl mx-auto bg-white rounded-xl border p-12 shadow-sm prose prose-slate max-w-none">
                    <MarkdownRenderer
                      content={reportContent || "# Report Draft\n\nStart writing your report or use AI Synthesis to generate one."}
                      codebook={codebook}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {showPromptModal && (
        <PromptModal
          project={project}
          codebook={codebook}
          initialAction="report-generation"
          mode="replace"
          reportStyle={reportStyle}
          onAppend={handleAiReplace}
          onClose={() => setShowPromptModal(false)}
        />
      )}
    </div>
  );
}
