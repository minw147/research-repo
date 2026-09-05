import React, { useMemo, useState } from "react";
import { QuoteCard } from "./QuoteCard";
import { parseQuotesFromMarkdown } from "@/lib/quote-parser";
import { Codebook, ParsedQuote } from "@/types";
import { Search, X } from "lucide-react";

interface TagBoardProps {
  findings: string;
  codebook: Codebook;
  onQuoteClick?: (quote: ParsedQuote) => void;
  onQuoteDoubleClick?: (quote: ParsedQuote) => void;
}

export const TagBoard: React.FC<TagBoardProps> = ({
  findings,
  codebook,
  onQuoteClick,
  onQuoteDoubleClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const quotes = useMemo(() => parseQuotesFromMarkdown(findings), [findings]);

  // Group quotes by category
  const groupedQuotes = useMemo(() => {
    const groups: Record<string, ParsedQuote[]> = {};
    
    // Initialize groups for all categories in codebook
    codebook.categories.forEach(cat => {
      groups[cat] = [];
    });

    // Add an "Uncategorized" group for tags without a category or no tags at all
    const uncategorizedKey = "Uncategorized";
    groups[uncategorizedKey] = [];

    const lowerQuery = searchQuery.toLowerCase();
    const filteredQuotes = quotes.filter(quote => {
      if (!searchQuery) return true;
      
      const matchesText = quote.text.toLowerCase().includes(lowerQuery);
      const matchesTags = quote.tags.some(tagId => {
        const tag = codebook.tags.find(t => t.id === tagId);
        return tag?.label.toLowerCase().includes(lowerQuery);
      });
      
      return matchesText || matchesTags;
    });

    filteredQuotes.forEach(quote => {
      if (quote.tags.length === 0) {
        groups[uncategorizedKey].push(quote);
        return;
      }

      const quoteCategories = new Set<string>();
      quote.tags.forEach(tagId => {
        const tag = codebook.tags.find(t => t.id === tagId);
        const category = tag?.category || uncategorizedKey;
        quoteCategories.add(category);
      });

      quoteCategories.forEach(cat => {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(quote);
      });
    });

    // Only keep categories that have at least one quote, or are in the codebook.categories list
    const finalGroups: Record<string, ParsedQuote[]> = {};
    codebook.categories.forEach(cat => {
      finalGroups[cat] = groups[cat] || [];
    });
    
    if (groups[uncategorizedKey].length > 0) {
      finalGroups[uncategorizedKey] = groups[uncategorizedKey];
    }

    return finalGroups;
  }, [quotes, codebook, searchQuery]);

  const categoriesToShow = Object.keys(groupedQuotes);

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-md border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100/50 px-6 py-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-stone-900">Evidence board</h2>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            Quotes grouped by codebook category
          </p>
        </div>
        
        <div className="relative w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <input
            type="text"
            className="block w-full h-10 rounded border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            placeholder="Search quotes or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="h-4 w-4 text-stone-400 hover:text-stone-900" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto bg-stone-100/40 p-6">
        {categoriesToShow.map(category => (
          <div key={category} className="flex h-full w-80 flex-shrink-0 flex-col">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-700">{category}</h3>
              <span className="font-mono rounded-full bg-white border border-stone-200 px-1.5 py-px text-[10.5px] text-stone-500">
                {String(groupedQuotes[category].length).padStart(2, "0")}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-1">
              {groupedQuotes[category].length > 0 ? (
                groupedQuotes[category].map((quote, idx) => (
                  <QuoteCard
                    key={`${quote.rawLine}-${idx}`}
                    quote={quote}
                    codebook={codebook}
                    onClick={onQuoteClick}
                    onDoubleClick={onQuoteDoubleClick}
                  />
                ))
              ) : (
                <div className="flex h-[100px] items-center justify-center rounded border-[1.5px] border-dashed border-stone-300 text-xs text-stone-400">
                  No evidence
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
