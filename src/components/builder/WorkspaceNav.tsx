"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, Tag, Share2, Box } from "lucide-react";
import type { Project } from "@/types";

interface WorkspaceNavProps {
  slug: string;
}

export function WorkspaceNav({ slug }: WorkspaceNavProps) {
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
    { id: "export", label: "Export", href: `/builder/${slug}/export`, icon: Share2 },
  ];

  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href))?.id || "findings";

  return (
    <nav className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Box className="h-5 w-5 text-indigo-600" />
          <span>Report Builder</span>
        </Link>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Project:</span>
          <span className="text-sm font-semibold text-slate-900">
            {project?.title || "Loading..."}
          </span>
        </div>
      </div>

      <div className="flex h-full items-center gap-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex h-full items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {/* Placeholder for future user profile or global actions */}
      </div>
    </nav>
  );
}
