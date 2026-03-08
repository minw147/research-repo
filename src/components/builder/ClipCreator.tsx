import React, { useState, useCallback } from "react";
import { TranscriptLine, ParsedQuote, Codebook } from "@/types";
import { TranscriptViewer } from "./TranscriptViewer";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";

interface ClipCreatorProps {
  lines: TranscriptLine[];
  quotes: ParsedQuote[];
  codebook: Codebook;
  activeSecond: number;
  sessionIndex: number;
  onTimestampClick: (sec: number) => void;
  onQuoteClick: (quote: ParsedQuote) => void;
  onQuoteDoubleClick: (quote: ParsedQuote) => void;
}

interface SelectionState {
  text: string;
  startSec: number;
  endSec: number;
  rect: { top: number; left: number; width: number; height: number };
}

export const ClipCreator: React.FC<ClipCreatorProps> = ({
  lines,
  quotes,
  codebook,
  activeSecond,
  sessionIndex,
  onTimestampClick,
  onQuoteClick,
  onQuoteDoubleClick,
}) => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [pendingQuotes, setPendingQuotes] = useState<ParsedQuote[]>([]);

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

  // Click away to clear selection
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (selection && !(e.target as HTMLElement).closest(".clip-creator-button")) {
      setSelection(null);
    }
  }, [selection]);

  return (
    <div className="relative h-full" onClick={handleContainerClick}>
      <TranscriptViewer
        lines={lines}
        quotes={quotes}
        pendingQuotes={pendingQuotes}
        codebook={codebook}
        activeSecond={activeSecond}
        onTimestampClick={onTimestampClick}
        onQuoteClick={onQuoteClick}
        onQuoteDoubleClick={onQuoteDoubleClick}
        onTextSelect={handleTextSelect}
      />

      {selection && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            createClip();
          }}
          className="clip-creator-button absolute z-50 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
          style={{
            top: selection.rect.top + window.scrollY - 40,
            left: selection.rect.left + window.scrollX + selection.rect.width / 2,
            transform: "translateX(-50%)",
          }}
        >
          <span className="text-lg leading-none">+</span>
          <span>Clip</span>
        </button>
      )}
    </div>
  );
};
