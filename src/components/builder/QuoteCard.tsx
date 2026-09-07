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
  const timestampDisplay = quote.timestampDisplay || formatTime(quote.startSeconds);

  return (
    <div
      draggable="true"
      data-testid="quote-card"
      onDragStart={handleDragStart}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="group relative my-3 cursor-pointer bg-clay-600/5 border border-clay-600/20 rounded-tr-md rounded-br-md rounded-bl-md"
    >
      {/* Floating tab label — timestamp + session, the signature evidence-card treatment */}
      <div className="absolute -top-px -left-px flex items-center gap-1.5 bg-clay-600 text-stone-50 font-mono text-[10.5px] px-2 py-0.5 rounded-tl-md rounded-br-md">
        <span className="w-1 h-1 rounded-full bg-stone-50" />
        {timestampDisplay} · S{quote.sessionIndex}
      </div>

      {onDelete && (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(quote);
          }}
          className="absolute top-1 right-1 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-stone-400 hover:text-red-600 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          aria-label="Remove quote"
        >
          <X className="w-4 h-4 shrink-0" />
        </button>
      )}
      <div className="flex flex-col gap-2 pt-6 px-3.5 pb-3">
        <p className="font-serif italic text-stone-900 text-[15px] leading-[1.55] pr-8">
          &ldquo;{stripTimestampFragments(quote.text)}&rdquo;
        </p>

        <div className="flex flex-wrap gap-1.5">
          {quote.tags.map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 pl-1.5 pr-2 py-0.5 rounded shrink-0"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: getTagColor(tagId) }}
                aria-hidden
              />
              <span className="font-mono text-[10.5px] text-stone-600">
                {getTagLabel(tagId)}
              </span>
            </span>
          ))}
          {quote.hidden && (
            <span className="flex items-center gap-1 font-mono text-[10.5px] text-ochre-600" title="Hidden from transcript">
              <EyeOff className="h-3 w-3" /> hidden
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
