import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, User, Users, Layers, ArrowRight } from "lucide-react";
import type { Project, ProjectStatus } from "@/types";

const statusLabels: Record<ProjectStatus, string> = {
  setup: "Setup",
  findings: "Findings",
  tagged: "Tagged",
  report: "Report",
  exported: "Exported",
  published: "Published",
};

const statusDotColors: Record<ProjectStatus, string> = {
  setup: "bg-stone-400",
  findings: "bg-primary",
  tagged: "bg-ochre-600",
  report: "bg-clay-600",
  exported: "bg-status-back",
  published: "bg-status-right",
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Safe date parsing in case of invalid date strings
  const displayDate = (() => {
    try {
      return format(new Date(project.date), "yyyy-MM-dd");
    } catch {
      return project.date;
    }
  })();

  const sessionCount = String(project.sessions?.length || 0).padStart(2, "0");

  return (
    <Link
      href={`/builder/${project.id}/findings`}
      className="group block bg-white border border-stone-200 rounded-md p-4 hover:border-primary/40 transition-[border-color] duration-200"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-serif font-semibold text-[16px] leading-[1.3] text-stone-900 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColors[project.status] || statusDotColors.setup}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">
          {statusLabels[project.status] || project.status}
        </span>
      </div>

      <div className="space-y-[7px] text-[13px] text-stone-700">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-mono text-xs text-stone-600">{displayDate}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-stone-400" />
          <span>{project.researcher}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-stone-400" />
          <span>{project.persona}</span>
        </div>

        {project.product && (
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>{project.product}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-200">
        <span className="font-mono text-[11px] text-stone-500 bg-stone-100 border border-stone-200 rounded px-[7px] py-0.5">
          {sessionCount} sessions
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          Open <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
