import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, User, Users, Layers, ArrowRight, Circle, Search, Tag, FileText, Upload, Globe } from "lucide-react";
import type { Project, ProjectStatus } from "@/types";

const statusIcons: Record<ProjectStatus, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  setup: Circle,
  findings: Search,
  tagged: Tag,
  report: FileText,
  exported: Upload,
  published: Globe,
};

const statusColors: Record<ProjectStatus, string> = {
  setup: "bg-gray-100 text-gray-700 border-gray-200",
  findings: "bg-blue-100 text-blue-700 border-blue-200",
  tagged: "bg-purple-100 text-purple-700 border-purple-200",
  report: "bg-green-100 text-green-700 border-green-200",
  exported: "bg-emerald-100 text-emerald-700 border-emerald-200",
  published: "bg-teal-100 text-teal-700 border-teal-200",
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const StatusIcon = statusIcons[project.status] || statusIcons.setup;

  // Safe date parsing in case of invalid date strings
  const displayDate = (() => {
    try {
      return format(new Date(project.date), "MMM d, yyyy");
    } catch {
      return project.date;
    }
  })();

  return (
    <Link
      href={`/builder/${project.id}/findings`}
      className="group block p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusColors[project.status] || statusColors.setup}`}>
          <StatusIcon className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
          {project.status}
        </span>
      </div>

      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{displayDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span>{project.researcher}</span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <span>Persona: {project.persona}</span>
        </div>

        {project.product && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Product: {project.product}</span>
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-4 h-4 text-slate-500" />
            <span>{project.sessions?.length || 0} sessions</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary text-xs">
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
