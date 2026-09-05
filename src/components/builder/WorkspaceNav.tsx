"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, Tag, Cloud, HelpCircle } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import type { Project } from "@/types";

interface WorkspaceNavProps {
  slug: string;
  onOpenCodebook?: () => void;
}

export function WorkspaceNav({ slug, onOpenCodebook }: WorkspaceNavProps) {
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    }
    fetchProject();
  }, [slug]);

  const tabs = [
    { id: "findings", label: "Findings", href: `/builder/${slug}/findings`, icon: LayoutDashboard },
    { id: "tags", label: "Tags", href: `/builder/${slug}/tags`, icon: Tag },
    { id: "report", label: "Report", href: `/builder/${slug}/report`, icon: FileText },
    { id: "cloud-storage", label: "Storage", href: `/builder/${slug}/export`, icon: Cloud },
  ];

  return (
    <nav className="flex h-12 items-center gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-1 rounded-lg -m-1 p-1 cursor-pointer"
        aria-label="Research Hub home"
      >
        <BrandMark size={22} wordmarkClassName="text-sm hidden sm:inline" />
      </Link>

      <div className="h-4 w-px shrink-0 bg-stone-200" aria-hidden />

      <div className="flex min-w-0 shrink items-center gap-2 mr-2">
        <span className="truncate text-xs font-medium text-stone-600">
          {project?.title || "Loading..."}
        </span>
      </div>

      {/* Tabs — plain style with bottom underline for active state */}
      <div
        role="tablist"
        className="flex h-full items-center gap-1"
        aria-label="Workspace navigation"
      >
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={`flex h-full min-w-[44px] items-center justify-center gap-1.5 border-b-2 px-3 text-[12.5px] whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-0 cursor-pointer ${
                isActive
                  ? "border-primary text-stone-900 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="hidden md:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {onOpenCodebook && (
        <button
          onClick={onOpenCodebook}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs text-stone-600 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-1 cursor-pointer"
          aria-label="Codebook"
        >
          <Tag className="h-4 w-4" />
          <span className="hidden sm:inline">Codebook</span>
        </button>
      )}

      <Link
        href="/help"
        className={`${onOpenCodebook ? "" : "ml-auto "}flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs text-stone-600 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-1 cursor-pointer`}
        title="Help: CLI setup"
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help</span>
      </Link>
    </nav>
  );
}
