"use client";
import { type PatternNudgeState } from "@/hooks/usePatternDetector";

interface PatternNudgeProps {
  nudge: PatternNudgeState;
  onDocument: () => void;
  onDismiss: () => void;
  onNever: () => void;
}

export function PatternNudge({ nudge, onDocument, onDismiss, onNever }: PatternNudgeProps) {
  return (
    <div
      role="alert"
      className="mx-3 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <p className="mb-2">
        I&apos;ve seen you{" "}
        <span className="font-medium text-amber-800">{nudge.label}</span> 3
        times — should I track this as a habit?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onDocument}
          className="min-h-[44px] min-w-[44px] rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-amber-50"
        >
          Document
        </button>
        <button
          onClick={onDismiss}
          className="min-h-[44px] min-w-[44px] rounded px-3 py-1 text-xs text-slate-600 hover:text-slate-900 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Not now
        </button>
        <button
          onClick={onNever}
          className="min-h-[44px] min-w-[44px] rounded px-3 py-1 text-xs text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Never ask
        </button>
      </div>
    </div>
  );
}
