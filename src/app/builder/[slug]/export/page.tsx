"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useFileContent } from "@/hooks/useFileContent";
import { parseQuotesFromMarkdown } from "@/lib/quote-parser";
import { CheckCircle, Play, FileText, Download, Loader2, AlertCircle } from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const slug = params.slug as string;

  // We primarily export from report.mdx, falling back to findings.md if needed
  const { content: reportMdx, loading: loadingReport } = useFileContent(slug, "report.mdx");
  const { content: findingsMd, loading: loadingFindings } = useFileContent(slug, "findings.md");

  const [slicingStatus, setSlicingStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [sliceProgress, setSliceProgress] = useState(0);
  const [sliceError, setSliceError] = useState<string | null>(null);

  const [exportStatus, setExportStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeContent = reportMdx || findingsMd || "";
  
  const quotes = useMemo(() => {
    const parsed = parseQuotesFromMarkdown(activeContent);
    
    // Also extract from <Clip /> components
    const clipMatches = activeContent.matchAll(/<Clip\s+(.*?)\s*\/>/g);
    for (const match of clipMatches) {
      const attrs = match[1];
      const getAttr = (name: string) => {
        const m = attrs.match(new RegExp(`${name}=["{](.*?)["}]`));
        return m ? m[1] : null;
      };
      
      const startStr = getAttr('start');
      const startSec = startStr ? parseInt(startStr, 10) : 0;
      const durStr = getAttr('duration') || getAttr('clipDuration');
      const durationSec = durStr ? parseInt(durStr, 10) : 20;
      const sessStr = getAttr('sessionIndex');
      const sessionIndex = sessStr ? parseInt(sessStr, 10) : 1;
      
      // Only add if not already present (based on session and start)
      if (!parsed.some(q => q.sessionIndex === sessionIndex && q.startSeconds === startSec)) {
        parsed.push({
          text: getAttr('label') || "Clip",
          timestampDisplay: "", // Not needed for slicing
          startSeconds: startSec,
          durationSeconds: durationSec,
          sessionIndex: sessionIndex,
          tags: [],
          rawLine: match[0]
        });
      }
    }
    
    return parsed;
  }, [activeContent]);

  const handleSlice = async () => {
    if (quotes.length === 0) {
      setSliceError("No clips found in report or findings.");
      setSlicingStatus("error");
      return;
    }

    setSlicingStatus("running");
    setSliceProgress(0);
    setSliceError(null);

    try {
      const response = await fetch("/api/export/slice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, quotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to slice clips");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
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
              if (data.current && data.total) {
                setSliceProgress((data.current / data.total) * 100);
              }
              if (data.error) {
                setSliceError(data.error);
                setSlicingStatus("error");
              }
              if (data.done) {
                setSlicingStatus("success");
                setSliceProgress(100);
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    } catch (err: any) {
      setSliceError(err.message);
      setSlicingStatus("error");
    }
  };

  const handleExportHtml = async () => {
    setExportStatus("running");
    setExportError(null);

    try {
      const res = await fetch("/api/export/html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reportMdx: activeContent, quotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate HTML report");
      }

      const data = await res.json();
      setExportPath(data.path);
      setExportStatus("success");
    } catch (err: any) {
      setExportError(err.message);
      setExportStatus("error");
    }
  };

  if (loadingReport && loadingFindings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Finalize & Export</h1>
        <p className="text-slate-500">Turn your research findings into a portable HTML report with video evidence.</p>
      </header>

      <div className="space-y-6">
        {/* Step 1: Slice Video Clips */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                slicingStatus === "success" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
              }`}>
                {slicingStatus === "success" ? <CheckCircle className="h-5 w-5" /> : "1"}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Slice Video Clips</h2>
                <p className="text-sm text-slate-500">Extract {quotes.length} clips as standalone MP4 files.</p>
              </div>
            </div>
            <button
              onClick={handleSlice}
              disabled={slicingStatus === "running"}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {slicingStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {slicingStatus === "success" ? "Re-slice Clips" : "Start Slicing"}
            </button>
          </div>

          {slicingStatus === "running" && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div 
                  className="h-full bg-slate-900 transition-all duration-500" 
                  style={{ width: `${sliceProgress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400 font-medium">Processing video segments... (this may take a minute)</p>
            </div>
          )}

          {slicingStatus === "error" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{sliceError}</span>
            </div>
          )}

          {slicingStatus === "success" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Successfully sliced {quotes.length} clips to project folder.</span>
            </div>
          )}
        </section>

        {/* Step 2: Generate HTML Report */}
        <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-opacity ${
          slicingStatus !== "success" ? "opacity-60" : ""
        }`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                exportStatus === "success" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
              }`}>
                {exportStatus === "success" ? <CheckCircle className="h-5 w-5" /> : "2"}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Generate HTML Report</h2>
                <p className="text-sm text-slate-500">Create a self-contained HTML file with embedded clips.</p>
              </div>
            </div>
            <button
              onClick={handleExportHtml}
              disabled={exportStatus === "running" || slicingStatus !== "success"}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {exportStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {exportStatus === "success" ? "Regenerate HTML" : "Generate HTML"}
            </button>
          </div>

          {exportStatus === "error" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{exportError}</span>
            </div>
          )}

          {exportStatus === "success" && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>HTML report ready! You can find it in <code>content/projects/{slug}/export/index.html</code>.</span>
              </div>
              
              <div className="flex gap-3">
                <a
                  href={`/api/projects/${slug}/files/export/index.html`}
                  target="_blank"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  Preview Exported HTML
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Info Box */}
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <h3 className="mb-1 font-semibold text-slate-900">Pro Tip</h3>
          <p>The exported <code>/export</code> folder is fully portable. You can zip it and share it with stakeholders, and they'll be able to watch the clips right in their browser.</p>
        </div>
      </div>
    </div>
  );
}
