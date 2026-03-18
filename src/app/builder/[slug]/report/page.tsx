"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { RefreshCw, Loader2, Sparkles, AlertCircle, Download, ExternalLink } from "lucide-react";

import { useFileContent } from "@/hooks/useFileContent";
import { PromptModal } from "@/components/builder/PromptModal";
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";
import { mergeCodebooks } from "@/lib/codebook";
import type { Project, Codebook } from "@/types";

interface ReportPageProps {
  params: {
    slug: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const { slug } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);

  const [exportStatus, setExportStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [hasExport, setHasExport] = useState(false);
  const lastExportContentRef = useRef<string | null>(null);

  const [globalCodebook, setGlobalCodebook] = useState<Codebook | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  }, [slug]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    async function fetchExportExists() {
      try {
        const res = await fetch(
          `/api/files?slug=${encodeURIComponent(slug)}&file=${encodeURIComponent("export/index.html")}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setHasExport(data.content !== null);
      } catch {
        // ignore
      }
    }
    fetchExportExists();
  }, [slug]);

  useEffect(() => {
    async function fetchGlobalCodebook() {
      try {
        const res = await fetch("/api/codebook/global");
        if (!res.ok) return;
        const data = await res.json();
        setGlobalCodebook(data);
      } catch (err) {
        console.error("Error fetching global codebook:", err);
      }
    }
    fetchGlobalCodebook();
  }, []);

  const {
    content: reportContent,
    loading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useFileContent(slug, "findings.html");

  const isExportStale =
    reportContent &&
    lastExportContentRef.current !== null &&
    lastExportContentRef.current !== reportContent;

  useEffect(() => {
    if (!reportLoading && (reportError || !reportContent)) {
      setShowPromptModal(true);
    }
  }, [reportLoading, reportError, reportContent]);

  const handleModalClose = useCallback(() => {
    setShowPromptModal(false);
    setShowRefreshToast(true);
    setTimeout(() => setShowRefreshToast(false), 6000);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchReport();
  }, [refetchReport]);

  const handleExport = useCallback(async () => {
    if (!reportContent) return;
    setExportStatus("running");
    setExportProgress(0);
    setExportError(null);

    try {
      const res = await fetch("/api/export/portable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.current != null && data.total) {
                setExportProgress((data.current / data.total) * 100);
              }
              if (data.error) {
                setExportError(data.error);
                setExportStatus("error");
                return;
              }
              if (data.done) {
                setExportStatus("success");
                setExportProgress(100);
                lastExportContentRef.current = reportContent;
                setHasExport(true);
                fetchProject();
                window.open(`/api/projects/${slug}/files/export/index.html`, "_blank");
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Export failed");
      setExportStatus("error");
    }
  }, [slug, reportContent, fetchProject]);

  const handleViewExport = useCallback(() => {
    window.open(`/api/projects/${slug}/files/export/index.html`, "_blank");
  }, [slug]);

  const codebook: Codebook = useMemo(
    () =>
      mergeCodebooks(
        globalCodebook ?? { tags: [], categories: [] },
        project?.codebookData ?? null
      ),
    [globalCodebook, project?.codebookData]
  );

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <WorkspaceNav slug={slug} />
      {/* Header / Toolbar */}
      <div className="h-12 flex items-center justify-end gap-1.5 px-4 sm:px-6 border-b border-slate-200 bg-white shrink-0 shadow-sm">
        <button
          onClick={() => setShowPromptModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors duration-200 shadow-sm cursor-pointer"
          title="Run AI Synthesis"
          aria-label="Run AI Synthesis"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>AI Synthesis</span>
        </button>

        {reportContent && (
          <button
            onClick={handleExport}
            disabled={exportStatus === "running"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export portable HTML with sliced clips"
            aria-label="Export HTML"
          >
            {exportStatus === "running" ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>Export HTML</span>
          </button>
        )}

        {hasExport && (
          <button
            onClick={handleViewExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors duration-200 cursor-pointer"
            title="Open exported HTML in new tab"
            aria-label="View Export"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span>View Export</span>
          </button>
        )}

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors duration-200 cursor-pointer"
          title="Refresh to load changes"
          aria-label="Refresh to load changes"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stale export notice */}
      {isExportStale && (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm font-medium text-amber-900 shrink-0"
        >
          Report has changed since last export. Click <strong>Export HTML</strong> to update.
        </div>
      )}

      {/* Export error */}
      {exportError && (
        <div
          role="alert"
          className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-900 shrink-0 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {exportError}
        </div>
      )}

      {/* Toast: Refresh reminder */}
      {showRefreshToast && (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-slate-900 shrink-0"
        >
          Refresh the page once the AI agent is done to view the generated findings.html
        </div>
      )}

      {/* Main Content: Full-width HTML preview or empty state */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {reportLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reportError ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Report</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              We couldn&apos;t load findings.html. Use AI Synthesis to generate it, or try refreshing.
            </p>
            <button
              onClick={() => setShowPromptModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/20 mb-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Report
            </button>
            <button
              onClick={handleRefresh}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors duration-200 rounded-lg px-3 py-2"
            >
              Refresh
            </button>
          </div>
        ) : !reportContent ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="p-4 bg-primary/10 text-primary rounded-full mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Report Yet</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              Generate a report from your findings using AI Synthesis. The AI will create findings.html with video clips and styling.
            </p>
            <button
              onClick={() => setShowPromptModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        ) : (
          <iframe
            srcDoc={reportContent}
            title="Report preview"
            className="flex-1 w-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts"
          />
        )}
      </div>

      {showPromptModal && (
        <PromptModal
          project={project}
          codebook={codebook}
          initialAction="report-generation"
          actions={["report-generation", "change-theme", "other-templates"]}
          reportStyle="blog"
          otherTemplateContext="report"
          onClose={handleModalClose}
          onRefreshFile={refetchReport}
        />
      )}
    </div>
  );
}
