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
import { RichMarkdownEditor, type RichMarkdownEditorHandle } from "@/components/builder/RichMarkdownEditor";
import { ExternalChangeBanner } from "@/components/builder/ExternalChangeBanner";
import { QuoteEditModal } from "@/components/builder/QuoteEditModal";
import { CodebookEditor } from "@/components/builder/CodebookEditor";
import { PromptModal, type AIAction } from "@/components/builder/PromptModal";
import { ProjectEmptyState } from "@/components/projects/ProjectEmptyState";
import { AddSessionModal } from "@/components/projects/AddSessionModal";
import { parseQuotesFromMarkdown, parseQuote, quotesMatch, removeQuoteLines, formatQuoteAsMarkdown } from "@/lib/quote-parser";
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
    const [externalChangePending, setExternalChangePending] = useState(false);

    const videoPlayerRef = useRef<VideoPlayerRef>(null);
    const markdownEditorRef = useRef<MarkdownEditorHandle>(null);
    const richEditorRef = useRef<RichMarkdownEditorHandle>(null);
    const clipCreatorRef = useRef<ClipCreatorHandle>(null);
    const lastFindingsSaveRef = useRef<number>(0);
    const lastTagsSaveRef = useRef<number>(0);

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

    // 2. Fetch both markdown files (always mounted, not just the active one) — tags.md
    // must stay current as the persistent clip library regardless of which file is open in
    // the right panel, and findings.md needs to be editable via disk-level writes even when
    // it isn't the mounted editor (transcript-side cascade delete).
    const findings = useFileContent(slug, "findings.md");
    const tags = useFileContent(slug, "tags.md");
    const active = activeFile === "findings.md" ? findings : tags;
    const {
        content: docContent,
        loading: docLoading,
        error: docError,
        refetch: refetchDoc,
        saveContent: saveDoc,
    } = active;

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

    // 4. File Watcher — refetches whichever file changed on disk, independent of which one
    // is currently active/mounted, so tags.md (the clip library) stays current even while
    // findings.md is open, and vice versa.
    useFileWatcher(slug, useCallback((file: string) => {
        if (file === "findings.md" && Date.now() - lastFindingsSaveRef.current >= 5000) {
            findings.refetch();
        }
        if (file === "tags.md" && Date.now() - lastTagsSaveRef.current >= 5000) {
            tags.refetch();
        }
    }, [findings.refetch, tags.refetch]));

    // 5. The clip library (tags.md) is the persistent source of truth for "is this quote
    // tagged" — independent of what's currently cited in findings.md.
    const libraryQuotes = useMemo(() => {
        if (!tags.content) return [];
        return parseQuotesFromMarkdown(tags.content);
    }, [tags.content]);

    // Filter library quotes for the active session
    const sessionLibraryQuotes = useMemo(() => {
        return libraryQuotes.filter((q) => q.sessionIndex === activeSessionIndex + 1 && !q.hidden);
    }, [libraryQuotes, activeSessionIndex]);

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
                return q != null && quotesMatch(q, updatedQuote);
            };
            const foundInFile = lines.some(matchByContent);
            if (foundInFile) {
                const updatedLines = lines.map((line) =>
                    matchByContent(line) ? newRawLine : line
                );
                (activeFile === "findings.md" ? lastFindingsSaveRef : lastTagsSaveRef).current = Date.now();
                saveDoc(updatedLines.join("\n"));
            } else {
                clipCreatorRef.current?.updatePendingQuote({ ...updatedQuote, rawLine: newRawLine });
            }
            setEditingQuote(null);
        },
        [docContent, saveDoc, activeFile]
    );

    // Removes every instance of `quote` from `file`'s content, whether that file is the
    // currently mounted rich editor (which never resyncs from prop changes — needs the
    // imperative handle) or not (a plain hook-level save is enough).
    const removeQuoteFromFile = useCallback(
        (file: DocumentType, hook: typeof findings, quote: ParsedQuote) => {
            if (file === activeFile && viewMode === "formatted") {
                richEditorRef.current?.removeQuoteInstances(quote);
                return;
            }
            if (hook.content == null) return;
            (file === "findings.md" ? lastFindingsSaveRef : lastTagsSaveRef).current = Date.now();
            hook.saveContent(removeQuoteLines(hook.content, quote));
        },
        [activeFile, viewMode]
    );

    // Untagging from the transcript is the one true "delete" action: it removes the clip
    // from the library (tags.md) and cascades to remove every citation of it in
    // findings.md. Deleting a citation from the report editor itself (right panel) is
    // handled entirely inside the quote NodeView (see quote-node-view.tsx's deleteSelf) —
    // it only ever removes that one node, and never reaches this function.
    const handleQuoteDeleteFromTranscript = useCallback(
        (quote: ParsedQuote) => {
            removeQuoteFromFile("tags.md", tags, quote);
            removeQuoteFromFile("findings.md", findings, quote);
            clipCreatorRef.current?.removePendingQuote(quote);
        },
        [removeQuoteFromFile, tags, findings]
    );

    const handleSessionChange = useCallback((index: number) => {
        setActiveSessionIndex(index);
        setActiveSecond(0);
    }, []);

    const handleDocChange = useCallback(
        (newContent: string) => {
            (activeFile === "findings.md" ? lastFindingsSaveRef : lastTagsSaveRef).current = Date.now();
            saveDoc(newContent);
        },
        [saveDoc, activeFile]
    );

    // RichMarkdownEditor's `onChange` is the debounced, in-memory-only signal (no disk
    // write) — kept separate from `onSave` (handleDocChange, above) so a disk write only
    // happens on the editor's own blur/drop/manual-save triggers, not on every pause in
    // typing. Nothing here needs to track that in-memory value at the DocumentWorkspace
    // level today (quotes/session overlays are fine reflecting "last saved to disk").
    const handleRichEditorChange = useCallback(() => {}, []);

    const handleExternalChangePending = useCallback(() => {
        setExternalChangePending(true);
    }, []);

    const handleReloadEditor = useCallback(() => {
        richEditorRef.current?.reload();
        setExternalChangePending(false);
    }, []);

    // A pending "file changed outside the editor" banner for one file/view shouldn't
    // linger after navigating away from it.
    useEffect(() => {
        setExternalChangePending(false);
    }, [activeFile, viewMode]);

    const handleRefresh = useCallback(() => {
        refetchDoc();
    }, [refetchDoc]);

    const handleSaveDoc = useCallback(() => {
        if (viewMode === "raw") {
            markdownEditorRef.current?.save();
        } else {
            richEditorRef.current?.save();
        }
    }, [viewMode]);

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
        <div className="h-full flex flex-col bg-stone-50">
            <WorkspaceNav slug={slug} onOpenCodebook={() => setShowCodebookModal(true)} />

            {showTaggingNudge && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20 text-sm shrink-0">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 min-w-0 text-stone-700">
                        Codebook updated — your tags are ready to apply.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                setShowTaggingNudge(false);
                                setActiveFile("tags.md");
                                setShowPromptModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-clay-600 text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                            Re-run Findings
                        </button>
                        <button
                            onClick={() => setShowTaggingNudge(false)}
                            className="p-1 text-stone-400 hover:text-stone-900 rounded transition-colors cursor-pointer"
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
                    <div className="flex flex-col h-full bg-white border-r border-stone-200 overflow-hidden">
                        <Group orientation="vertical" className="flex-1 min-h-0">
                            <Panel defaultSize={40} minSize={20} className="min-h-0 flex flex-col">
                                <div className="flex-1 min-h-0 flex flex-col p-4 pb-0 bg-white border-b border-stone-200 overflow-hidden">
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
                            <Separator className="h-2 shrink-0 group bg-stone-100 hover:bg-primary/20 transition-colors cursor-row-resize relative">
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
                                        quotes={sessionLibraryQuotes}
                                        libraryQuotes={libraryQuotes}
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

                <Separator className="w-2 group bg-stone-100 hover:bg-primary/20 transition-colors cursor-col-resize relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                  </div>
                </Separator>

                {/* RIGHT PANE: Document Editor */}
                <Panel defaultSize={55} minSize={30}>
                    <div className="flex flex-col h-full bg-white overflow-hidden">
                        {/* Header / Toolbar */}
                        <div className="h-12 shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-black/[.08]">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">

                                <div className="flex p-0.5 bg-stone-100 rounded-lg" role="group" aria-label="View mode">
                                    <button
                                        onClick={() => setViewMode("formatted")}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${viewMode === "formatted"
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-stone-400 hover:text-stone-900"
                                            }`}
                                        aria-pressed={viewMode === "formatted"}
                                        aria-label="Edit (formatted)"
                                    >
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode("raw")}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${viewMode === "raw"
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-stone-400 hover:text-stone-900"
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 rounded-lg text-xs font-medium bg-clay-600 text-white hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                                    title="Run AI Analysis"
                                    aria-label="Run AI Analysis"
                                >
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden lg:inline">AI Analyze</span>
                                </button>

                                <button
                                    onClick={handleRefresh}
                                    className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Refresh from disk"
                                    aria-label="Refresh from disk"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                                </button>

                                <div className="w-px h-4 bg-stone-100" aria-hidden />

                                <button
                                    onClick={handleSaveDoc}
                                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Save changes"
                                    aria-label="Save changes"
                                >
                                    <Save className="h-3.5 w-3.5 shrink-0" />
                                </button>
                                <button
                                    onClick={handleRevertDoc}
                                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors duration-200 cursor-pointer"
                                    title="Revert to last saved"
                                    aria-label="Revert to last saved"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                {docLoading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : docError ? (
                                    <div className="flex h-full flex-col items-center justify-center p-8">
                                        {activeFile === "tags.md" && docError.includes("not found") ? (
                                            <div className="text-center max-w-md">
                                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-md flex items-center justify-center mx-auto mb-4">
                                                    <Tag className="w-8 h-8" />
                                                </div>
                                                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">No Tags Document Yet</h3>
                                                <p className="text-sm text-stone-600 mb-6">
                                                    Ready to organize your findings by codebook categories? Use the AI generator to scan your transcripts or findings and create your Tag Board.
                                                </p>
                                                <button
                                                    onClick={() => setShowPromptModal(true)}
                                                    className="bg-clay-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
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
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        {externalChangePending && (
                                            <ExternalChangeBanner
                                                onReload={handleReloadEditor}
                                                onDismiss={() => setExternalChangePending(false)}
                                            />
                                        )}
                                        <RichMarkdownEditor
                                            ref={richEditorRef}
                                            content={docContent || ""}
                                            onChange={handleRichEditorChange}
                                            onSave={handleDocChange}
                                            codebook={codebook}
                                            onQuoteClick={handleQuoteClick}
                                            onQuoteDoubleClick={handleQuoteDoubleClick}
                                            onExternalChangePending={handleExternalChangePending}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-md shadow-dialog w-full max-w-5xl max-h-[90vh] overflow-hidden border border-stone-200 flex flex-col animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-stone-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-clay-600/10 rounded text-clay-600">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="font-serif font-semibold text-stone-900">Manage Research Codebook</h2>
                                    <p className="text-xs text-stone-500">Define tags and categories for your analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCodebookModal(false)}
                                className="text-stone-400 hover:text-stone-900 p-1 rounded-md hover:bg-stone-100 transition-colors duration-200 cursor-pointer"
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
