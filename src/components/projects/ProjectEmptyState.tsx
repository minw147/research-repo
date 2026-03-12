"use client";

import React from "react";
import { Film, Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  slug: string;
  onAddSession: () => void;
}

export function ProjectEmptyState({ slug, onAddSession }: ProjectEmptyStateProps) {
  const folderPath = `content/projects/${slug}/`;

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[320px] px-6 py-12 bg-slate-50 border border-slate-200 rounded-xl text-center">
      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-6">
        <Film className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">No sessions yet</h3>
      <p className="text-slate-600 text-sm max-w-md mb-6">
        Add a session recording and transcript to start analyzing findings.
      </p>
      <button
        type="button"
        onClick={onAddSession}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add Session
      </button>
      <p className="text-slate-500 text-xs mt-6 max-w-sm">
        Or use the <strong>research-analysis</strong> skill in your IDE to add video and transcript
        files and register sessions.
      </p>
      <p className="text-slate-400 text-xs mt-2 font-mono" title="Project folder">
        {folderPath}
      </p>
    </div>
  );
}
