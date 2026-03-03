"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { StudyWithContent } from "@/types";

type SortOption = "date-desc" | "date-asc" | "title";

export function LibraryClient({ studies }: { studies: StudyWithContent[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [personaFilter, setPersonaFilter] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("date-desc");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) setSearch(q);
  }, [searchParams]);

  const personas = useMemo(
    () => Array.from(new Set(studies.map((s) => s.persona).filter(Boolean))),
    [studies]
  );
  const products = useMemo(
    () =>
      Array.from(
        new Set(studies.map((s) => s.product).filter((p): p is string => !!p))
      ).sort(),
    [studies]
  );

  const filtered = useMemo(() => {
    return studies.filter((study) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        study.title.toLowerCase().includes(searchLower) ||
        study.persona.toLowerCase().includes(searchLower) ||
        (study.product?.toLowerCase().includes(searchLower) ?? false) ||
        (study.searchText?.toLowerCase().includes(searchLower) ?? false);
      const matchesPersona = !personaFilter || study.persona === personaFilter;
      const matchesProduct =
        !productFilter || study.product === productFilter;
      return matchesSearch && matchesPersona && matchesProduct;
    });
  }, [studies, search, personaFilter, productFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "date-desc") {
      copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === "date-asc") {
      copy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    return copy;
  }, [filtered, sort]);

  const hasActiveFilters = !!(search || personaFilter || productFilter);

  const clearFilters = () => {
    setSearch("");
    setPersonaFilter("");
    setProductFilter("");
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative flex flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search title, report content, persona, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Persona:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPersonaFilter("")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                !personaFilter
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
          {personas.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPersonaFilter(p)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  personaFilter === p
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Product:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setProductFilter("")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                !productFilter
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
          {products.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProductFilter(p)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  productFilter === p
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {/* Result count + Clear filters */}
      <div className="mb-4 flex items-center gap-3">
        <p className="text-sm text-slate-600">
          Showing {sorted.length} of {studies.length} reports
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Study Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((study) => (
          <Link
            key={study.id}
            href={`/reports/${study.reportFile.replace(/\.mdx?$/, "")}`}
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md cursor-pointer"
          >
            <h2 className="font-semibold text-slate-900 group-hover:text-primary">
              {study.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {format(new Date(study.date), "MMM d, yyyy")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {study.persona}
              </span>
              {study.product && (
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {study.product}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            {studies.length === 0
              ? "No reports yet."
              : "No reports match your filters."}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add entries to{" "}
            <code className="rounded bg-slate-200 px-1">
              data/research-index.json
            </code>{" "}
            and reports to{" "}
            <code className="rounded bg-slate-200 px-1">content/reports/</code>
          </p>
        </div>
      )}
    </>
  );
}
