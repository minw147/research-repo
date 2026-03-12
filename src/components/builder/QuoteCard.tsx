import React, { useRef } from "react";
import { ParsedQuote, Codebook } from "@/types";
import { formatQuoteAsMarkdown, stripTimestampFragments } from "@/lib/quote-parser";
import { EyeOff, X } from "lucide-react";

const CLICK_DELAY_MS = 250;

interface QuoteCardProps {
  quote: ParsedQuote;
  codebook: Codebook;
  onClick?: (quote: ParsedQuote) => void;
  onDoubleClick?: (quote: ParsedQuote) => void;
  onDelete?: (quote: ParsedQuote) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  codebook,
  onClick,
  onDoubleClick,
  onDelete,
}) => {
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (clickTimeoutRef.current) return;
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
      onClick?.(quote);
    }, CLICK_DELAY_MS);
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onDoubleClick?.(quote);
  };

  const handleDragStart = (e: React.DragEvent) => {
    const markdown = formatQuoteAsMarkdown(
      quote.text,
      quote.startSeconds,
      quote.durationSeconds,
      quote.sessionIndex,
      quote.tags,
      quote.hidden
    );
    e.dataTransfer.setData("text/plain", markdown);
    e.dataTransfer.effectAllowed = "copy";
  };

  const getTagColor = (tagId: string) => {
    const tag = codebook.tags.find((t) => t.id === tagId);
    return tag?.color || "#cccccc";
  };

  const getTagLabel = (tagId: string) => {
    const tag = codebook.tags.find((t) => t.id === tagId);
    return tag?.label || tagId;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const endSeconds = quote.startSeconds + quote.durationSeconds;
  const timeRange =
    quote.durationSeconds > 0
      ? `${quote.timestampDisplay} – ${formatTime(endSeconds)}`
      : quote.timestampDisplay;

  return (
    <div
      draggable="true"
      data-testid="quote-card"
      onDragStart={handleDragStart}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="group relative my-4 cursor-pointer rounded-lg border-l-4 border-l-primary bg-white pt-4 pr-11 pl-4 pb-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(quote);
          }}
          className="absolute top-1 right-1 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          aria-label="Remove quote"
        >
          <X className="w-4 h-4 shrink-0" />
        </button>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-gray-800 italic leading-relaxed pr-0">
          &ldquo;{stripTimestampFragments(quote.text)}&rdquo;
        </p>
        
        <div className="flex flex-wrap gap-2 mt-1">
          {quote.tags.map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center gap-2 bg-gray-100 pl-1.5 pr-2 py-0.5 rounded-full shrink-0"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getTagColor(tagId) }}
                aria-hidden
              />
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                {getTagLabel(tagId)}
              </span>
            </span>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          {quote.hidden && (
            <div className="text-amber-500" title="Hidden from transcript">
              <EyeOff className="h-3 w-3" />
            </div>
          )}
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            Session {quote.sessionIndex}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            {timeRange}
          </span>
        </div>
      </div>
    </div>
  );
};
