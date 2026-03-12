import React, { useMemo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuoteCard } from "./QuoteCard";
import { parseQuote, parseQuotesFromMarkdown } from "@/lib/quote-parser";
import { Codebook, ParsedQuote } from "@/types";

interface MarkdownRendererProps {
  content: string;
  codebook: Codebook;
  onQuoteClick?: (quote: ParsedQuote) => void;
  onQuoteDoubleClick?: (quote: ParsedQuote) => void;
  onQuoteDelete?: (quote: ParsedQuote) => void;
}

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  children?: HastNode[];
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
  onQuoteDelete,
}) => {
  const fileQuotes = useMemo(() => parseQuotesFromMarkdown(content), [content]);

  const components: Components = useMemo(
    () => ({
      li: ({ node, children, ...props }: { node?: HastNode; children?: React.ReactNode }) => {
        const getRawText = (n: HastNode | undefined): string => {
          if (!n) return "";
          if (n.type === "text" && n.value) return n.value;
          if (n.type === "element" && n.children) {
            if (n.tagName === "strong") {
              return `**${n.children.map((c) => getRawText(c as HastNode)).join("")}**`;
            }
            if (n.tagName === "em") {
              return `*${n.children.map((c) => getRawText(c as HastNode)).join("")}*`;
            }
            return n.children.map((c) => getRawText(c as HastNode)).join("");
          }
          return "";
        };

        const rawText = getRawText(node as HastNode);
        const lineToParse = `- ${rawText}`;
        const parsedFromAst = parseQuote(lineToParse);

        if (parsedFromAst) {
          const quote =
            fileQuotes.find(
              (q) =>
                q.text === parsedFromAst!.text &&
                q.startSeconds === parsedFromAst!.startSeconds &&
                q.sessionIndex === parsedFromAst!.sessionIndex
            ) ?? parsedFromAst;
          return (
            <li className="not-prose list-none" {...props}>
              <QuoteCard
                quote={quote}
                codebook={codebook}
                onClick={onQuoteClick || (() => {})}
                onDoubleClick={onQuoteDoubleClick || (() => {})}
                onDelete={onQuoteDelete}
              />
            </li>
          );
        }

        return <li {...props}>{children}</li>;
      },
    }),
    [codebook, onQuoteClick, onQuoteDoubleClick, onQuoteDelete, fileQuotes]
  );

  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-li:my-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
