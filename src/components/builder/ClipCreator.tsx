import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { TranscriptLine, ParsedQuote, Codebook } from "@/types";
import { TranscriptViewer } from "./TranscriptViewer";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";

export interface ClipCreatorHandle {
  /** Update a pending quote (e.g. after editing tags/hide in the modal). Call when the quote is not in findings.md yet. */
  updatePendingQuote: (updatedQuote: ParsedQuote) => void;
  /** Remove a quote from pending list (e.g. when user deletes it from transcript). */
  removePendingQuote: (quote: ParsedQuote) => void;
}

interface ClipCreatorProps {
  lines: TranscriptLine[];
  /** Quotes from file for current session (used for transcript display). */
  quotes: ParsedQuote[];
  /** All quotes parsed from findings.md (used to hide pending quotes that are already in the file and avoid duplicates). */
  quotesInFile?: ParsedQuote[];
  codebook: Codebook;
  activeSecond: number;
  sessionIndex: number;
  onTimestampClick: (sec: number) => void;
  onQuoteClick: (quote: ParsedQuote) => void;
  onQuoteDoubleClick: (quote: ParsedQuote) => void;
  /** Called when user deletes a quote from the transcript (remove from file if present, and from pending). */
  onQuoteDeleteFromTranscript?: (quote: ParsedQuote) => void;
}

interface SelectionState {
  text: string;
  startSec: number;
  endSec: number;
  rect: { top: number; left: number; width: number; height: number };
}

function samePendingQuote(a: ParsedQuote, b: ParsedQuote): boolean {
  return a.text === b.text && a.startSeconds === b.startSeconds && a.sessionIndex === b.sessionIndex;
}

function quoteMatchesFile(a: ParsedQuote, b: ParsedQuote): boolean {
  return a.text === b.text && a.startSeconds === b.startSeconds && a.sessionIndex === b.sessionIndex;
}

export const ClipCreator = forwardRef<ClipCreatorHandle, ClipCreatorProps>(function ClipCreator({
  lines,
  quotes,
  quotesInFile = [],
  codebook,
  activeSecond,
  sessionIndex,
  onTimestampClick,
  onQuoteClick,
  onQuoteDoubleClick,
  onQuoteDeleteFromTranscript,
}, ref) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [pendingQuotes, setPendingQuotes] = useState<ParsedQuote[]>([]);

  // Only show pending quotes that are not already in the file (avoids duplicate cards after drag-to-findings)
  const visiblePendingQuotes = useMemo(() => {
    return pendingQuotes.filter(
      (p) => !p.hidden && !quotesInFile.some((f) => quoteMatchesFile(f, p))
    );
  }, [pendingQuotes, quotesInFile]);

  useImperativeHandle(ref, () => ({
    updatePendingQuote(updatedQuote: ParsedQuote) {
      setPendingQuotes((prev) =>
        prev.map((q) => (samePendingQuote(q, updatedQuote) ? { ...updatedQuote, rawLine: formatQuoteAsMarkdown(updatedQuote.text, updatedQuote.startSeconds, updatedQuote.durationSeconds, updatedQuote.sessionIndex, updatedQuote.tags, updatedQuote.hidden) } : q))
      );
    },
    removePendingQuote(quote: ParsedQuote) {
      setPendingQuotes((prev) => prev.filter((q) => !samePendingQuote(q, quote)));
    },
  }), []);

  const handleTextSelect = useCallback((data: SelectionState) => {
    setSelection(data);
  }, []);

  const createClip = useCallback(() => {
    if (!selection) return;

    const { text, startSec, endSec } = selection;
    const durationSeconds = Math.max(1, endSec - startSec);
    
    const min = Math.floor(startSec / 60).toString().padStart(2, "0");
    const sec = (startSec % 60).toString().padStart(2, "0");
    const timestampDisplay = `${min}:${sec}`;

    const rawLine = formatQuoteAsMarkdown(
      text,
      startSec,
      durationSeconds,
      sessionIndex,
      []
    );

    const newQuote: ParsedQuote = {
      text,
      timestampDisplay,
      startSeconds: startSec,
      durationSeconds,
      sessionIndex,
      tags: [],
      rawLine,
    };

    setPendingQuotes((prev) => [...prev, newQuote]);
    setSelection(null);
  }, [selection, sessionIndex]);

  // Click away to clear selection (only when clicking outside the transcript; releasing mouse after select fires click inside transcript)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".clip-creator-button")) return;
    if (target.closest("[data-transcript-root]")) return;
    if (selection) setSelection(null);
  }, [selection]);

  return (
    <div className="relative h-full" onClick={handleContainerClick}>
      <TranscriptViewer
        lines={lines}
        quotes={quotes}
        pendingQuotes={visiblePendingQuotes}
        codebook={codebook}
        activeSecond={activeSecond}
        onTimestampClick={onTimestampClick}
        onQuoteClick={onQuoteClick}
        onQuoteDoubleClick={onQuoteDoubleClick}
        onQuoteDelete={onQuoteDeleteFromTranscript}
        onTextSelect={handleTextSelect}
        onSelectionClear={() => setSelection(null)}
      />

      {selection && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            createClip();
          }}
          aria-label="Create Clip"
          className="clip-creator-button fixed z-50 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-primary-dark active:scale-95"
          style={{
            top: selection.rect.top - 40,
            left: selection.rect.left + selection.rect.width / 2,
            transform: "translateX(-50%)",
          }}
        >
          <span className="text-lg leading-none">+</span>
          <span>Clip</span>
        </button>
      )}
    </div>
  );
});
