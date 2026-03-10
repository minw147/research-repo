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

const DS = {
  bg: "#f8f7f5", surface: "#ffffff", primary: "#f59f0a",
  text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0",
};

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

  const sel: React.CSSProperties = {
    padding: "0.5rem 0.75rem", border: `1px solid ${DS.border}`,
    borderRadius: "0.5rem", fontSize: "0.875rem", background: DS.surface,
    color: DS.text, cursor: "pointer",
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: DS.bg, fontFamily: "system-ui" }}><p style={{ color: DS.textMuted }}>Loading…</p></div>;
  if (error) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: DS.bg, fontFamily: "system-ui" }}><p style={{ color: "#dc2626" }}>{error}</p></div>;

  return (
    <div style={{ minHeight: "100vh", background: DS.bg, fontFamily: "'Inter', system-ui, sans-serif", padding: "2rem" }}>
      <header style={{ maxWidth: "1200px", margin: "0 auto 2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: DS.text, letterSpacing: "-0.025em", margin: "0 0 0.25rem" }}>Research Hub</h1>
        <p style={{ color: DS.textMuted, margin: 0 }}>{filtered.length} {filtered.length === 1 ? "study" : "studies"}</p>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto 2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          style={{ ...sel, flex: "1", minWidth: "200px", maxWidth: "360px" }} />
        {(["researcher", "persona", "product"] as const).map(key => (
          <select key={key}
            value={key === "researcher" ? researcher : key === "persona" ? persona : product}
            onChange={e => { const v = e.target.value; key === "researcher" ? setResearcher(v) : key === "persona" ? setPersona(v) : setProduct(v); }}
            style={sel}>
            <option value="all">{key.charAt(0).toUpperCase() + key.slice(1)}: All</option>
            {unique(key).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} style={sel}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">A–Z</option>
        </select>
        {(search || researcher !== "all" || persona !== "all" || product !== "all") && (
          <button onClick={() => { setSearch(""); setResearcher("all"); setPersona("all"); setProduct("all"); }}
            style={{ ...sel, background: "transparent", border: `1px solid ${DS.primary}`, color: DS.primary }}>
            Clear filters
          </button>
        )}
      </div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: DS.textMuted }}>
            No studies match your filters.
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "0.75rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: DS.text, margin: 0 }}>{p.title}</h2>
            <div style={{ fontSize: "0.875rem", color: DS.textMuted, display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
              {p.researcher && <span><strong style={{ color: "#475569" }}>Researcher:</strong> {p.researcher}</span>}
              {p.persona && <span><strong style={{ color: "#475569" }}>Persona:</strong> {p.persona}</span>}
              {p.product && <span><strong style={{ color: "#475569" }}>Product:</strong> {p.product}</span>}
              {p.date && <span><strong style={{ color: "#475569" }}>Date:</strong> {p.date}</span>}
            </div>
            {p.driveFileIds?.clips && Object.entries(p.driveFileIds.clips).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.entries(p.driveFileIds.clips).map(([name, fileId]) => (
                  <video key={name} controls preload="none"
                    style={{ width: "100%", borderRadius: "0.5rem", background: "#000" }}>
                    <source src={`/api/drive/video/${fileId}`} type="video/mp4" />
                  </video>
                ))}
              </div>
            )}
            {p.driveFileIds?.report && (
              <a href={`/api/drive/report/${p.driveFileIds.report}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem 1rem", background: DS.primary, color: "white", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                View Report
              </a>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
