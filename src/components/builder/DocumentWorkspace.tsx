"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Eye, Code, RefreshCw, Loader2, Sparkles, Save, RotateCcw, Tag, Settings, X, ArrowRight } from "lucide-react";

import { useFileContent } from "@/hooks/useFileContent";
import { useFileWatcher } from "@/hooks/useFileWatcher";
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";
import VideoPlayer, { VideoPlayerRef } from "@/components/builder/VideoPlayer";
import { ClipCreator, type ClipCreatorHandle } from "@/components/builder/ClipCreator";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/builder/MarkdownEditor";
import { MarkdownRenderer } from "@/components/builder/MarkdownRenderer";
import { QuoteEditModal } from "@/components/builder/QuoteEditModal";
import { CodebookEditor } from "@/components/builder/CodebookEditor";
import { PromptModal, type AIAction } from "@/components/builder/PromptModal";
import { ProjectEmptyState } from "@/components/projects/ProjectEmptyState";
import { AddSessionModal } from "@/components/projects/AddSessionModal";
import { parseQuotesFromMarkdown, parseQuote, formatQuoteAsMarkdown } from "@/lib/quote-parser";
import { parseTranscript } from "@/lib/transcript";
import { mergeCodebooks } from "@/lib/codebook";
import type { Project, Session, TranscriptLine, Codebook, ParsedQuote } from "@/types";

type DocumentType = "findings.md" | "tags.md";

interface DocumentWorkspaceProps {
    slug: string;
    defaultFile?: DocumentType;
}

export function DocumentWorkspace({ slug, defaultFile = "findings.md" }: DocumentWorkspaceProps) {
    const [activeFile, setActiveFile] = useState<DocumentType>(defaultFile);

    // 1. Fetch Project Metadata
    const [project, setProject] = useState<Project | null>(null);
    const [activeSessionIndex, setActiveSessionIndex] = useState(0);
    const [activeSecond, setActiveSecond] = useState(0);
    const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
    const [editingQuote, setEditingQuote] = useState<ParsedQuote | null>(null);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [showAddSessionModal, setShowAddSessionModal] = useState(false);
    const [showCodebookModal, setShowCodebookModal] = useState(false);
    const [showTaggingNudge, setShowTaggingNudge] = useState(false);

    const videoPlayerRef = useRef<VideoPlayerRef>(null);
    const markdownEditorRef = useRef<MarkdownEditorHandle>(null);
    const clipCreatorRef = useRef<ClipCreatorHandle>(null);
    const lastSaveRef = useRef<number>(0);

    const [globalCodebook, setGlobalCodebook] = useState<Codebook | null>(null);

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

    const activeSession = project?.sessions?.[activeSessionIndex];

    // 2. Fetch active markdown file
    const {
        content: docContent,
        loading: docLoading,
        error: docError,
        refetch: refetchDoc,
        saveContent: saveDoc,
    } = useFileContent(slug, activeFile);

    // 3. Fetch active transcript
    const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptError, setTranscriptError] = useState<string | null>(null);

    useEffect(() => {
        if (!activeSession?.transcriptFile) return;

        async function fetchTranscript() {
            setTranscriptLoading(true);
            setTranscriptError(null);
            try {
                const res = await fetch(
                    `/api/files?slug=${slug}&file=transcripts/${activeSession!.transcriptFile}`
                );
                if (!res.ok) throw new Error("Failed to fetch transcript");
                const data = await res.json();
                if (data.content == null || data.content === "") {
                    setTranscriptError("Transcript file not found or empty.");
                    setTranscriptLines([]);
                } else {
                    const parsed = parseTranscript(data.content);
                    setTranscriptLines(parsed);
                    if (parsed.length === 0) {
                        setTranscriptError("No lines with timestamps. Use [MM:SS] or [HH:MM:SS] at the start of each line.");
                    }
                }
            } catch (err: unknown) {
                console.error("Failed to fetch transcript:", err);
                setTranscriptError(err instanceof Error ? err.message : "Failed to fetch transcript");
            } finally {
                setTranscriptLoading(false);
            }
        }

        fetchTranscript();
    }, [slug, activeSession]);

    // 4. File Watcher
    useFileWatcher(slug, useCallback((file: string) => {
        if (file !== activeFile) return;
        if (Date.now() - lastSaveRef.current < 5000) return;
        refetchDoc();
    }, [activeFile, refetchDoc]));

    // 5. Parse quotes from active doc
    const quotes = useMemo(() => {
        if (!docContent) return [];
        return parseQuotesFromMarkdown(docContent);
    }, [docContent]);

    // Filter quotes for the active session
    const sessionQuotes = useMemo(() => {
        return quotes.filter((q) => q.sessionIndex === activeSessionIndex + 1 && !q.hidden);
    }, [quotes, activeSessionIndex]);

    // 6. Callbacks
    const handleTimestampClick = useCallback((sec: number) => {
        videoPlayerRef.current?.seekAndPlay(sec);
    }, []);

    const handleQuoteClick = useCallback((quote: ParsedQuote) => {
        videoPlayerRef.current?.playRange(
            quote.startSeconds,
            quote.startSeconds + quote.durationSeconds
        );
    }, []);

    const handleQuoteDoubleClick = useCallback((quote: ParsedQuote) => {
        setEditingQuote(quote);
    }, []);

    const handleQuoteSave = useCallback(
        (updatedQuote: ParsedQuote) => {
            const newRawLine = formatQuoteAsMarkdown(
                updatedQuote.text,
                updatedQuote.startSeconds,
                updatedQuote.durationSeconds,
                updatedQuote.sessionIndex,
                updatedQuote.tags,
                updatedQuote.hidden
            );

            if (docContent == null) {
                setEditingQuote(null);
                return;
            }

            const lines = docContent.split("\n");
            const matchByContent = (line: string) => {
                const q = parseQuote(line);
                return (
                    q &&
                    q.text === updatedQuote.text &&
                    q.startSeconds === updatedQuote.startSeconds &&
                    q.sessionIndex === updatedQuote.sessionIndex
                );
            };
            const foundInFile = lines.some(matchByContent);
            if (foundInFile) {
                const updatedLines = lines.map((line) =>
                    matchByContent(line) ? newRawLine : line
                );
                lastSaveRef.current = Date.now();
                saveDoc(updatedLines.join("\n"));
            } else {
                clipCreatorRef.current?.updatePendingQuote({ ...updatedQuote, rawLine: newRawLine });
            }
            setEditingQuote(null);
        },
        [docContent, saveDoc]
    );

    const handleQuoteDelete = useCallback(
        (quote: ParsedQuote) => {
            if (docContent == null) return;
            const lines = docContent.split("\n");
            const matchByContent = (line: string) => {
                const q = parseQuote(line);
                return (
                    q &&
                    q.text === quote.text &&
                    q.startSeconds === quote.startSeconds &&
                    q.sessionIndex === quote.sessionIndex
                );
            };
            const updatedLines = lines.filter((line) => !matchByContent(line));
            lastSaveRef.current = Date.now();
            saveDoc(updatedLines.join("\n"));
        },
        [docContent, saveDoc]
    );

    const handleQuoteDeleteFromTranscript = useCallback(
        (quote: ParsedQuote) => {
            handleQuoteDelete(quote);
            clipCreatorRef.current?.removePendingQuote(quote);
        },
        [handleQuoteDelete]
    );

    const handleSessionChange = useCallback((index: number) => {
        setActiveSessionIndex(index);
        setActiveSecond(0);
    }, []);

    const handleDocChange = useCallback(
        (newContent: string) => {
            lastSaveRef.current = Date.now();
            saveDoc(newContent);
        },
        [saveDoc]
    );

    const handleRefresh = useCallback(() => {
        refetchDoc();
    }, [refetchDoc]);

    const handleSaveDoc = useCallback(() => {
        if (viewMode === "raw") {
            markdownEditorRef.current?.save();
        } else {
            lastSaveRef.current = Date.now();
            saveDoc(docContent ?? "");
        }
    }, [viewMode, saveDoc, docContent]);

    const handleRevertDoc = useCallback(() => {
        refetchDoc();
    }, [refetchDoc]);

    const handleSaveCodebook = useCallback(async (newCodebook: Codebook) => {
        try {
            const res = await fetch("/api/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug,
                    file: "codebook.json",
                    content: JSON.stringify(newCodebook, null, 2),
                }),
            });
            if (!res.ok) throw new Error("Failed to save codebook");

            setProject(prev => prev ? { ...prev, codebookData: newCodebook } : null);

            setShowCodebookModal(false);
            setShowTaggingNudge(true);
        } catch (err) {
            console.error("Error saving codebook:", err);
            alert("Failed to save codebook changes.");
        }
    }, [slug]);

    const codebook: Codebook = useMemo(
        () =>
            mergeCodebooks(
                globalCodebook ?? { tags: [], categories: [] },
                project?.codebookData ?? null
            ),
        [globalCodebook, project?.codebookData]
    );

    const aiActions = useMemo<AIAction[]>(() => {
        if (activeFile === "findings.md") {
            return ["thematic-transcripts", "thematic-findings", "other-templates"];
        }
        return ["tagging-findings", "tagging-transcripts", "other-templates"];
    }, [activeFile]);

    const initialAIAction = useMemo<AIAction>(() => {
        if (activeFile === "findings.md") {
            return docContent ? "thematic-findings" : "thematic-transcripts";
        }
        return docContent ? "tagging-findings" : "tagging-transcripts";
    }, [activeFile, docContent]);

    const otherTemplateContext = useMemo<"findings" | "tags">(() => {
        return activeFile === "tags.md" ? "tags" : "findings";
    }, [activeFile]);

    if (!project) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <WorkspaceNav slug={slug} onOpenCodebook={() => setShowCodebookModal(true)} />

            {showTaggingNudge && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20 text-sm shrink-0">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 min-w-0 text-slate-700">
                        Codebook saved. Re-run AI Tagging to apply tags to tags.md. Optionally, re-run AI Synthesis on Findings to re-analyze quotes with the new tags.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                setShowTaggingNudge(false);
                                setActiveFile("tags.md");
                                setShowPromptModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            Run AI Tagging
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => {
                                setShowTaggingNudge(false);
                                setActiveFile("findings.md");
                                setShowPromptModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Re-run Findings
                        </button>
                        <button
                            onClick={() => setShowTaggingNudge(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <Group orientation="horizontal" className="flex-1 overflow-hidden">
                {/* LEFT PANE: Video + Transcript (resizable vertical split) */}
                <Panel defaultSize={45} minSize={30}>
                    <div className="flex flex-col h-full bg-white border-r overflow-hidden">
                        <Group orientation="vertical" className="flex-1 min-h-0">
                            <Panel defaultSize={40} minSize={20} className="min-h-0 flex flex-col">
                                <div className="flex-1 min-h-0 flex flex-col p-4 pb-0 bg-white border-b overflow-hidden">
                                    <VideoPlayer
                                        ref={videoPlayerRef}
                                        sessions={project.sessions}
                                        activeSessionIndex={activeSessionIndex}
                                        onSessionChange={handleSessionChange}
                                        onTimeUpdate={setActiveSecond}
                                        onAddSession={() => setShowAddSessionModal(true)}
                                        slug={slug}
                                    />
                                </div>
                            </Panel>
                            <Separator className="h-2 shrink-0 group bg-slate-200 hover:bg-primary/20 transition-colors cursor-row-resize relative">
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-row items-center justify-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="h-1 w-1 rounded-full bg-primary/60" />
                                <span className="h-1 w-1 rounded-full bg-primary/60" />
                                <span className="h-1 w-1 rounded-full bg-primary/60" />
                              </div>
                            </Separator>
                            <Panel defaultSize={60} minSize={30} className="min-h-0 overflow-hidden">
                                {project.sessions.length === 0 ? (
                                    <ProjectEmptyState
                                        slug={slug}
                                        onAddSession={() => setShowAddSessionModal(true)}
                                    />
                                ) : transcriptLoading ? (
                                    <div className="h-full flex items-center justify-center bg-white/50">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : transcriptError ? (
                                    <div className="h-full flex flex-col items-center justify-center bg-white p-4 text-center">
                                        <p className="text-red-500 mb-2">Error: {transcriptError}</p>
                                        <button
                                            onClick={() => {
                                                window.location.reload();
                                            }}
                                            className="text-primary hover:text-primary-dark text-sm font-medium"
                                        >
                                            Reload Page
                                        </button>
                                    </div>
                                ) : (
                                    <ClipCreator
                                        ref={clipCreatorRef}
                                        lines={transcriptLines}
                                        quotes={sessionQuotes}
                                        quotesInFile={quotes}
                                        codebook={codebook}
                                        activeSecond={activeSecond}
                                        sessionIndex={activeSessionIndex + 1}
                                        onTimestampClick={handleTimestampClick}
                                        onQuoteClick={handleQuoteClick}
                                        onQuoteDoubleClick={handleQuoteDoubleClick}
                                        onQuoteDeleteFromTranscript={handleQuoteDeleteFromTranscript}
                                    />
                                )}
                            </Panel>
                        </Group>
                    </div>
                </Panel>

                <Separator className="w-2 group bg-slate-200 hover:bg-primary/20 transition-colors cursor-col-resize relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                  </div>
                </Separator>

                {/* RIGHT PANE: Document Editor */}
                <Panel defaultSize={55} minSize={30}>
                    <div className="flex flex-col h-full bg-slate-50">
                        {/* Header / Toolbar */}
                        <div className="h-12 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">

                                <div className="flex p-0.5 bg-slate-100 rounded-lg" role="group" aria-label="View mode">
                                    <button
                                        onClick={() => setViewMode("formatted")}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${viewMode === "formatted"
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        aria-pressed={viewMode === "formatted"}
                                        aria-label="Preview (formatted)"
                                    >
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="hidden sm:inline">Preview</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode("raw")}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${viewMode === "raw"
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        aria-pressed={viewMode === "raw"}
                                        aria-label="Source (markdown)"
                                    >
                                        <Code className="h-3.5 w-3.5 shrink-0" />
                                        <span className="hidden sm:inline">Source</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => setShowPromptModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors duration-200 shadow-sm cursor-pointer"
                                    title="Run AI Analysis"
                                    aria-label="Run AI Analysis"
                                >
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden lg:inline">AI Analyze</span>
                                </button>

                                <button
                                    onClick={handleRefresh}
                                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Refresh from disk"
                                    aria-label="Refresh from disk"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                                </button>

                                <div className="w-px h-4 bg-slate-200" aria-hidden />

                                <button
                                    onClick={handleSaveDoc}
                                    className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Save changes"
                                    aria-label="Save changes"
                                >
                                    <Save className="h-3.5 w-3.5 shrink-0" />
                                </button>
                                <button
                                    onClick={handleRevertDoc}
                                    className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Revert to last saved"
                                    aria-label="Revert to last saved"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className={`flex-1 min-h-0 p-6 flex flex-col ${viewMode === "raw" ? "overflow-hidden" : "overflow-y-auto"}`}>
                            <div className={`max-w-3xl mx-auto flex-1 min-w-0 ${viewMode === "raw" ? "min-h-0 flex flex-col" : ""}`}>
                                {docLoading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : docError ? (
                                    <div className="flex h-full flex-col items-center justify-center bg-white rounded-xl border p-8 shadow-sm">
                                        {activeFile === "tags.md" && docError.includes("not found") ? (
                                            <div className="text-center max-w-md">
                                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <Tag className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">No Tags Document Yet</h3>
                                                <p className="text-sm text-slate-600 mb-6">
                                                    Ready to organize your findings by codebook categories? Use the AI generator to scan your transcripts or findings and create your Tag Board.
                                                </p>
                                                <button
                                                    onClick={() => setShowPromptModal(true)}
                                                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                                                >
                                                    Generate tags.md
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-red-500 mb-4">Error loading document: {docError}</p>
                                                <button
                                                    onClick={() => refetchDoc()}
                                                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark"
                                                >
                                                    Retry
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : viewMode === "formatted" ? (
                                    <div className="bg-white rounded-xl border p-8 shadow-sm prose prose-slate max-w-none">
                                        <MarkdownRenderer
                                            content={docContent || `# No content yet`}
                                            codebook={codebook}
                                            onQuoteClick={handleQuoteClick}
                                            onQuoteDoubleClick={handleQuoteDoubleClick}
                                            onQuoteDelete={handleQuoteDelete}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                                        <MarkdownEditor
                                            ref={markdownEditorRef}
                                            content={docContent || ""}
                                            onChange={handleDocChange}
                                            onSave={handleDocChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Panel>
            </Group>

            {editingQuote && (
                <QuoteEditModal
                    quote={editingQuote}
                    codebook={codebook}
                    onSave={handleQuoteSave}
                    onClose={() => setEditingQuote(null)}
                />
            )}

            {showPromptModal && (
                <PromptModal
                    project={project}
                    codebook={codebook}
                    onClose={() => setShowPromptModal(false)}
                    actions={aiActions}
                    initialAction={initialAIAction}
                    otherTemplateContext={otherTemplateContext}
                    onRefreshFile={refetchDoc}
                />
            )}

            {showAddSessionModal && (
                <AddSessionModal
                    project={project}
                    onSuccess={(updatedProject) => setProject(updatedProject)}
                    onClose={() => setShowAddSessionModal(false)}
                />
            )}

            {showCodebookModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Manage Research Codebook</h2>
                                    <p className="text-xs text-slate-500">Define tags and categories for your analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCodebookModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            <CodebookEditor
                                projectCodebook={project?.codebookData || null}
                                onSave={handleSaveCodebook}
                                showProjectTab={true}
                                globalCodebook={globalCodebook ?? { tags: [], categories: [] }}
                                onSaveGlobal={async (codebook) => {
                                    const res = await fetch("/api/codebook/global", {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(codebook),
                                    });
                                    if (!res.ok) {
                                        throw new Error("Failed to save global codebook");
                                    }
                                    setGlobalCodebook(codebook);
                                }}
                                onCascade={async (action, oldId, newId) => {
                                    const res = await fetch("/api/codebook/cascade", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ dryRun: true, action, oldId, newId }),
                                    });
                                    return res.json();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
