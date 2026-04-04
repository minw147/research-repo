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
      className="mx-3 mb-2 rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-300"
    >
      <p className="mb-2">
        I&apos;ve seen you{" "}
        <span className="font-medium text-amber-200">{nudge.label}</span> 3
        times — should I track this as a habit?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onDocument}
          className="min-h-[44px] min-w-[44px] rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          Document
        </button>
        <button
          onClick={onDismiss}
          className="min-h-[44px] min-w-[44px] rounded px-3 py-1 text-xs text-amber-400 hover:text-amber-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          Not now
        </button>
        <button
          onClick={onNever}
          className="min-h-[44px] min-w-[44px] rounded px-3 py-1 text-xs text-amber-600 hover:text-amber-400 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          Never ask
        </button>
      </div>
    </div>
  );
}
