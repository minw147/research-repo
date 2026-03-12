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
    <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Evidence Board</h2>
          <p className="text-sm text-slate-500">
            Quotes grouped by codebook category
          </p>
        </div>
        
        <div className="relative w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search quotes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto bg-slate-50/30 p-6">
        {categoriesToShow.map(category => (
          <div key={category} className="flex h-full w-80 flex-shrink-0 flex-col">
            <div className="mb-4 flex items-center justify-between px-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{category}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-400 shadow-sm ring-1 ring-slate-200">
                {groupedQuotes[category].length}
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
                <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-400">
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
