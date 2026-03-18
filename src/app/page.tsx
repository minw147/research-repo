"use client";

import React, { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import type { Project } from "@/types";
import Link from "next/link";
import { Search, Loader2, HelpCircle, Box } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="font-sans bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <Box className="h-5 w-5 text-primary" />
            <span>Research Hub</span>
          </Link>

          <div className="relative w-full max-w-md mx-8 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              aria-label="Search projects by title, researcher, or persona"
              className="w-full bg-slate-100 border border-transparent rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:bg-white focus:border-slate-200 transition-all outline-none"
              placeholder="Search projects by title, researcher, or persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/help"
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              title="Help: CLI setup"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>
            <div aria-hidden="true" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-semibold">
              JS
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Organize your insights, manage sessions, and build reports.
            </p>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>

        {isLoading ? (
          <div role="status" aria-label="Loading projects" className="flex flex-col items-center justify-center py-16">
            <div aria-hidden="true" className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-xs font-medium uppercase tracking-wider">
              Fetching Projects...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NewProjectModal />
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {!isLoading && filteredProjects.length === 0 && search && (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200 mt-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-600 text-base font-semibold">
                  No projects found matching &quot;{search}&quot;
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="text-primary mt-3 text-sm font-semibold hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
