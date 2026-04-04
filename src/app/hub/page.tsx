// src/app/hub/page.tsx
"use client";

import { useEffect, useState } from "react";

interface RepoEntry {
  id: string;
  title: string;
  date?: string;
  researcher?: string;
  persona?: string;
  product?: string;
  driveFileIds?: {
    report?: string;
    clips?: Record<string, string>;
  };
}

export default function HubPage() {
  const [projects, setProjects] = useState<RepoEntry[]>([]);
  const [filtered, setFiltered] = useState<RepoEntry[]>([]);
  const [search, setSearch] = useState("");
  const [researcher, setResearcher] = useState("all");
  const [persona, setPersona] = useState("all");
  const [product, setProduct] = useState("all");
  const [sort, setSort] = useState("date-desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/drive/index")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setProjects(data); setFiltered(data); }
        else setError(data.error ?? "Failed to load projects");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...projects];
    const q = search.toLowerCase();
    if (q) result = result.filter(p =>
      [p.title, p.researcher, p.persona, p.product].some(f => f?.toLowerCase().includes(q))
    );
    if (researcher !== "all") result = result.filter(p => p.researcher === researcher);
    if (persona !== "all") result = result.filter(p => p.persona === persona);
    if (product !== "all") result = result.filter(p => p.product === product);
    result.sort((a, b) => {
      if (sort === "date-desc") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sort === "date-asc") return (a.date ?? "").localeCompare(b.date ?? "");
      return (a.title ?? "").localeCompare(b.title ?? "");
    });
    setFiltered(result);
  }, [projects, search, researcher, persona, product, sort]);

  const unique = (key: keyof RepoEntry) =>
    [...new Set(projects.map(p => p[key] as string).filter(Boolean))].sort();

  const selClass = "px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 cursor-pointer";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background-light font-sans">
      <p className="text-slate-500">Loading…</p>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-background-light font-sans">
      <p className="text-red-600">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light font-sans p-8">
      <header className="max-w-[1200px] mx-auto mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Research Hub</h1>
        <p className="text-slate-500">{filtered.length} {filtered.length === 1 ? "study" : "studies"}</p>
      </header>

      <div className="max-w-[1200px] mx-auto mb-8 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          className={`${selClass} flex-1 min-w-[200px] max-w-[360px]`} />
        {(["researcher", "persona", "product"] as const).map(key => (
          <select key={key}
            value={key === "researcher" ? researcher : key === "persona" ? persona : product}
            onChange={e => { const v = e.target.value; key === "researcher" ? setResearcher(v) : key === "persona" ? setPersona(v) : setProduct(v); }}
            className={selClass}>
            <option value="all">{key.charAt(0).toUpperCase() + key.slice(1)}: All</option>
            {unique(key).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} className={selClass}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">A–Z</option>
        </select>
        {(search || researcher !== "all" || persona !== "all" || product !== "all") && (
          <button onClick={() => { setSearch(""); setResearcher("all"); setPersona("all"); setProduct("all"); }}
            className="px-3 py-2 border border-primary text-primary bg-transparent rounded-lg text-sm cursor-pointer">
            Clear filters
          </button>
        )}
      </div>

      <main className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            No studies match your filters.
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-900">{p.title}</h2>
            <div className="text-sm text-slate-500 flex flex-col gap-1 flex-1">
              {p.researcher && <span><strong className="text-slate-600">Researcher:</strong> {p.researcher}</span>}
              {p.persona && <span><strong className="text-slate-600">Persona:</strong> {p.persona}</span>}
              {p.product && <span><strong className="text-slate-600">Product:</strong> {p.product}</span>}
              {p.date && <span><strong className="text-slate-600">Date:</strong> {p.date}</span>}
            </div>
            {p.driveFileIds?.clips && Object.entries(p.driveFileIds.clips).length > 0 && (
              <div className="flex flex-col gap-2">
                {Object.entries(p.driveFileIds.clips).map(([name, fileId]) => (
                  <video key={name} controls preload="none"
                    className="w-full rounded-lg bg-black">
                    <source src={`/api/drive/video/${fileId}`} type="video/mp4" />
                  </video>
                ))}
              </div>
            )}
            {p.driveFileIds?.report && (
              <a href={`/api/drive/report/${p.driveFileIds.report}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold no-underline">
                View Report
              </a>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
