import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { TranscriptLine, ParsedQuote, Codebook } from "@/types";
import { stripTimestampFragments } from "@/lib/quote-parser";
import { TranscriptLine as TranscriptLineView } from "./TranscriptLine";
import { QuoteCard } from "./QuoteCard";

interface TranscriptViewerProps {
  lines: TranscriptLine[];
  quotes: ParsedQuote[];
  pendingQuotes?: ParsedQuote[];
  codebook: Codebook;
  activeSecond: number;
  onTimestampClick: (sec: number) => void;
  onQuoteClick: (quote: ParsedQuote) => void;
  onQuoteDoubleClick: (quote: ParsedQuote) => void;
  /** Called when user deletes a quote from the transcript (remove from file and/or pending). */
  onQuoteDelete?: (quote: ParsedQuote) => void;
  onTextSelect: (data: { 
    text: string; 
    startSec: number; 
    endSec: number;
    rect: { top: number; left: number; width: number; height: number };
  }) => void;
  /** Called when selection is cleared or moves outside the transcript (so parent can hide + Clip button). */
  onSelectionClear?: () => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  lines,
  quotes,
  pendingQuotes = [],
  codebook,
  activeSecond,
  onTimestampClick,
  onQuoteClick,
  onQuoteDoubleClick,
  onQuoteDelete,
  onTextSelect,
  onSelectionClear,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const onTextSelectRef = useRef(onTextSelect);
  const onSelectionClearRef = useRef(onSelectionClear);
  onTextSelectRef.current = onTextSelect;
  onSelectionClearRef.current = onSelectionClear;

  // Combine lines and quotes, replacing lines covered by quotes
  const displayItems = useMemo(() => {
    const allQuotes = [...quotes, ...pendingQuotes];
    const sortedQuotes = allQuotes.sort((a, b) => a.startSeconds - b.startSeconds);
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
  }, [lines, quotes, pendingQuotes]);

  // Index of the display item that contains activeSecond (for scroll-into-view)
  const activeIndex = useMemo(() => {
    for (let i = 0; i < displayItems.length; i++) {
      const item = displayItems[i];
      if (item.type === "line") {
        const line = item.data as TranscriptLine;
        const next = displayItems[i + 1];
        const nextStart = next
          ? next.type === "line"
            ? (next.data as TranscriptLine).sec
            : (next.data as ParsedQuote).startSeconds
          : Infinity;
        if (activeSecond >= line.sec && activeSecond < nextStart) return i;
      } else {
        const quote = item.data as ParsedQuote;
        if (
          activeSecond >= quote.startSeconds &&
          activeSecond < quote.startSeconds + quote.durationSeconds
        )
          return i;
      }
    }
    return -1;
  }, [displayItems, activeSecond]);

  // Scroll transcript so the line at the current video timestamp is in view
  useEffect(() => {
    if (activeIndex >= 0) {
      activeItemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSecond, activeIndex]);

  const getElement = useCallback((node: Node): HTMLElement | null => {
    if (node.nodeType === Node.ELEMENT_NODE) return node as HTMLElement;
    if (node.nodeType === Node.TEXT_NODE && node.parentNode?.nodeType === Node.ELEMENT_NODE) return node.parentNode as HTMLElement;
    return null;
  }, []);

  const getAttr = useCallback((node: Node | null, attr: string): number | null => {
    let current: Node | null = node;
    const container = containerRef.current;
    while (current && current !== container) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const val = (current as HTMLElement).getAttribute(attr);
        if (val !== null && val !== "") return parseFloat(val);
      }
      current = current.parentNode;
    }
    return null;
  }, []);

  const tryEmitSelection = useCallback(() => {
    const container = containerRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    let selectedText = sel.toString().trim();
    // Strip any [MM:SS] that got into selection (e.g. cross-node selection including timestamp column)
    selectedText = stripTimestampFragments(selectedText);
    if (!selectedText) return false;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return false;

    const startEl = getElement(range.startContainer);
    const endEl = getElement(range.endContainer);
    const startSec = startEl ? getAttr(startEl, "data-timestamp") : null;
    const endSec = endEl ? getAttr(endEl, "data-timestamp") : null;
    const endDuration = endEl ? getAttr(endEl, "data-duration") : null;
    if (startSec === null || endSec === null) return false;

    let actualEnd = Math.max(startSec, endSec);
    if (endDuration !== null) actualEnd += endDuration;
    else actualEnd += 2;
    const actualStart = Math.min(startSec, endSec);
    const rect = range.getBoundingClientRect();

    onTextSelectRef.current({
      text: selectedText,
      startSec: actualStart,
      endSec: actualEnd,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    });
    return true;
  }, [getElement, getAttr]);

  // React to selection changes: show + Clip when selection is inside transcript.
  // Do NOT clear when selection becomes collapsed/empty (e.g. on mouseup the browser often collapses it);
  // only clear when the user selects something outside the transcript.
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const container = containerRef.current;
      if (!container) return;
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        onSelectionClearRef.current?.();
        return;
      }
      tryEmitSelection();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [tryEmitSelection]);

  const handleMouseUp = () => {
    tryEmitSelection();
  };

  return (
    <div 
      ref={containerRef}
      data-transcript-root
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
            <div ref={idx === activeIndex ? activeItemRef : undefined} key={`line-${item.data.sec}-${idx}`}>
              <TranscriptLineView
                line={item.data}
                isActive={isActive}
                onClick={onTimestampClick}
                durationSec={2}
              />
            </div>
          );
        } else {
          return (
            <div 
              ref={idx === activeIndex ? activeItemRef : undefined}
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
                onDelete={onQuoteDelete}
              />
            </div>
          );
        }
      })}
    </div>
  );
};
