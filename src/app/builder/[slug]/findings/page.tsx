"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels";
import { FileText, Eye, Code, RefreshCw, Loader2 } from "lucide-react";

import { useFileContent } from "@/hooks/useFileContent";
import { useFileWatcher } from "@/hooks/useFileWatcher";
import VideoPlayer, { VideoPlayerRef } from "@/components/builder/VideoPlayer";
import { ClipCreator } from "@/components/builder/ClipCreator";
import { MarkdownEditor } from "@/components/builder/MarkdownEditor";
import { MarkdownRenderer } from "@/components/builder/MarkdownRenderer";
import { parseQuotesFromMarkdown } from "@/lib/quote-parser";
import type { Project, Session, TranscriptLine, Codebook, ParsedQuote } from "@/types";

interface FindingsPageProps {
  params: {
    slug: string;
  };
}

export default function FindingsPage({ params }: FindingsPageProps) {
  const { slug } = params;

  // 1. Fetch Project Metadata
  const [project, setProject] = useState<Project | null>(null);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [activeSecond, setActiveSecond] = useState(0);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch(`/api/projects/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    }
    fetchProject();
  }, [slug]);

  const activeSession = project?.sessions?.[activeSessionIndex];

  // 2. Fetch findings.md
  const {
    content: findingsContent,
    loading: findingsLoading,
    refetch: refetchFindings,
    saveContent: saveFindings,
  } = useFileContent(slug, "findings.md");

  // 3. Fetch active transcript
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    if (!activeSession?.transcriptFile) return;

    async function fetchTranscript() {
      setTranscriptLoading(true);
      try {
        const res = await fetch(
          `/api/files?slug=${slug}&file=transcripts/${activeSession!.transcriptFile}`
        );
        if (res.ok) {
          const data = await res.json();
          // Parse transcript lines: [MM:SS] text
          const lines: TranscriptLine[] = data.content
            .split("\n")
            .filter((l: string) => l.trim())
            .map((line: string) => {
              const match = line.match(/^\[(\d+):(\d+)\] (.*)$/);
              if (match) {
                const mins = parseInt(match[1], 10);
                const secs = parseInt(match[2], 10);
                return {
                  sec: mins * 60 + secs,
                  text: match[3],
                };
              }
              return null;
            })
            .filter(Boolean) as TranscriptLine[];
          setTranscriptLines(lines);
        }
      } catch (err) {
        console.error("Failed to fetch transcript:", err);
      } finally {
        setTranscriptLoading(false);
      }
    }

    fetchTranscript();
  }, [slug, activeSession?.transcriptFile]);

  // 4. File Watcher
  useFileWatcher(slug, (file) => {
    if (file === "findings.md") {
      refetchFindings();
    }
  });

  // 5. Parse quotes from findings.md
  const quotes = useMemo(() => {
    if (!findingsContent) return [];
    return parseQuotesFromMarkdown(findingsContent);
  }, [findingsContent]);

  // Filter quotes for the active session
  const sessionQuotes = useMemo(() => {
    return quotes.filter((q) => q.sessionIndex === activeSessionIndex);
  }, [quotes, activeSessionIndex]);

  // 6. Callbacks
  const handleTimestampClick = useCallback((sec: number) => {
    videoPlayerRef.current?.seekTo(sec);
  }, []);

  const handleQuoteClick = useCallback((quote: ParsedQuote) => {
    videoPlayerRef.current?.playRange(
      quote.startSeconds,
      quote.startSeconds + quote.durationSeconds
    );
  }, []);

  const handleQuoteDoubleClick = useCallback((quote: ParsedQuote) => {
    // TODO: Open edit modal (Phase 2 requirement)
    console.log("Edit quote:", quote);
  }, []);

  const handleSessionChange = useCallback((index: number) => {
    setActiveSessionIndex(index);
    setActiveSecond(0);
  }, []);

  const handleFindingsChange = useCallback(
    (newContent: string) => {
      saveFindings(newContent);
    },
    [saveFindings]
  );

  const handleRefresh = useCallback(() => {
    refetchFindings();
  }, [refetchFindings]);

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
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* LEFT PANE: Video + Transcript */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="flex flex-col h-full bg-white border-r">
            <div className="p-4 bg-white sticky top-0 z-10 border-b">
              <VideoPlayer
                ref={videoPlayerRef}
                sessions={project.sessions}
                activeSessionIndex={activeSessionIndex}
                onSessionChange={handleSessionChange}
                onTimeUpdate={setActiveSecond}
                slug={slug}
              />
            </div>

            <div className="flex-1 overflow-hidden relative">
              {transcriptLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <ClipCreator
                  lines={transcriptLines}
                  quotes={sessionQuotes}
                  codebook={codebook}
                  activeSecond={activeSecond}
                  sessionIndex={activeSessionIndex}
                  onTimestampClick={handleTimestampClick}
                  onQuoteClick={handleQuoteClick}
                  onQuoteDoubleClick={handleQuoteDoubleClick}
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT PANE: Findings Editor */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Toolbar */}
            <div className="h-14 flex items-center justify-between px-6 border-b bg-white">
              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setViewMode("formatted")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "formatted"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Formatted
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "raw"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    Raw
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Manual refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto h-full">
                {findingsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : viewMode === "formatted" ? (
                  <div className="bg-white rounded-xl border p-8 shadow-sm prose prose-slate max-w-none">
                    <MarkdownRenderer
                      content={findingsContent || "# No findings yet"}
                      codebook={codebook}
                      onQuoteClick={handleQuoteClick}
                    />
                  </div>
                ) : (
                  <div className="h-full bg-white rounded-xl border shadow-sm overflow-hidden">
                    <MarkdownEditor
                      content={findingsContent || ""}
                      onChange={handleFindingsChange}
                      onSave={() => handleFindingsChange(findingsContent || "")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
