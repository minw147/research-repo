"use client";

import React, { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import type { Project } from "@/types";
import { Search, Loader2 } from "lucide-react";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(searchLower) ||
      p.researcher.toLowerCase().includes(searchLower) ||
      p.persona.toLowerCase().includes(searchLower) ||
      (p.product && p.product.toLowerCase().includes(searchLower))
    );
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-xl leading-none">
                R
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Report Builder
            </h1>
          </div>

          <div className="relative w-full max-w-md mx-8 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full bg-slate-100 border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-slate-200 transition-all outline-none"
              placeholder="Search projects by title, researcher, or persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
              JS
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Research Hub
            </h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              Organize your insights, manage sessions, and build reports.
            </p>
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-500 font-bold tracking-wide uppercase text-xs">
              Fetching Projects...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <NewProjectModal />
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {!isLoading && filteredProjects.length === 0 && search && (
              <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 mt-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-xl">
                  No projects found matching &quot;{search}&quot;
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="text-blue-600 mt-4 font-black hover:underline tracking-tight"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
