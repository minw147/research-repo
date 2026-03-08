"use client";

import React, { useState } from "react";
import { useFileContent } from "@/hooks/useFileContent";
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";
import { CodebookEditor } from "@/components/builder/CodebookEditor";
import { TagBoard } from "@/components/builder/TagBoard";
import { Codebook, ParsedQuote } from "@/types";
import { Settings, LayoutDashboard } from "lucide-react";

interface TagsPageProps {
  params: {
    slug: string;
  };
}

export default function TagsPage({ params }: TagsPageProps) {
  const { slug } = params;
  const [activeTab, setActiveTab] = useState<"editor" | "board">("editor");

  const { 
    content: codebookContent, 
    loading: codebookLoading, 
    error: codebookError, 
    saveContent: saveCodebook 
  } = useFileContent(slug, "codebook.json");

  const { 
    content: findingsContent, 
    loading: findingsLoading, 
    error: findingsError 
  } = useFileContent(slug, "findings.md");

  const projectCodebook: Codebook | null = codebookContent ? JSON.parse(codebookContent) : null;

  const handleSave = async (newCodebook: Codebook) => {
    await saveCodebook(JSON.stringify(newCodebook, null, 2));
    alert("Codebook saved successfully!");
  };

  const handleQuoteClick = (quote: ParsedQuote) => {
    console.log("Quote clicked:", quote);
  };

  const handleQuoteDoubleClick = (quote: ParsedQuote) => {
    console.log("Quote double-clicked:", quote);
  };

  if (codebookError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceNav slug={slug} />
        <div className="p-8 text-center text-red-500">
          Error loading codebook: {codebookError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceNav slug={slug} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "editor"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings className="h-4 w-4" />
              Codebook Editor
            </button>
            <button
              onClick={() => setActiveTab("board")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "board"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Evidence Board
            </button>
          </div>
        </div>

        {codebookLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              <p className="font-medium">Loading project data...</p>
            </div>
          </div>
        ) : activeTab === "editor" ? (
          <CodebookEditor
            slug={slug}
            projectCodebook={projectCodebook}
            onSave={handleSave}
          />
        ) : (
          <TagBoard
            findings={findingsContent || ""}
            codebook={projectCodebook || { tags: [], categories: [] }}
            onQuoteClick={handleQuoteClick}
            onQuoteDoubleClick={handleQuoteDoubleClick}
          />
        )}
      </main>
    </div>
  );
}
