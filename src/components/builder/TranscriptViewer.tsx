import React, { useRef, useMemo } from "react";
import { TranscriptLine, ParsedQuote, Codebook } from "@/types";
import { TranscriptLine as TranscriptLineView } from "./TranscriptLine";
import { QuoteCard } from "./QuoteCard";

interface TranscriptViewerProps {
  lines: TranscriptLine[];
  quotes: ParsedQuote[];
  codebook: Codebook;
  activeSecond: number;
  onTimestampClick: (sec: number) => void;
  onQuoteClick: (quote: ParsedQuote) => void;
  onQuoteDoubleClick: (quote: ParsedQuote) => void;
  onTextSelect: (data: { text: string; startSec: number; endSec: number }) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  lines,
  quotes,
  codebook,
  activeSecond,
  onTimestampClick,
  onQuoteClick,
  onQuoteDoubleClick,
  onTextSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine lines and quotes, replacing lines covered by quotes
  const displayItems = useMemo(() => {
    const sortedQuotes = [...quotes].sort((a, b) => a.startSeconds - b.startSeconds);
    const result: Array<{ type: "line"; data: TranscriptLine } | { type: "quote"; data: ParsedQuote }> = [];
    
    // Tracks lines already replaced by a quote
    const coveredLineIndices = new Set<number>();

    sortedQuotes.forEach((quote) => {
      const qStart = quote.startSeconds;
      const qEnd = qStart + quote.durationSeconds;

      // Find indices of lines covered by this quote
      lines.forEach((line, idx) => {
        if (line.sec >= qStart && line.sec < qEnd) {
          coveredLineIndices.add(idx);
        }
      });
    });

    let quoteIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      // If we are at a timestamp where a quote starts, and we haven't added it yet
      while (
        quoteIdx < sortedQuotes.length &&
        sortedQuotes[quoteIdx].startSeconds <= lines[i].sec
      ) {
        result.push({ type: "quote", data: sortedQuotes[quoteIdx] });
        quoteIdx++;
      }

      // If the line is NOT covered by a quote, add it
      if (!coveredLineIndices.has(i)) {
        result.push({ type: "line", data: lines[i] });
      }
    }

    // Add remaining quotes that might be after the last transcript line
    while (quoteIdx < sortedQuotes.length) {
      result.push({ type: "quote", data: sortedQuotes[quoteIdx] });
      quoteIdx++;
    }

    return result;
  }, [lines, quotes]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // To calculate timestamps, we need to know which lines/quotes were selected.
    // We can use data-attributes on the rendered elements.
    
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer.parentElement;
    const endNode = range.endContainer.parentElement;

    // Traverse up to find our wrapper elements with timestamps
    const getAttr = (node: HTMLElement | null, attr: string): number | null => {
      let current = node;
      while (current && current !== containerRef.current) {
        const val = current.getAttribute(attr);
        if (val !== null) return parseFloat(val);
        current = current.parentElement;
      }
      return null;
    };

    const startSec = getAttr(startNode, "data-timestamp");
    const endSec = getAttr(endNode, "data-timestamp");
    const endDuration = getAttr(endNode, "data-duration");

    if (startSec !== null && endSec !== null) {
      const actualStart = Math.min(startSec, endSec);
      let actualEnd = Math.max(startSec, endSec);
      
      if (endDuration !== null) {
        actualEnd += endDuration;
      } else {
        actualEnd += 2; // Default 2s for lines
      }

      onTextSelect({
        text: selectedText,
        startSec: actualStart,
        endSec: actualEnd,
      });
      
      // Clear selection after handling
      selection.removeAllRanges();
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="flex flex-col h-full bg-white overflow-y-auto"
    >
      {displayItems.map((item, idx) => {
        if (item.type === "line") {
          const isActive = 
            activeSecond >= item.data.sec && 
            (idx === displayItems.length - 1 || 
             (displayItems[idx + 1].type === "line" && activeSecond < (displayItems[idx + 1].data as TranscriptLine).sec) ||
             (displayItems[idx + 1].type === "quote" && activeSecond < (displayItems[idx + 1].data as ParsedQuote).startSeconds));

          return (
            <div 
              key={`line-${item.data.sec}-${idx}`} 
              data-timestamp={item.data.sec}
              data-duration={2}
            >
              <TranscriptLineView
                line={item.data}
                isActive={isActive}
                onClick={onTimestampClick}
              />
            </div>
          );
        } else {
          return (
            <div 
              key={`quote-${item.data.startSeconds}-${idx}`} 
              data-timestamp={item.data.startSeconds}
              data-duration={item.data.durationSeconds}
              className="px-4"
            >
              <QuoteCard
                quote={item.data}
                codebook={codebook}
                onClick={onQuoteClick}
                onDoubleClick={onQuoteDoubleClick}
              />
            </div>
          );
        }
      })}
    </div>
  );
};
