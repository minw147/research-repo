"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, FileDown, FileText } from "lucide-react";

interface ShareReportProps {
  slug: string;
  title: string;
}

export function ShareReport({ slug, title }: ShareReportProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleExportPDF = () => {
    setOpen(false);
    const details = document.querySelectorAll("details");
    const opened: Element[] = [];
    details.forEach((el) => {
      if (!el.hasAttribute("open")) {
        el.setAttribute("open", "");
        opened.push(el);
      }
    });
    window.print();
    const afterPrint = () => {
      opened.forEach((el) => el.removeAttribute("open"));
      window.removeEventListener("afterprint", afterPrint);
    };
    window.addEventListener("afterprint", afterPrint);
  };

  const handleExportHTML = () => {
    setOpen(false);
    const a = document.createElement("a");
    a.href = `../reports-standalone/${slug}.html`;
    a.download = `${slug}.html`;
    a.click();
  };

  return (
    <div className="no-print relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            Export as PDF
          </button>
          <button
            type="button"
            onClick={handleExportHTML}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4 text-slate-500" />
            Download HTML
          </button>
        </div>
      )}
    </div>
  );
}
