"use client";

import React, { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { BrandMark } from "@/components/shared/BrandMark";
import type { Project } from "@/types";
import Link from "next/link";
import { Search, Loader2, HelpCircle, Plus } from "lucide-react";

type SortOption = "date-desc" | "date-asc" | "title-asc";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [researcher, setResearcher] = useState("all");
  const [persona, setPersona] = useState("all");
  const [product, setProduct] = useState("all");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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

  const unique = (key: "researcher" | "persona" | "product") =>
    [...new Set(projects.map((p) => p[key]).filter((v): v is string => Boolean(v)))].sort();

  const filteredProjects = projects
    .filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(searchLower) ||
        p.researcher.toLowerCase().includes(searchLower) ||
        p.persona.toLowerCase().includes(searchLower) ||
        (p.product && p.product.toLowerCase().includes(searchLower));
      return (
        matchesSearch &&
        (researcher === "all" || p.researcher === researcher) &&
        (persona === "all" || p.persona === persona) &&
        (product === "all" || p.product === product)
      );
    })
    .sort((a, b) => {
      if (sort === "date-desc") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sort === "date-asc") return (a.date ?? "").localeCompare(b.date ?? "");
      return (a.title ?? "").localeCompare(b.title ?? "");
    });

  const selectClass =
    "h-10 px-3 border border-stone-300 rounded bg-white text-sm text-stone-700 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none";

  return (
    <div className="min-h-screen bg-stone-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-7 pb-5">
        <div className="flex items-baseline gap-2.5">
          <BrandMark size={32} wordmarkClassName="text-[26px]" />
          <span className="font-mono text-[11px] tracking-wider uppercase text-ochre-600">
            · your studies, self-hosted
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/help"
              className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              title="Help: CLI setup"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>
            <div aria-hidden="true" className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-xs font-semibold">
              JS
            </div>
          </div>
        </div>
        <p className="text-[13px] text-stone-500 mt-1">
          {projects.length} {projects.length === 1 ? "study" : "studies"}
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-5 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" aria-hidden="true" />
          <input
            aria-label="Search projects by title, researcher, or persona"
            className="w-full h-10 bg-white border border-stone-300 rounded pl-9 pr-3 text-sm text-stone-900 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none transition-shadow"
            placeholder="Search studies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={researcher} onChange={(e) => setResearcher(e.target.value)} className={selectClass} aria-label="Filter by researcher">
          <option value="all">Researcher: All</option>
          {unique("researcher").map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={persona} onChange={(e) => setPersona(e.target.value)} className={selectClass} aria-label="Filter by persona">
          <option value="all">Persona: All</option>
          {unique("persona").map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={product} onChange={(e) => setProduct(e.target.value)} className={selectClass} aria-label="Filter by product">
          <option value="all">Product: All</option>
          {unique("product").map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className={selectClass} aria-label="Sort projects">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">A–Z</option>
        </select>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center gap-2 h-10 px-4 rounded bg-clay-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/15">
            <Plus className="w-3.5 h-3.5" />
          </span>
          New project
        </button>
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-10">
        {isLoading ? (
          <div role="status" aria-label="Loading projects" className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-4 text-stone-500 text-xs font-medium uppercase tracking-wider">
              Fetching studies…
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {filteredProjects.length === 0 && projects.length > 0 && (
              <div className="text-center py-16 bg-white rounded-md border-2 border-dashed border-stone-200 mt-6">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-stone-700 text-base font-semibold">
                  No studies match your filters
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setResearcher("all");
                    setPersona("all");
                    setProduct("all");
                  }}
                  className="text-primary mt-3 text-sm font-semibold hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
}
