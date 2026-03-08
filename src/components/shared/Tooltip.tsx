"use client";

import { useState } from "react";

interface TooltipProps {
  children: React.ReactNode;
  /** Text shown on hover (supports simple markdown-like **bold**) */
  content: React.ReactNode;
}

export function Tooltip({ children, content }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-primary/50 text-primary decoration-primary/50 underline-offset-2 hover:border-primary hover:decoration-primary">
        {children}
      </span>
      {show && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white shadow-lg"
          role="tooltip"
        >
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

export default Tooltip;
