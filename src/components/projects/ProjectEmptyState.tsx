"use client";

import React from "react";
import { Mic, Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  slug: string;
  onAddSession: () => void;
}

export function ProjectEmptyState({ onAddSession }: ProjectEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[320px] px-6 py-12 bg-slate-50 border border-slate-200 rounded-xl text-center">
      <div
        data-testid="empty-state-icon"
        className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-6"
      >
        <Mic className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-800 mb-2">
        No sessions yet
      </h3>
      <p className="text-slate-600 text-sm max-w-md mb-6">
        Add a session recording and transcript to start capturing insights and building your report.
      </p>
      <button
        type="button"
        onClick={onAddSession}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add Session
      </button>
      <p className="text-slate-400 text-xs mt-6 max-w-sm">
        Or use the <strong className="text-slate-500">research-analysis</strong> skill in your IDE to add files and register sessions.
      </p>
    </div>
  );
}
