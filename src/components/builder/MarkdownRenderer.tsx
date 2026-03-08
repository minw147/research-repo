import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuoteCard } from "./QuoteCard";
import { parseQuote } from "@/lib/quote-parser";
import { Codebook, ParsedQuote } from "@/types";

interface MarkdownRendererProps {
  content: string;
  codebook: Codebook;
  onQuoteClick: (quote: ParsedQuote) => void;
  onQuoteDoubleClick: (quote: ParsedQuote) => void;
}

/**
 * MarkdownRenderer component that renders markdown content with inline QuoteCard rendering.
 * It uses react-markdown with remark-gfm and a custom li component to detect and render quotes.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  codebook,
  onQuoteClick,
  onQuoteDoubleClick,
}) => {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-li:my-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          li: ({ node, children, ...props }) => {
            // To detect the quote, we need the raw text content of the list item.
            // We'll try to extract the text content from the node or children.
            
            // Getting raw text from MDAST node if available
            const getRawText = (node: any): string => {
              if (!node) return "";
              if (node.type === "text") return node.value;
              if (node.type === "element") {
                if (node.tagName === "strong") {
                  return `**${node.children.map(getRawText).join("")}**`;
                }
                if (node.tagName === "em") {
                  return `*${node.children.map(getRawText).join("")}*`;
                }
                return node.children.map(getRawText).join("");
              }
              return "";
            };

            const rawText = getRawText(node);
            
            // parseQuote expects the line to start with "- "
            const lineToParse = `- ${rawText}`;
            const parsedQuote = parseQuote(lineToParse);

            if (parsedQuote) {
              return (
                <div className="not-prose list-none">
                  <QuoteCard
                    quote={parsedQuote}
                    codebook={codebook}
                    onClick={onQuoteClick}
                    onDoubleClick={onQuoteDoubleClick}
                  />
                </div>
              );
            }

            return <li {...props}>{children}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
