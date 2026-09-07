"use client";

import React from "react";
import { RefreshCw, X } from "lucide-react";

interface ExternalChangeBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

/**
 * Shown when the mounted RichMarkdownEditor's `content` prop changed but does not match
 * what the editor itself last saved — a genuine external change (another tab/process
 * editing the file). The editor never auto-resyncs itself on this signal (that's what
 * used to reset cursor/scroll/undo-history on every autosave); the user explicitly opts
 * into remounting via this banner.
 */
export function ExternalChangeBanner({ onReload, onDismiss }: ExternalChangeBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm shrink-0">
      <RefreshCw className="h-4 w-4 text-amber-600 shrink-0" />
      <span className="flex-1 min-w-0 text-stone-700">
        This file changed outside the editor.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onReload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Reload
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-stone-400 hover:text-stone-900 rounded transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
