import React, { useState } from "react";
import { ParsedQuote, Codebook } from "@/types";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";

interface QuoteCardProps {
  quote: ParsedQuote;
  codebook: Codebook;
  onClick?: (quote: ParsedQuote) => void;
  onDoubleClick?: (quote: ParsedQuote) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  codebook,
  onClick,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    const markdown = formatQuoteAsMarkdown(
      quote.text,
      quote.startSeconds,
      quote.durationSeconds,
      quote.sessionIndex,
      quote.tags
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

  return (
    <div
      draggable="true"
      data-testid="quote-card"
      onDragStart={handleDragStart}
      onClick={() => onClick?.(quote)}
      onDoubleClick={() => onDoubleClick?.(quote)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative my-4 cursor-pointer rounded-lg border-l-4 border-l-blue-500 bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex flex-col gap-2">
        <p className="text-gray-800 italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        
        <div className="flex flex-wrap gap-2 mt-1">
          {quote.tags.map((tagId) => (
            <div
              key={tagId}
              className={`flex items-center gap-1 transition-all duration-300 ${
                isHovered 
                  ? "bg-gray-100 px-2 py-0.5 rounded-full" 
                  : ""
              }`}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getTagColor(tagId) }}
              />
              {isHovered && (
                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                  {getTagLabel(tagId)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute right-3 top-3 text-[10px] font-mono text-gray-400">
        {quote.timestampDisplay}
      </div>
    </div>
  );
};
